import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";

export async function listGoals(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const goal = await prisma.goal.create({
      data: { ...req.body, userId: req.userId! },
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Goal not found.", 404);

    const goal = await prisma.goal.update({
      where: { id },
      data: req.body,
    });
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

export async function addContribution(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Goal not found.", 404);

    const goal = await prisma.goal.update({
      where: { id },
      data: { savedAmount: { increment: req.body.amount } },
    });
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Goal not found.", 404);

    await prisma.goal.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}