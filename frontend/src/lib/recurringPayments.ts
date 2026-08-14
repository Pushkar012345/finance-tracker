import { api } from "./api";

export interface RecurringPayment {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
  nextRunDate: string;
  endDate: string | null;
  active: boolean;
  category: { id: string; name: string; icon: string | null };
}

export async function getRecurringPayments(): Promise<RecurringPayment[]> {
  const { data } = await api.get("/recurring-payments");
  return data;
}

export async function createRecurringPayment(input: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  categoryId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
  endDate?: string;
}) {
  const { data } = await api.post("/recurring-payments", input);
  return data;
}

export async function updateRecurringPayment(
  id: string,
  input: Partial<{ active: boolean; amount: number; description: string; endDate: string | null }>
) {
  const { data } = await api.patch(`/recurring-payments/${id}`, input);
  return data;
}

export async function deleteRecurringPayment(id: string) {
  await api.delete(`/recurring-payments/${id}`);
}