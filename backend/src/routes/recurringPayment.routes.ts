import { Router } from "express";
import * as controller from "../controllers/recurringPayment.controller";
import { validateBody } from "../middleware/validate";
import {
  createRecurringPaymentSchema,
  updateRecurringPaymentSchema,
} from "../validators/recurringPayment.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", controller.listRecurringPayments);
router.post("/", validateBody(createRecurringPaymentSchema), controller.createRecurringPayment);
router.patch("/:id", validateBody(updateRecurringPaymentSchema), controller.updateRecurringPayment);
router.delete("/:id", controller.deleteRecurringPayment);

export default router;