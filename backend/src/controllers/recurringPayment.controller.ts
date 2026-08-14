import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";

/** Advances a date by one occurrence of the given frequency. */
export function advanceDate(date: Date, frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"): Date {
  const d = new Date(date);
  switch (frequency) {
    case "DAILY":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "YEARLY":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d;
}

export async function listRecurringPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payments = await prisma.recurringPayment.findMany({
      where: { userId: req.userId },
      include: { category: true },
      orderBy: { nextRunDate: "asc" },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
}

export async function createRecurringPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.body.categoryId, userId: req.userId },
    });
    if (!category) throw new AppError("Category not found.", 400);

    const payment = await prisma.recurringPayment.create({
      data: {
        ...req.body,
        nextRunDate: req.body.startDate,
        userId: req.userId!,
      },
      include: { category: true },
    });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const existing = await prisma.recurringPayment.findFirst({ where: { id, userId: req.userId } });
    if (!existing) throw new AppError("Recurring payment not found.", 404);

    if (req.body.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: req.body.categoryId, userId: req.userId },
      });
      if (!category) throw new AppError("Category not found.", 400);
    }

    const payment = await prisma.recurringPayment.update({
      where: { id },
      data: req.body,
      include: { category: true },
    });
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function deleteRecurringPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const existing = await prisma.recurringPayment.findFirst({ where: { id, userId: req.userId } });
    if (!existing) throw new AppError("Recurring payment not found.", 404);

    await prisma.recurringPayment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}