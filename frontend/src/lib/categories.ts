import { api } from "./api";

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get("/categories");
  return data;
}