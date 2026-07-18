import { z } from "zod";

export const createBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be greater than zero."),
  categoryId: z.string().uuid("Invalid category."),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be greater than zero."),
});

export const listBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});