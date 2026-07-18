import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { getCategories } from "../lib/categories";
import { createTransaction } from "../lib/transactions";
import { getCategoryIcon } from "../lib/categoryIcons";

export default function AddTransactionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const filteredCategories = categories.filter((c) => c.type === type);

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      // Tell React Query the transactions list is stale — this triggers
      // an automatic refetch, so the new entry appears instantly without
      // a manual page reload.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      setError("Couldn't add that transaction. Check the fields and try again.");
    },
  });

  function resetForm() {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Pick a category.");
      return;
    }

    mutation.mutate({
      amount: parseFloat(amount),
      type,
      description,
      date,
      categoryId,
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-sprout-primary text-white font-medium py-3 rounded-sprout mt-4"
      >
        <Plus size={18} />
        Add transaction
      </button>
    );
  }

  return (
    <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sprout-text">Add transaction</h3>
        <button onClick={() => setIsOpen(false)} className="text-sprout-text-muted">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setCategoryId("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              type === "EXPENSE"
                ? "bg-sprout-text text-white"
                : "bg-sprout-bg text-sprout-text-muted"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setCategoryId("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              type === "INCOME"
                ? "bg-sprout-primary text-white"
                : "bg-sprout-bg text-sprout-text-muted"
            }`}
          >
            Income
          </button>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        <input
          type="text"
          placeholder="Description (e.g. Uber ride)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        {/* Category picker */}
        <div>
          <p className="text-xs text-sprout-text-muted mb-2">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {filteredCategories.map((c) => {
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
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-sprout-primary text-white font-medium py-2.5 rounded-xl disabled:opacity-60"
        >
          {mutation.isPending ? "Adding..." : "Add transaction"}
        </button>
      </form>
    </div>
  );
}