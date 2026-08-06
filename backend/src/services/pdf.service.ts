import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { MonthlyReportStats } from "./ai.service";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ReportPdfInput {
  userName: string;
  baseCurrency: string;
  month: number;
  year: number;
  summary: string;
  stats: MonthlyReportStats;
  generatedAt: Date;
}

const MARGIN = 50;
const GREEN = rgb(0.16, 0.42, 0.27); // Sprout-style dark green for headings
const GRAY = rgb(0.4, 0.4, 0.4);
const RED = rgb(0.75, 0.2, 0.2);

// pdf-lib's StandardFonts use the WinAnsi (cp1252) encoding, which does not
// include many currency symbols (₹, ₩, ₽, ₫, ₪, etc). Rather than embedding
// a full Unicode font just for a handful of symbols, swap known ones for an
// ASCII-safe equivalent, then strip anything else WinAnsi still can't encode
// so report generation never crashes on unexpected characters (emoji, etc).
const CURRENCY_FALLBACKS: Record<string, string> = {
  "₹": "Rs.",
  "₩": "KRW",
  "₽": "RUB",
  "₫": "VND",
  "₪": "NIS",
  "₦": "NGN",
  "₴": "UAH",
};

function sanitizeForPdf(text: string): string {
  let out = text.replace(/[₹₩₽₫₪₦₴]/g, (ch) => CURRENCY_FALLBACKS[ch] ?? "?");
  // Final safety net: WinAnsi covers Latin-1-ish territory; anything outside
  // that range (unknown symbols, emoji, etc) becomes "?" instead of crashing.
  out = out.replace(/[^\x00-\xFF]/g, "?");
  return out;
}

/**
 * Renders a cached AIReport (summary + stats) into a downloadable PDF using
 * pdf-lib. Kept as a pure function of already-generated data — this never
 * calls Gemini, it just lays out what's already in AIReports.stats/summary,
 * so downloading a PDF costs no extra AI credits.
 */
export async function renderMonthlyReportPdf(input: ReportPdfInput): Promise<Buffer> {
  const { userName, baseCurrency, month, year, summary, stats, generatedAt } = input;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = page.getSize();
  let y = height - MARGIN;

  const fmt = (n: number) => `${baseCurrency} ${n.toFixed(2)}`;

  function newPageIfNeeded(spaceNeeded: number) {
    if (y - spaceNeeded < MARGIN) {
      page = pdfDoc.addPage(PageSizes.A4);
      ({ width, height } = page.getSize());
      y = height - MARGIN;
    }
  }

  function drawText(
    text: string,
    opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb>; gap?: number } = {}
  ) {
    const { size = 11, f = font, color = rgb(0, 0, 0), gap = 16 } = opts;
    newPageIfNeeded(gap);
    page.drawText(sanitizeForPdf(text), { x: MARGIN, y, size, font: f, color });
    y -= gap;
  }

  // Word-wraps a paragraph to fit the page width and draws each line.
  function drawParagraph(text: string, opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb> } = {}) {
    const { size = 11, f = font, color = rgb(0.15, 0.15, 0.15) } = opts;
    const maxWidth = width - MARGIN * 2;
    const words = sanitizeForPdf(text).split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        drawText(line, { size, f, color, gap: size + 5 });
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) drawText(line, { size, f, color, gap: size + 5 });
  }

  // Header
  drawText("Monthly Finance Report", { size: 20, f: bold, color: GREEN, gap: 26 });
  drawText(`${MONTH_NAMES[month - 1]} ${year} — ${userName}`, { size: 13, f: bold, gap: 18 });
  drawText(`Generated ${generatedAt.toISOString().slice(0, 10)}`, { size: 9, color: GRAY, gap: 22 });

  // Summary
  drawText("Summary", { size: 14, f: bold, color: GREEN, gap: 18 });
  drawParagraph(summary, { size: 11 });
  y -= 10;

  // Totals
  drawText("Overview", { size: 14, f: bold, color: GREEN, gap: 18 });
  drawText(`Total income: ${fmt(stats.totalIncome)}`, { gap: 15 });
  drawText(`Total expenses: ${fmt(stats.totalExpense)}`, { gap: 15 });
  drawText(`Net savings: ${fmt(stats.netSavings)}`, {
    f: bold,
    color: stats.netSavings >= 0 ? GREEN : RED,
    gap: 15,
  });
  drawText(`Transactions: ${stats.transactionCount}`, { gap: 20 });

  // Spending by category
  if (stats.spendByCategory.length > 0) {
    drawText("Spending by category", { size: 14, f: bold, color: GREEN, gap: 18 });
    for (const c of stats.spendByCategory) {
      drawText(`  ${c.category}: ${fmt(c.amount)}`, { gap: 15 });
    }
    y -= 8;
  }

  // Budgets
  if (stats.budgets.length > 0) {
    drawText("Budgets", { size: 14, f: bold, color: GREEN, gap: 18 });
    for (const b of stats.budgets) {
      const over = b.percentUsed > 100;
      drawText(
        `  ${b.category}: ${fmt(b.spent)} of ${fmt(b.limit)} (${b.percentUsed}%)${over ? "  — over budget" : ""}`,
        { color: over ? RED : rgb(0, 0, 0), gap: 15 }
      );
    }
    y -= 8;
  }

  // Goals
  if (stats.goals.length > 0) {
    drawText("Savings goals", { size: 14, f: bold, color: GREEN, gap: 18 });
    for (const g of stats.goals) {
      drawText(
        `  ${g.name}: ${fmt(g.savedAmount)} of ${fmt(g.targetAmount)} (${g.percentComplete}%)`,
        { gap: 15 }
      );
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}