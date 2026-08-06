import { Response, NextFunction } from "express";
import multer from "multer";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { ValidatedRequest } from "../middleware/validate";
import { prisma } from "../lib/prisma";
import { chatWithAssistant, scanReceipt, generateMonthlyReport } from "../services/ai.service";
import { renderMonthlyReportPdf } from "../services/pdf.service";

export async function chat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, history } = req.body;
    const reply = await chatWithAssistant(req.userId!, message, history);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}

// Lists past monthly reports, most recent first, so the frontend can
// render a history view without needing to know which months exist.
export async function listReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reports = await prisma.aIReport.findMany({
      where: { userId: req.userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

// Returns the cached report for a month if one exists; otherwise generates
// it on the spot. This keeps the "view a report" flow working even before
// the monthly cron job has run (e.g. the first time a user visits).
export async function getOrGenerateReport(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.validatedQuery;

    const existing = await prisma.aIReport.findUnique({
      where: { userId_month_year: { userId: req.userId!, month, year } },
    });
    if (existing) return res.json(existing);

    const report = await generateMonthlyReport(req.userId!, month, year);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// Force-regenerates a report even if a cached one exists, for a
// "regenerate" button on the frontend.
export async function regenerateReport(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.body;
    const report = await generateMonthlyReport(req.userId!, month, year);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// Streams a previously generated report as a downloadable PDF. Renders
// straight from the cached summary/stats — no AI call, so this is free to
// hit repeatedly (e.g. the user re-downloading the same month).
export async function getReportPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const report = await prisma.aIReport.findUnique({ where: { id } });
    if (!report || report.userId !== req.userId) {
      throw new AppError("Report not found.", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, baseCurrency: true },
    });

    const pdfBuffer = await renderMonthlyReportPdf({
      userName: user?.name ?? "User",
      baseCurrency: user?.baseCurrency ?? "INR",
      month: report.month,
      year: report.year,
      summary: report.summary,
      stats: report.stats as any,
      generatedAt: report.updatedAt,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="finance-report-${report.year}-${String(report.month).padStart(2, "0")}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed.", 400));
    }
    cb(null, true);
  },
}).single("receipt");

export function receiptUploadMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  upload(req, res, (err: unknown) => {
    if (err) {
      return next(err instanceof AppError ? err : new AppError((err as Error).message || "Upload failed.", 400));
    }
    next();
  });
}

export async function scanReceiptHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError("No receipt image uploaded.", 400);
    const result = await scanReceipt(req.userId!, file.buffer, file.mimetype);
    res.json(result);
  } catch (err) {
    next(err);
  }
}