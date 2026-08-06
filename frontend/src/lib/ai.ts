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

export interface ReceiptScanResult {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  imageUrl: string;
}

export async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  const formData = new FormData();
  formData.append("receipt", file);
  const { data } = await api.post("/ai/receipt-scan", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const { data } = await api.post("/ai/chat", { message, history });
  return data.reply;
}