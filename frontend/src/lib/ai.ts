import { api } from "./api";

export interface CategorizeResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

export async function categorizeTransaction(description: string): Promise<CategorizeResult> {
  const { data } = await api.post("/transactions/categorize", { description });
  return data;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const { data } = await api.post("/ai/chat", { message, history });
  return data.reply;
}