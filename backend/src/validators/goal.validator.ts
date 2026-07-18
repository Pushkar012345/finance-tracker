import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  targetAmount: z.number().positive("Target amount must be greater than zero."),
  savedAmount: z.number().min(0, "Saved amount can't be negative.").optional(),
  targetDate: z.coerce.date().optional(),
  icon: z.string().trim().max(50).optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const addContributionSchema = z.object({
  amount: z.number().positive("Contribution must be greater than zero."),
});