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