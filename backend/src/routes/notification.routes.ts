import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { validateQuery } from "../middleware/validate";
import { listNotificationsQuerySchema } from "../validators/notification.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listNotificationsQuerySchema), notificationController.listNotifications);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch("/:id/read", notificationController.markNotificationRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;