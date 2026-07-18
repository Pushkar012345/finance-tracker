import { Router } from "express";
import * as budgetController from "../controllers/budget.controller";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetsQuerySchema,
} from "../validators/budget.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listBudgetsQuerySchema), budgetController.listBudgets);
router.post("/", validateBody(createBudgetSchema), budgetController.createBudget);
router.patch("/:id", validateBody(updateBudgetSchema), budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

export default router;