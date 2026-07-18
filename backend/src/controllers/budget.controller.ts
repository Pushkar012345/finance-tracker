import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";
import { ValidatedRequest } from "../middleware/validate";

export async function listBudgets(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.validatedQuery ?? {};
    const now = new Date();

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: month ?? now.getMonth() + 1,
        year: year ?? now.getFullYear(),
      },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });

    res.json(budgets);
  } catch (err) {
    next(err);
  }
}

export async function createBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.body.categoryId, userId: req.userId },
    });
    if (!category) throw new AppError("Category not found.", 400);

    const budget = await prisma.budget.create({
      data: { ...req.body, userId: req.userId! },
      include: { category: true },
    });
    res.status(201).json(budget);
  } catch (err: any) {
    if (err.code === "P2002") {
      return next(new AppError("A budget for this category already exists this month.", 409));
    }
    next(err);
  }
}

export async function updateBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Budget not found.", 404);

    const budget = await prisma.budget.update({
      where: { id },
      data: req.body,
      include: { category: true },
    });
    res.json(budget);
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Budget not found.", 404);

    await prisma.budget.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}