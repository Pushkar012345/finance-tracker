import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero."),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().trim().min(1, "Description is required.").max(200),
  date: z.coerce.date(),
  categoryId: z.string().uuid("Invalid category."),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
});

export const categorySummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});