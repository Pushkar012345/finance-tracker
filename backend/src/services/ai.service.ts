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