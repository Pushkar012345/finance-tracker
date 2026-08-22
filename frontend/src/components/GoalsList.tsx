import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus } from "lucide-react";
import { getGoals, contributeToGoal } from "../lib/goals";
import AddGoalForm from "./AddGoalForm";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function GoalsList() {
  const queryClient = useQueryClient();
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const { data: goals, isLoading, isError } = useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });

  const mutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => contributeToGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setContributingId(null);
      setContributionAmount("");
    },
  });

  function handleContribute(id: string) {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;
    mutation.mutate({ id, amount });
  }

  if (isLoading) {
    return <div className="text-sprout-text-muted text-sm py-6 text-center">Loading goals...</div>;
  }

  if (isError) {
    return <div className="text-sprout-danger text-sm py-6 text-center">Couldn't load goals.</div>;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sprout-text font-display font-medium text-sm">Savings goals</h2>
        <span className="text-sprout-text-muted text-xs">{goals?.length ?? 0} goals</span>
      </div>

      {(!goals || goals.length === 0) && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-6 text-center">
          <p className="text-sprout-text-muted text-sm">No savings goals yet.</p>
        </div>
      )}

      {goals && goals.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount);
            const saved = Number(goal.savedAmount);
            const percent = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
            const reached = saved >= target;
            const isContributing = contributingId === goal.id;

            return (
              <div
                key={goal.id}
                className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-sprout-primary-light flex items-center justify-center shrink-0">
                    <Target size={15} className="text-sprout-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sprout-text text-sm font-medium truncate">{goal.name}</p>
                    {goal.targetDate && (
                      <p className="text-sprout-text-muted text-xs">by {formatDate(goal.targetDate)}</p>
                    )}
                  </div>
                </div>

                <div className="h-2 rounded-full bg-sprout-bg overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all bg-sprout-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-xs text-sprout-text-muted mb-3">
                  {formatCurrency(saved)} / {formatCurrency(target)} · {percent}%
                  {reached && " · reached 🎉"}
                </p>

                {isContributing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      autoFocus
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 min-w-0 text-sm px-2.5 py-1.5 rounded-lg border border-sprout-border bg-sprout-bg text-sprout-text focus:outline-none focus:ring-1 focus:ring-sprout-primary"
                    />
                    <button
                      onClick={() => handleContribute(goal.id)}
                      disabled={mutation.isPending}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-sprout-primary text-white font-medium disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setContributingId(null);
                        setContributionAmount("");
                      }}
                      className="text-xs px-2 py-1.5 text-sprout-text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setContributingId(goal.id)}
                    className="flex items-center gap-1 text-xs text-sprout-primary font-medium"
                  >
                    <Plus size={13} />
                    Add contribution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddGoalForm />
    </div>
  );
}