import { z } from "zod";

export const categorizeSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(200),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(1000),
  history: z.array(chatMessageSchema).max(30).optional().default([]),
});