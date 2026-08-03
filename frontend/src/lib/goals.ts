import { api } from "./api";

export interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getGoals(): Promise<Goal[]> {
  const { data } = await api.get("/goals");
  return data;
}

export async function createGoal(input: {
  name: string;
  targetAmount: number;
  savedAmount?: number;
  targetDate?: string;
  icon?: string;
}) {
  const { data } = await api.post("/goals", input);
  return data;
}

export async function updateGoal(
  id: string,
  input: Partial<{
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
    icon: string;
  }>
) {
  const { data } = await api.patch(`/goals/${id}`, input);
  return data;
}

export async function contributeToGoal(id: string, amount: number) {
  const { data } = await api.post(`/goals/${id}/contribute`, { amount });
  return data;
}

export async function deleteGoal(id: string) {
  await api.delete(`/goals/${id}`);
}