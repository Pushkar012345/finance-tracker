import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { createGoal } from "../lib/goals";

export default function AddGoalForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error;
      setError(message || "Couldn't add that goal. Check the fields and try again.");
    },
  });

  function resetForm() {
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setTargetDate("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Give your goal a name.");
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (!parsedTarget || parsedTarget <= 0) {
      setError("Enter a target amount greater than zero.");
      return;
    }

    let parsedSaved: number | undefined = undefined;
    if (savedAmount.trim() !== "") {
      parsedSaved = parseFloat(savedAmount);
      if (isNaN(parsedSaved) || parsedSaved < 0) {
        setError("Already-saved amount can't be negative.");
        return;
      }
    }

    mutation.mutate({
      name: name.trim(),
      targetAmount: parsedTarget,
      savedAmount: parsedSaved,
      targetDate: targetDate || undefined,
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-sprout-border text-sprout-text-muted text-sm font-medium py-2.5 rounded-sprout mt-2"
      >
        <Plus size={16} />
        Add goal
      </button>
    );
  }

  return (
    <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-4 mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sprout-text">Add savings goal</h3>
        <button onClick={() => setIsOpen(false)} className="text-sprout-text-muted">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Goal name (e.g. Japan trip)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Target amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Already saved (optional)"
          value={savedAmount}
          onChange={(e) => setSavedAmount(e.target.value)}
          className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
        />

        <div>
          <p className="text-xs text-sprout-text-muted mb-1.5">Target date (optional)</p>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        {error && <p className="text-sprout-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-sprout-primary text-white font-medium py-2.5 rounded-xl disabled:opacity-60"
        >
          {mutation.isPending ? "Adding..." : "Add goal"}
        </button>
      </form>
    </div>
  );
}