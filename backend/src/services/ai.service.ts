import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

interface CategorizeResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Ask Gemini to pick the best-matching category for a free-text expense
 * description, constrained to the user's own EXPENSE categories so it can
 * never suggest a category that doesn't exist or isn't theirs.
 */
export async function categorizeTransaction(
  userId: string,
  description: string
): Promise<CategorizeResult> {
  if (!env.gemini.apiKey) {
    throw new AppError(
      "AI categorization isn't configured yet. Add GEMINI_API_KEY to the backend .env.",
      503
    );
  }

  const categories = await prisma.category.findMany({
    where: { userId, type: "EXPENSE" },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    throw new AppError("No expense categories exist to categorize into.", 400);
  }

  const categoryNames = categories.map((c: { name: string }) => c.name);

  const prompt = [
    "You are a personal-finance categorization assistant.",
    "Given a short expense description, pick the single best matching category",
    "from this exact list (respond with the name exactly as written, no others):",
    JSON.stringify(categoryNames),
    "",
    `Expense description: "${description}"`,
    "",
    "Respond ONLY with JSON in this exact shape, no markdown, no extra text:",
    `{"category": "<one of the list above>", "confidence": <number between 0 and 1>}`,
  ].join("\n");

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_ENDPOINT(env.gemini.model)}?key=${env.gemini.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            // temperature/top_p/top_k are deprecated on Gemini 3.x models
            // (silently ignored today, but Google warns they'll start
            // erroring in a future version) — thinking_level is the
            // replacement lever, and "minimal" is the right choice for a
            // simple classification task like this one.
            thinkingConfig: { thinkingLevel: "minimal" },
            responseMimeType: "application/json",
          },
        }),
      }
    );
  } catch {
    throw new AppError("Couldn't reach the AI categorization service. Try again.", 502);
  }

  if (!response.ok) {
    // Gemini's error body usually has a useful message; don't leak raw
    // upstream details to the client, just log them server-side.
    const body = await response.text().catch(() => "");
    console.error("Gemini categorize error:", response.status, body);
    throw new AppError("AI categorization failed. Try again in a moment.", 502);
  }

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new AppError("AI categorization returned an empty response.", 502);
  }

  let parsed: { category?: string; confidence?: number };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError("AI categorization returned an unexpected format.", 502);
  }

  const match = categories.find(
    (c: { id: string; name: string }) => c.name.toLowerCase() === parsed.category?.toLowerCase()
  );

  if (!match) {
    throw new AppError("AI couldn't confidently match a category. Pick one manually.", 422);
  }

  return {
    categoryId: match.id,
    categoryName: match.name,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_TURNS = 12;
const MAX_TRANSACTIONS_IN_CONTEXT = 80;

/**
 * Builds a compact, text-only snapshot of the user's real financial data
 * (recent transactions, this month's budgets, goals) so the assistant's
 * answers are grounded in what's actually in their account rather than
 * generic financial advice.
 */
async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 2, 1)); // last ~3 months

  const [user, transactions, budgets, goals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, baseCurrency: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: periodStart } },
      include: { category: true },
      orderBy: { date: "desc" },
      take: MAX_TRANSACTIONS_IN_CONTEXT,
    }),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: true },
    }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  const totalIncome = transactions
    .filter((t: { type: string }) => t.type === "INCOME")
    .reduce((sum: number, t: { amount: unknown }) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t: { type: string }) => t.type === "EXPENSE")
    .reduce((sum: number, t: { amount: unknown }) => sum + Number(t.amount), 0);

  const spendByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category.name;
    spendByCategory.set(key, (spendByCategory.get(key) ?? 0) + Number(t.amount));
  }
  const categoryLines = [...spendByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => `  - ${name}: ${total.toFixed(2)}`)
    .join("\n");

  // Separate breakdown scoped to the current calendar month, since the
  // 3-month window above can't answer "how much did I spend this month"
  // on its own — the model would otherwise have to (unreliably) re-derive
  // this by filtering the raw transaction list itself.
  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const spendByCategoryThisMonth = new Map<string, number>();
  let totalExpenseThisMonth = 0;
  let totalIncomeThisMonth = 0;
  for (const t of transactions) {
    if (t.date < currentMonthStart) continue;
    if (t.type === "EXPENSE") {
      const key = t.category.name;
      spendByCategoryThisMonth.set(key, (spendByCategoryThisMonth.get(key) ?? 0) + Number(t.amount));
      totalExpenseThisMonth += Number(t.amount);
    } else {
      totalIncomeThisMonth += Number(t.amount);
    }
  }
  const categoryLinesThisMonth = [...spendByCategoryThisMonth.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => `  - ${name}: ${total.toFixed(2)}`)
    .join("\n");

  const budgetLines = budgets
    .map((b: { category: { name: string }; amount: unknown }) => `  - ${b.category.name}: limit ${Number(b.amount).toFixed(2)}`)
    .join("\n") || "  (none set for this month)";

  const goalLines = goals
    .map(
      (g: { name: string; targetAmount: unknown; savedAmount: unknown; targetDate: Date | null }) =>
        `  - ${g.name}: saved ${Number(g.savedAmount).toFixed(2)} of ${Number(g.targetAmount).toFixed(2)}${
          g.targetDate ? ` (target date ${g.targetDate.toISOString().slice(0, 10)})` : ""
        }`
    )
    .join("\n") || "  (none set)";

  const transactionLines = transactions
    .slice(0, MAX_TRANSACTIONS_IN_CONTEXT)
    .map(
      (t: { date: Date; type: string; amount: unknown; category: { name: string }; description: string }) =>
        `  - ${t.date.toISOString().slice(0, 10)} | ${t.type} | ${Number(t.amount).toFixed(2)} | ${
          t.category.name
        } | ${t.description}`
    )
    .join("\n") || "  (no transactions in this period)";

  return [
    `User: ${user?.name ?? "Unknown"} (base currency: ${user?.baseCurrency ?? "INR"})`,
    `Today's date: ${now.toISOString().slice(0, 10)}.`,
    `Data window: last ~3 months, up to ${MAX_TRANSACTIONS_IN_CONTEXT} most recent transactions.`,
    "",
    `Current calendar month totals — income: ${totalIncomeThisMonth.toFixed(2)}, expenses: ${totalExpenseThisMonth.toFixed(2)}.`,
    "Spending by category (current calendar month only):",
    categoryLinesThisMonth || "  (no expenses so far this month)",
    "",
    `Totals over the full ~3-month window — income: ${totalIncome.toFixed(2)}, expenses: ${totalExpense.toFixed(2)}.`,
    "Spending by category (full ~3-month window):",
    categoryLines || "  (no expenses in this period)",
    "",
    "Budgets (current calendar month):",
    budgetLines,
    "",
    "Savings goals:",
    goalLines,
    "",
    "Recent transactions (date | type | amount | category | description):",
    transactionLines,
  ].join("\n");
}

