import { Router } from "express";
import * as goalController from "../controllers/goal.controller";
import { validateBody } from "../middleware/validate";
import {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
} from "../validators/goal.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", goalController.listGoals);
router.post("/", validateBody(createGoalSchema), goalController.createGoal);
router.patch("/:id", validateBody(updateGoalSchema), goalController.updateGoal);
router.post("/:id/contribute", validateBody(addContributionSchema), goalController.addContribution);
router.delete("/:id", goalController.deleteGoal);

export default router;