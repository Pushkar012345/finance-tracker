import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { ValidatedRequest } from "../middleware/validate";
import { getIdParam } from "../utils/params";

export async function listNotifications(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { unreadOnly } = req.validatedQuery ?? {};

    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId, ...(unreadOnly ? { read: false } : {}) },
      include: { budget: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Notification not found.", 404);

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ updated: count });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Notification not found.", 404);

    await prisma.notification.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}