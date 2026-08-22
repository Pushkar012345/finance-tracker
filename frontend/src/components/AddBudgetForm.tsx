import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { getCategories } from "../lib/categories";
import { createBudget } from "../lib/budgets";
import { getCategoryIcon } from "../lib/categoryIcons";

export default function AddBudgetForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");

  const now = new Date();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Budgets track spend against EXPENSE categories only.
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const mutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      // Matches the query key BudgetProgress uses for the current month, so
      // the new budget shows up immediately without a manual refresh.
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error;
      setError(message || "Couldn't add that budget. Check the fields and try again.");
    },
  });

  function resetForm() {
    setAmount("");
    setCategoryId("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Pick a category.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    mutation.mutate({
      amount: parsedAmount,
      categoryId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-sprout-border text-sprout-text-muted text-sm font-medium py-2.5 rounded-sprout mt-2"
      >
        <Plus size={16} />
        Add budget
      </button>
    );
  }

  return (
    <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-4 mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sprout-text">Add budget</h3>
        <button onClick={() => setIsOpen(false)} className="text-sprout-text-muted">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="number"
          step="0.01"
          placeholder="Monthly limit"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        {/* Category picker */}
        <div>
          <p className="text-xs text-sprout-text-muted mb-2">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {expenseCategories.map((c) => {
              const Icon = getCategoryIcon(c.name);
              const isSelected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs ${
                    isSelected
                      ? "border-sprout-primary bg-sprout-primary-light text-sprout-primary"
                      : "border-sprout-border text-sprout-text-muted"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate w-full text-center">{c.name}</span>
                </button>
              );
            })}
          </div>
          {expenseCategories.length === 0 && (
            <p className="text-xs text-sprout-text-muted">
              No expense categories yet — add one first.
            </p>
          )}
        </div>

        <p className="text-xs text-sprout-text-muted">
          Applies to {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>

        {error && <p className="text-sprout-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-sprout-primary text-white font-medium py-2.5 rounded-xl disabled:opacity-60"
        >
          {mutation.isPending ? "Adding..." : "Add budget"}
        </button>
      </form>
    </div>
  );
}