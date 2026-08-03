import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";
import { ValidatedRequest } from "../middleware/validate";

export async function listTransactions(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, limit, categoryId, type } = req.validatedQuery;

    const where = {
      userId: req.userId,
      ...(categoryId && { categoryId }),
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategorySummary(
  req: AuthRequest & ValidatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.validatedQuery ?? {};
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const periodStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const periodEnd = new Date(Date.UTC(targetYear, targetMonth, 1));

    const spendByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: req.userId,
        type: "EXPENSE",
        date: { gte: periodStart, lt: periodEnd },
      },
      _sum: { amount: true },
    });

    const categoryIds = spendByCategory.map((row: { categoryId: string }) => row.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const summary = spendByCategory
      .map((row: { categoryId: string; _sum: { amount: unknown } }) => ({
        categoryId: row.categoryId,
        categoryName: categoryMap.get(row.categoryId)?.name ?? "Unknown",
        total: Number(row._sum.amount ?? 0),
      }))
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
      include: { category: true },
    });
    if (!transaction) throw new AppError("Transaction not found.", 404);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.body.categoryId, userId: req.userId },
    });
    if (!category) throw new AppError("Category not found.", 400);

    const transaction = await prisma.transaction.create({
      data: { ...req.body, userId: req.userId! },
      include: { category: true },
    });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Transaction not found.", 404);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: req.body,
      include: { category: true },
    });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Transaction not found.", 404);

    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}