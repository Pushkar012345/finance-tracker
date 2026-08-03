import { api } from "./api";
import type { Category } from "./categories";

export interface Budget {
  id: string;
  amount: string;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  // Derived fields added by the backend aggregation — actual spend for this
  // category in this month/year, computed from transactions.
  spent: number;
  remaining: number;
  percentUsed: number;
}

export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  const { data } = await api.get("/budgets", { params: { month, year } });
  return data;
}

export async function createBudget(input: {
  amount: number;
  categoryId: string;
  month: number;
  year: number;
}) {
  const { data } = await api.post("/budgets", input);
  return data;
}

export async function updateBudget(id: string, amount: number) {
  const { data } = await api.patch(`/budgets/${id}`, { amount });
  return data;
}

export async function deleteBudget(id: string) {
  await api.delete(`/budgets/${id}`);
}