import { api } from "./api";
import type { Category } from "./categories";

export interface Transaction {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  categoryId: string;
  category: Category;
}

interface TransactionsResponse {
  data: Transaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getTransactions(): Promise<TransactionsResponse> {
  const { data } = await api.get("/transactions?limit=10");
  return data;
}

export async function createTransaction(input: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  categoryId: string;
}) {
  const { data } = await api.post("/transactions", input);
  return data;
}