import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getBudgets } from "../lib/budgets";
import { getCategoryIcon } from "../lib/categoryIcons";
import AddBudgetForm from "./AddBudgetForm";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Ring color scales with how close the user is to (or past) their limit —
// same thresholds as the old bar version, just expressed as an arc.
function getRingColor(percentUsed: number) {
  if (percentUsed >= 100) return "var(--color-sprout-danger)";
  if (percentUsed >= 80) return "var(--color-sprout-warning)";
  return "var(--color-sprout-primary)";
}

// The ring itself always caps visually at a full circle (you can't draw more
// than 100% of an arc), but the number inside was printing the raw percentage
// — a budget blown 20x over rendered as a nonsensical "2000%". Past 999% we
// switch to a "999%+" label instead of an ever-growing number, and shrink the
// font as the label gets longer so it never overflows the ring.
function formatRingLabel(percentUsed: number) {
  const rounded = Math.round(percentUsed);
  return rounded > 999 ? "999%+" : `${rounded}%`;
}

const RADIUS = 30;
const STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// A budget that's merely over (say 110%) and one that's blown 20x over both
// used to render as the same solid red ring — no way to tell at a glance
// which one actually needs attention. Past this threshold we add a small
// warning badge so severe overspending stands out from a minor overage.
const SEVERE_THRESHOLD = 150;

function GrowthRing({ percentUsed }: { percentUsed: number }) {
  const clamped = Math.min(percentUsed, 100);
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = getRingColor(percentUsed);
  const label = formatRingLabel(percentUsed);
  const fontSize = label.length > 4 ? 12 : 16;
  const severelyOver = percentUsed >= SEVERE_THRESHOLD;

  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 72 72" className="w-16 h-16 -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke="var(--color-sprout-bg)"
          strokeWidth={STROKE}
        />
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <text
          x="36"
          y="36"
          textAnchor="middle"
          dominantBaseline="central"
          transform="rotate(90 36 36)"
          fontSize={fontSize}
          fontWeight="600"
          fill="var(--color-sprout-text)"
          className="font-display"
        >
          {label}
        </text>
      </svg>

      {severelyOver && (
        <div
          className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-sprout-danger flex items-center justify-center ring-2 ring-sprout-surface"
          title="Significantly over budget"
        >
          <AlertTriangle size={9} className="text-white" fill="white" strokeWidth={0} />
        </div>
      )}
    </div>
  );
}

export default function BudgetProgress() {
  const now = new Date();
  const { data: budgets, isLoading, isError } = useQuery({
    queryKey: ["budgets", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => getBudgets(now.getMonth() + 1, now.getFullYear()),
  });

  if (isLoading) {
    return (
      <div className="text-sprout-text-muted text-sm py-6 text-center">Loading budgets...</div>
    );
  }

  if (isError) {
    return (
      <div className="text-sprout-danger text-sm py-6 text-center">Couldn't load budgets.</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sprout-text font-display font-medium text-sm">Budgets this month</h2>
        <span className="text-sprout-text-muted text-xs">{budgets?.length ?? 0} categories</span>
      </div>

      {(!budgets || budgets.length === 0) && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-6 text-center">
          <p className="text-sprout-text-muted text-sm">
            No budgets set for this month yet.
          </p>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {budgets.map((budget) => {
            const Icon = getCategoryIcon(budget.category.name);
            const overBudget = budget.percentUsed > 100;

            return (
              <div
                key={budget.id}
                className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-3.5 flex flex-col items-center text-center"
              >
                <GrowthRing percentUsed={budget.percentUsed} />

                <div className="flex items-center gap-1 mt-2 min-w-0">
                  <Icon size={12} className="text-sprout-text-muted shrink-0" />
                  <p className="text-sprout-text text-xs font-medium truncate">
                    {budget.category.name}
                  </p>
                </div>

                <p className="text-sprout-text-muted text-[11px] mt-0.5">
                  {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                </p>

                <p
                  className={`text-[11px] mt-1 font-medium ${
                    overBudget ? "text-sprout-danger" : "text-sprout-text-muted"
                  }`}
                >
                  {overBudget
                    ? `${formatCurrency(Math.abs(budget.remaining))} over`
                    : `${formatCurrency(budget.remaining)} left`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <AddBudgetForm />
    </div>
  );
}