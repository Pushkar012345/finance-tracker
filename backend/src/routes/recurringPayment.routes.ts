import { Router } from "express";
import * as recurringPaymentController from "../controllers/recurringPayment.controller";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createRecurringPaymentSchema,
  updateRecurringPaymentSchema,
  listRecurringPaymentsQuerySchema,
} from "../validators/recurringPayment.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(listRecurringPaymentsQuerySchema),
  recurringPaymentController.listRecurringPayments
);
router.post(
  "/",
  validateBody(createRecurringPaymentSchema),
  recurringPaymentController.createRecurringPayment
);
router.patch(
  "/:id",
  validateBody(updateRecurringPaymentSchema),
  recurringPaymentController.updateRecurringPayment
);
router.delete("/:id", recurringPaymentController.deleteRecurringPayment);

export default router;