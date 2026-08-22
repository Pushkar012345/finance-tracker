import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTransactions } from "../lib/transactions";
import { getCategoryIcon } from "../lib/categoryIcons";
import AddTransactionForm from "../components/AddTransactionForm";
import BudgetProgress from "../components/BudgetProgress";
import GoalsList from "../components/GoalsList";
import CategorySpendingChart from "../components/CategorySpendingChart";
import AIAssistant from "../components/AIAssistant";
import MonthlyReports from "../components/MonthlyReports";
import HeroBalance from "../components/HeroBalance";
import NotificationsBell from "../components/NotificationsBell";
import ErrorBoundary from "../components/ErrorBoundary";

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

  return (
    <div className="min-h-screen bg-sprout-bg">
      {/* Sticky app-shell top bar — frames the scrolling content instead of
          floating inside it, so the page reads as an app, not a document. */}
      <header className="sticky top-0 z-10 bg-sprout-surface/90 backdrop-blur-sm border-b border-sprout-border">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sprout-primary-light flex items-center justify-center">
              <span className="text-sprout-primary font-display font-semibold text-base">
                {user ? getInitial(user.email) : "?"}
              </span>
            </div>
            <div>
              <p className="text-sprout-text-muted text-[11px] leading-none mb-1">Welcome back</p>
              <h1 className="font-display text-sm font-medium text-sprout-text leading-none">
                {user?.email}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sprout-text-muted text-sm hover:text-sprout-text transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-sprout-text-muted text-sm py-12 text-center">Loading your data...</div>
        )}
        {isError && (
          <div className="text-sprout-danger text-sm py-12 text-center">Couldn't load transactions.</div>
        )}

        {!isLoading && !isError && (
          <>
            <HeroBalance totalIncome={totalIncome} totalExpense={totalExpense} />

            {/* Dashboard grid: a wide main column for the deep-dive content
                (spending chart, transaction history) and a narrower sidebar
                for at-a-glance widgets (budgets, goals, reports). On mobile
                this collapses to a single column, sidebar content first so
                the glanceable stuff still surfaces early. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <aside className="lg:col-span-4 lg:order-2 space-y-6">
                <ErrorBoundary variant="section" sectionName="Budgets">
                  <BudgetProgress />
                </ErrorBoundary>
                <ErrorBoundary variant="section" sectionName="Goals">
                  <GoalsList />
                </ErrorBoundary>
                <ErrorBoundary variant="section" sectionName="Monthly reports">
                  <MonthlyReports />
                </ErrorBoundary>
              </aside>

              <main className="lg:col-span-8 lg:order-1 space-y-6">
                <ErrorBoundary variant="section" sectionName="Spending chart">
                  <CategorySpendingChart />
                </ErrorBoundary>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sprout-text font-display font-medium text-sm">Recent transactions</h2>
                    <span className="text-sprout-text-muted text-xs">{transactions.length} entries</span>
                  </div>

                  <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout overflow-hidden">
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
                </div>
              </main>
            </div>
          </>
        )}
      </div>

      <ErrorBoundary variant="section">
        <AIAssistant />
      </ErrorBoundary>
    </div>
  );
}