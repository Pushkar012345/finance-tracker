import { z } from "zod";

const frequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const typeEnum = z.enum(["INCOME", "EXPENSE"]);

export const createRecurringPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero."),
  type: typeEnum,
  description: z.string().min(1, "Description is required."),
  categoryId: z.string().uuid("Invalid category."),
  frequency: frequencyEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const updateRecurringPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  frequency: frequencyEnum.optional(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.boolean().optional(),
});