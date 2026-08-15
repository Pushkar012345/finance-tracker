import { api } from "./api";

export type NotificationType = "BUDGET_WARNING" | "BUDGET_EXCEEDED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  budgetId: string | null;
  budget: {
    id: string;
    category: { name: string; icon: string | null };
  } | null;
  createdAt: string;
}

export async function getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
  const { data } = await api.get("/notifications", { params: { unreadOnly } });
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/read-all");
  return data;
}

export async function deleteNotification(id: string) {
  await api.delete(`/notifications/${id}`);
}