import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { validateBody } from "../middleware/validate";
import { chatSchema } from "../validators/ai.validator";
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

export default router;