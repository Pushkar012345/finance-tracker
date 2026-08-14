import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Repeat, Plus, X, Trash2 } from "lucide-react";
import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} from "../lib/recurringPayments";
import { getCategories } from "../lib/categories";

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

export default function RecurringPayments() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");

  const { data: payments, isLoading, isError } = useQuery({
    queryKey: ["recurring-payments"],
    queryFn: getRecurringPayments,
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });

  const createMutation = useMutation({
    mutationFn: createRecurringPayment,
    onSuccess: () => {
      invalidate();
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || "Couldn't add that recurring payment.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateRecurringPayment(id, { active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurringPayment,
    onSuccess: invalidate,
  });

  function resetForm() {
    setDescription("");
    setAmount("");
    setCategoryId("");
    setFrequency("MONTHLY");
    setStartDate("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!description.trim()) return setError("Add a description.");
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return setError("Enter an amount greater than zero.");
    if (!categoryId) return setError("Pick a category.");
    if (!startDate) return setError("Pick a start date.");

    createMutation.mutate({
      amount: parsedAmount,
      type,
      description: description.trim(),
      categoryId,
      frequency,
      startDate,
    });
  }

  if (isLoading) {
    return <div className="text-sprout-text-muted text-sm py-6 text-center">Loading recurring payments...</div>;
  }
  if (isError) {
    return <div className="text-red-500 text-sm py-6 text-center">Couldn't load recurring payments.</div>;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sprout-text font-medium">Recurring payments</h2>
        <span className="text-sprout-text-muted text-xs">{payments?.length ?? 0} total</span>
      </div>

      {(!payments || payments.length === 0) && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-6 text-center">
          <p className="text-sprout-text-muted text-sm">No recurring payments yet.</p>
        </div>
      )}

      {payments && payments.length > 0 && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout overflow-hidden">
          {payments.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i !== payments.length - 1 ? "border-b border-sprout-border" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-sprout-bg flex items-center justify-center shrink-0">
                <Repeat size={16} className="text-sprout-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sprout-text text-sm font-medium truncate">{p.description}</p>
                <p className="text-sprout-text-muted text-xs">
                  {p.category.name} · {p.frequency.toLowerCase()} · next {formatDate(p.nextRunDate)}
                </p>
              </div>
              <p className={`text-sm font-medium shrink-0 ${p.type === "INCOME" ? "text-sprout-primary" : "text-sprout-text"}`}>
                {p.type === "INCOME" ? "+" : "-"}
                {formatCurrency(Number(p.amount))}
              </p>
              <button
                onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })}
                className={`text-xs px-2 py-1 rounded-lg shrink-0 ${
                  p.active ? "bg-sprout-primary-light text-sprout-primary" : "bg-sprout-bg text-sprout-text-muted"
                }`}
              >
                {p.active ? "Active" : "Paused"}
              </button>
              <button
                onClick={() => deleteMutation.mutate(p.id)}
                className="text-sprout-text-muted hover:text-red-500 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-sprout-border text-sprout-text-muted text-sm font-medium py-2.5 rounded-sprout mt-2"
        >
          <Plus size={16} />
          Add recurring payment
        </button>
      ) : (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-4 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sprout-text">Add recurring payment</h3>
            <button onClick={() => setIsOpen(false)} className="text-sprout-text-muted">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategoryId("");
                  }}
                  className={`flex-1 text-sm py-2 rounded-xl font-medium ${
                    type === t ? "bg-sprout-primary text-white" : "bg-sprout-bg text-sprout-text-muted"
                  }`}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Description (e.g. Netflix subscription)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
              required
            />

            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
              required
            />

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
              required
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>

            <div>
              <p className="text-xs text-sprout-text-muted mb-1.5">Start date</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-sprout-primary text-white font-medium py-2.5 rounded-xl disabled:opacity-60"
            >
              {createMutation.isPending ? "Adding..." : "Add recurring payment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}