import {
  UtensilsCrossed, Car, Home, RefreshCw, ShoppingBag,
  HeartPulse, Film, MoreHorizontal, Wallet, Briefcase, Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Food: UtensilsCrossed,
  Transport: Car,
  Rent: Home,
  Subscriptions: RefreshCw,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Entertainment: Film,
  Other: MoreHorizontal,
  Salary: Wallet,
  Freelance: Briefcase,
  "Other income": Plus,
};

export function getCategoryIcon(categoryName: string): LucideIcon {
  return ICON_MAP[categoryName] ?? MoreHorizontal;
}