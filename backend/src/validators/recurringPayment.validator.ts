import { z } from "zod";

export const createRecurringPaymentSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than zero."),
    type: z.enum(["INCOME", "EXPENSE"]),
    description: z.string().trim().min(1, "Description is required.").max(200),
    categoryId: z.string().uuid("Invalid category."),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const updateRecurringPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero.").optional(),
  description: z.string().trim().min(1).max(200).optional(),
  categoryId: z.string().uuid("Invalid category.").optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listRecurringPaymentsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
});