import { api } from "./api";

export interface CategorySummaryRow {
  categoryId: string;
  categoryName: string;
  total: number;
}

export async function getCategorySummary(month?: number, year?: number): Promise<CategorySummaryRow[]> {
  const { data } = await api.get("/transactions/summary/by-category", {
    params: { month, year },
  });
  return data;
}