/**
 * Chat-style Q&A grounded in the user's real transaction/budget/goal data.
 * The financial data is injected as a system instruction on every call
 * (stateless on the backend — the client resends the conversation history),
 * so the model always answers against a fresh snapshot rather than data
 * that might be stale by the time a long conversation continues.
 */
export async function chatWithAssistant(
  userId: string,
  message: string,
  history: ChatMessage[]
): Promise<string> {
  if (!env.gemini.apiKey) {
    throw new AppError(
      "The AI assistant isn't configured yet. Add GEMINI_API_KEY to the backend .env.",
      503
    );
  }

  const context = await buildFinancialContext(userId);

  const systemInstruction = [
    "You are a helpful personal finance assistant embedded in a finance-tracking app.",
    "Answer the user's questions ONLY using the financial data snapshot provided below.",
    "The snapshot includes two separate spending breakdowns: one scoped to the current calendar month, and one scoped to the full ~3-month window. When the user asks about 'this month', use the current-month breakdown. When they ask about 'recently' or don't specify a period, use the 3-month figures and say so.",
    "If the data doesn't contain what's needed to answer, say so plainly instead of guessing or inventing numbers.",
    "Be concise and conversational. Use the user's base currency when quoting amounts, without inventing an exchange rate.",
    "You are not a licensed financial advisor — avoid specific investment, tax, or legal recommendations; you can describe spending patterns, budget status, and progress toward goals.",
    "",
    "=== Financial data snapshot ===",
    context,
  ].join("\n");

  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS * 2);

  const contents = [
    ...trimmedHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT(env.gemini.model)}?key=${env.gemini.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      }),
    });
  } catch {
    throw new AppError("Couldn't reach the AI assistant. Try again.", 502);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Gemini chat error:", response.status, body);
    throw new AppError("The AI assistant failed to respond. Try again in a moment.", 502);
  }

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new AppError("The AI assistant returned an empty response.", 502);
  }

  return text.trim();
}