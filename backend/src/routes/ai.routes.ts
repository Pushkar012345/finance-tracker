import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { validateBody, validateQuery } from "../middleware/validate";
import { chatSchema, monthlyReportSchema } from "../validators/ai.validator";
import { requireAuth } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(requireAuth);
router.use(aiRateLimiter);

router.post("/chat", validateBody(chatSchema), aiController.chat);
router.post(
  "/receipt-scan",
  aiController.receiptUploadMiddleware,
  aiController.scanReceiptHandler
);

router.get("/reports", aiController.listReports);
router.get("/reports/:id/pdf", aiController.getReportPdf);
router.get("/reports/one", validateQuery(monthlyReportSchema), aiController.getOrGenerateReport);
router.post("/reports/generate", validateBody(monthlyReportSchema), aiController.regenerateReport);

export default router;