import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().trim().max(50).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();