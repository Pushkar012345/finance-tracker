import { Response, NextFunction } from "express";
import multer from "multer";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { chatWithAssistant, scanReceipt } from "../services/ai.service";

export async function chat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, history } = req.body;
    const reply = await chatWithAssistant(req.userId!, message, history);
    res.json({ reply });
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