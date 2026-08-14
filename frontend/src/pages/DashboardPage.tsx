import { useQuery } from "@tanstack/react-query";
import { LogOut, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTransactions } from "../lib/transactions";
import { getCategoryIcon } from "../lib/categoryIcons";
import AddTransactionForm from "../components/AddTransactionForm";
import BudgetProgress from "../components/BudgetProgress";
import GoalsList from "../components/GoalsList";
import CategorySpendingChart from "../components/CategorySpendingChart";
import AIAssistant from "../components/AIAssistant";
import MonthlyReports from "../components/MonthlyReports";
import RecurringPayments from "../components/RecurringPayments";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getInitial(email: string) {
  return email.charAt(0).toUpperCase();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const transactions = data?.data ?? [];

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSaved = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-sprout-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-sprout-primary-light flex items-center justify-center">
              <span className="text-sprout-primary font-display font-semibold text-lg">
                {user ? getInitial(user.email) : "?"}
              </span>
            </div>
            <div>
              <p className="text-sprout-text-muted text-xs">Welcome back</p>
              <h1 className="font-display text-lg text-sprout-text -mt-0.5">{user?.email}</h1>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sprout-text-muted text-sm hover:text-sprout-text transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>

        {isLoading && (
          <div className="text-sprout-text-muted text-sm py-12 text-center">Loading your data...</div>
        )}
        {isError && (
          <div className="text-red-500 text-sm py-12 text-center">Couldn't load transactions.</div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-4">
                <div className="flex items-center gap-1.5 text-sprout-text-muted text-xs mb-2">
                  <TrendingUp size={14} className="text-sprout-primary" />
                  Income
                </div>
                <p className="font-display text-xl text-sprout-text">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-4">
                <div className="flex items-center gap-1.5 text-sprout-text-muted text-xs mb-2">
                  <TrendingDown size={14} className="text-sprout-warning" />
                  Expenses
                </div>
                <p className="font-display text-xl text-sprout-text">{formatCurrency(totalExpense)}</p>
              </div>
            </div>

            {/* Net saved banner */}
            <div className="bg-sprout-primary-light rounded-sprout p-4 mb-6 flex items-center justify-between">
              <span className="text-sprout-text text-sm font-medium">Net this period</span>
              <span className="font-display text-lg text-sprout-primary font-semibold">
                {formatCurrency(netSaved)}
              </span>
            </div>

            <BudgetProgress />

            <CategorySpendingChart />

            <GoalsList />

            <RecurringPayments />

            <MonthlyReports />

            {/* Transaction list */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sprout-text font-medium">Recent transactions</h2>
              <span className="text-sprout-text-muted text-xs">{transactions.length} entries</span>
            </div>

            <div className="bg-sprout-surface border border-sprout-border rounded-sprout overflow-hidden">
              {transactions.length === 0 && (
                <p className="text-sprout-text-muted text-sm p-6 text-center">
                  No transactions yet — add your first one below.
                </p>
              )}
              {transactions.map((t, i) => {
                const Icon = getCategoryIcon(t.category.name);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i !== transactions.length - 1 ? "border-b border-sprout-border" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-sprout-bg flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-sprout-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sprout-text text-sm font-medium truncate">{t.description}</p>
                      <p className="text-sprout-text-muted text-xs">
                        {t.category.name} · {formatDate(t.date)}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-medium shrink-0 ${
                        t.type === "INCOME" ? "text-sprout-primary" : "text-sprout-text"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(Number(t.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
             <AddTransactionForm />
          </>
        )}
      </div>

      <AIAssistant />
    </div>
  );
}