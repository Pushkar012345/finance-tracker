import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  categorySummaryQuerySchema,
} from "../validators/transaction.validator";
import { categorizeSchema } from "../validators/ai.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listTransactionsQuerySchema), transactionController.listTransactions);
router.get(
  "/summary/by-category",
  validateQuery(categorySummaryQuerySchema),
  transactionController.getCategorySummary
);
router.post(
  "/categorize",
  validateBody(categorizeSchema),
  transactionController.categorizeTransaction
);
router.get("/:id", transactionController.getTransaction);
router.post("/", validateBody(createTransactionSchema), transactionController.createTransaction);
router.patch("/:id", validateBody(updateTransactionSchema), transactionController.updateTransaction);
router.delete("/:id", transactionController.deleteTransaction);

export default router;