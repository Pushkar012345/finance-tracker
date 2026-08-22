import { TrendingUp, TrendingDown } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface HeroBalanceProps {
  totalIncome: number;
  totalExpense: number;
}

export default function HeroBalance({ totalIncome, totalExpense }: HeroBalanceProps) {
  const net = totalIncome - totalExpense;
  const isPositive = net >= 0;

  return (
    <div className="bg-sprout-primary-light rounded-sprout p-6 mb-6 shadow-sprout">
      <p className="text-sprout-text-muted text-xs font-medium mb-1">Net this period</p>
      <p
        className={`font-display text-4xl font-semibold tracking-tight ${
          isPositive ? "text-sprout-primary" : "text-sprout-danger"
        }`}
      >
        {isPositive ? "+" : "-"}
        {formatCurrency(Math.abs(net))}
      </p>

      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-sprout-primary/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sprout-surface flex items-center justify-center shrink-0">
            <TrendingUp size={13} className="text-sprout-primary" />
          </div>
          <div>
            <p className="text-sprout-text-muted text-[11px] leading-none mb-1">Income</p>
            <p className="text-sprout-text text-sm font-medium leading-none">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sprout-surface flex items-center justify-center shrink-0">
            <TrendingDown size={13} className="text-sprout-warning" />
          </div>
          <div>
            <p className="text-sprout-text-muted text-[11px] leading-none mb-1">Expenses</p>
            <p className="text-sprout-text text-sm font-medium leading-none">
              {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}