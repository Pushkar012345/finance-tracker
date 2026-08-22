import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";
import { ValidatedRequest } from "../middleware/validate";

export async function listRecurringPayments(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { isActive } = req.validatedQuery ?? {};

    const recurringPayments = await prisma.recurringPayment.findMany({
      where: {
        userId: req.userId,
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
      orderBy: { nextRunDate: "asc" },
    });

    res.json(recurringPayments);
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

    const { startDate } = req.body;

    const recurringPayment = await prisma.recurringPayment.create({
      data: {
        ...req.body,
        userId: req.userId!,
        // First occurrence is the start date itself; the job will create
        // the transaction for it once it's due.
        nextRunDate: startDate,
      },
      include: { category: true },
    });
    res.status(201).json(recurringPayment);
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Recurring payment not found.", 404);

    if (req.body.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: req.body.categoryId, userId: req.userId },
      });
      if (!category) throw new AppError("Category not found.", 400);
    }

    const recurringPayment = await prisma.recurringPayment.update({
      where: { id },
      data: req.body,
      include: { category: true },
    });
    res.json(recurringPayment);
  } catch (err) {
    next(err);
  }
}

export async function deleteRecurringPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Recurring payment not found.", 404);

    await prisma.recurringPayment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}