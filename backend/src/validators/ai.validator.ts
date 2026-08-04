import { z } from "zod";

export const categorizeSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(200),
});