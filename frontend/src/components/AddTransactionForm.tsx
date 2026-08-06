import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Sparkles, Camera } from "lucide-react";
import { getCategories } from "../lib/categories";
import { createTransaction } from "../lib/transactions";
import { getCategoryIcon } from "../lib/categoryIcons";
import { categorizeTransaction, scanReceipt } from "../lib/ai";

export default function AddTransactionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiError, setAiError] = useState("");
  const [scanError, setScanError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Spending chart and budget progress bars use their own query keys
      // (scoped by month/year) and were going stale after adding a
      // transaction — invalidate them too so the dashboard updates
      // immediately instead of needing a manual reload.
      queryClient.invalidateQueries({ queryKey: ["category-summary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      setError("Couldn't add that transaction. Check the fields and try again.");
    },
  });

  const categorizeMutation = useMutation({
    mutationFn: categorizeTransaction,
    onSuccess: (result) => {
      setCategoryId(result.categoryId);
      setAiSuggested(true);
      setAiError("");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error;
      setAiError(message || "Couldn't get an AI suggestion. Pick a category manually.");
    },
  });

  const receiptMutation = useMutation({
    mutationFn: scanReceipt,
    onSuccess: (result) => {
      setScanError("");
      if (result.amount != null) setAmount(String(result.amount));
      if (result.merchant) {
        setDescription(result.merchant);
        setAiSuggested(false);
        // Auto-categorize using the merchant name we just extracted, so
        // the user doesn't have to separately tap "AI categorize" after
        // scanning — one scan gets them amount, date, description, AND
        // a category suggestion.
        categorizeMutation.mutate(result.merchant);
      }
      if (result.date) setDate(result.date);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error;
      setScanError(message || "Couldn't read that receipt. Enter the details manually.");
    },
  });

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setScanError("");
    setType("EXPENSE");
    receiptMutation.mutate(file);
  }

  function resetForm() {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
    setAiSuggested(false);
    setAiError("");
    setScanError("");
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

  function handleAutoCategorize() {
    setAiError("");
    if (!description.trim()) {
      setAiError("Type a description first.");
      return;
    }
    categorizeMutation.mutate(description.trim());
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReceiptChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={receiptMutation.isPending}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-sprout-border text-sprout-primary text-sm font-medium py-2.5 rounded-xl mb-3 disabled:opacity-50"
      >
        <Camera size={16} />
        {receiptMutation.isPending ? "Reading receipt..." : "Scan a receipt"}
      </button>
      {scanError && <p className="text-red-500 text-xs -mt-2 mb-3">{scanError}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setCategoryId("");
              setAiSuggested(false);
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
              setAiSuggested(false);
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

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Description (e.g. Uber ride)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setAiSuggested(false);
            }}
            className="flex-1 min-w-0 border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
            required
          />
          {type === "EXPENSE" && (
            <button
              type="button"
              onClick={handleAutoCategorize}
              disabled={categorizeMutation.isPending}
              title="Suggest a category with AI"
              className="shrink-0 flex items-center gap-1 px-3 rounded-xl border border-sprout-border text-sprout-primary text-xs font-medium disabled:opacity-50"
            >
              <Sparkles size={14} />
              {categorizeMutation.isPending ? "..." : "Suggest"}
            </button>
          )}
        </div>

        {aiError && <p className="text-red-500 text-xs -mt-1">{aiError}</p>}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        {/* Category picker */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs text-sprout-text-muted">Category</p>
            {aiSuggested && (
              <span className="flex items-center gap-0.5 text-[10px] text-sprout-primary font-medium">
                <Sparkles size={10} />
                Suggested by AI
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {filteredCategories.map((c) => {
              const Icon = getCategoryIcon(c.name);
              const isSelected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id);
                    setAiSuggested(false);
                  }}
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