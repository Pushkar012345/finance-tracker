import { CategoryType } from "@prisma/client";

export const DEFAULT_CATEGORIES: { name: string; type: CategoryType; icon: string }[] = [
  { name: "Food", type: "EXPENSE", icon: "ti-tools-kitchen-2" },
  { name: "Transport", type: "EXPENSE", icon: "ti-car" },
  { name: "Rent", type: "EXPENSE", icon: "ti-home" },
  { name: "Subscriptions", type: "EXPENSE", icon: "ti-refresh" },
  { name: "Shopping", type: "EXPENSE", icon: "ti-shopping-bag" },
  { name: "Health", type: "EXPENSE", icon: "ti-heartbeat" },
  { name: "Entertainment", type: "EXPENSE", icon: "ti-movie" },
  { name: "Other", type: "EXPENSE", icon: "ti-dots" },
  { name: "Salary", type: "INCOME", icon: "ti-cash" },
  { name: "Freelance", type: "INCOME", icon: "ti-briefcase" },
  { name: "Other income", type: "INCOME", icon: "ti-plus" },
];