import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIdParam } from "../utils/params";

export async function listCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await prisma.category.create({
      data: { ...req.body, userId: req.userId! },
    });
    res.status(201).json(category);
  } catch (err: any) {
    if (err.code === "P2002") {
      return next(new AppError("A category with this name and type already exists.", 409));
    }
    next(err);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Category not found.", 404);

    const category = await prisma.category.update({
      where: { id },
      data: req.body,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError("Category not found.", 404);

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}