import { useQuery } from "@tanstack/react-query";
import { getBudgets } from "../lib/budgets";
import { getCategoryIcon } from "../lib/categoryIcons";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Bar color scales with how close the user is to (or past) their limit.
function getBarColor(percentUsed: number) {
  if (percentUsed >= 100) return "bg-red-500";
  if (percentUsed >= 80) return "bg-sprout-warning";
  return "bg-sprout-primary";
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
      <div className="text-red-500 text-sm py-6 text-center">Couldn't load budgets.</div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sprout-text font-medium">Budgets this month</h2>
        <span className="text-sprout-text-muted text-xs">{budgets?.length ?? 0} categories</span>
      </div>

      {(!budgets || budgets.length === 0) && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-6 text-center">
          <p className="text-sprout-text-muted text-sm">
            No budgets set for this month yet.
          </p>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout divide-y divide-sprout-border">
          {budgets.map((budget) => {
            const Icon = getCategoryIcon(budget.category.name);
            const barWidth = Math.min(budget.percentUsed, 100);
            const overBudget = budget.percentUsed > 100;

            return (
              <div key={budget.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-sprout-bg flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-sprout-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sprout-text text-sm font-medium truncate">
                      {budget.category.name}
                    </p>
                  </div>
                  <p className="text-sprout-text-muted text-xs shrink-0 text-right">
                    {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                  </p>
                </div>

                <div className="h-2 rounded-full bg-sprout-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(budget.percentUsed)}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <p
                  className={`text-xs mt-1.5 ${
                    overBudget ? "text-red-500" : "text-sprout-text-muted"
                  }`}
                >
                  {overBudget
                    ? `${formatCurrency(Math.abs(budget.remaining))} over budget`
                    : `${formatCurrency(budget.remaining)} remaining · ${budget.percentUsed}% used`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}