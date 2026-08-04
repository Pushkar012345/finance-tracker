import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getCategorySummary } from "../lib/summary";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Sprout palette, cycled across slices so the chart stays on-brand
// regardless of how many categories a user has spending in.
const SLICE_COLORS = [
  "#1D9E75", // sprout-primary
  "#E8A33D", // sprout-warning
  "#5F5E5A", // sprout-text-muted
  "#7BC4A4",
  "#D97757",
  "#4A90A4",
  "#B08968",
  "#8E7CC3",
];

export default function CategorySpendingChart() {
  const now = new Date();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["category-summary", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => getCategorySummary(now.getMonth() + 1, now.getFullYear()),
  });

  if (isLoading) {
    return (
      <div className="text-sprout-text-muted text-sm py-6 text-center">Loading spending breakdown...</div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 text-sm py-6 text-center">Couldn't load spending breakdown.</div>
    );
  }

  const rows = data ?? [];
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sprout-text font-medium">Spending by category</h2>
        <span className="text-sprout-text-muted text-xs">this month</span>
      </div>

      {rows.length === 0 && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-6 text-center">
          <p className="text-sprout-text-muted text-sm">No expenses recorded this month yet.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows}
                    dataKey="total"
                    nameKey="categoryName"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {rows.map((row, i) => (
                      <Cell key={row.categoryId} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E3DC",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {rows.map((row, i) => {
                const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
                return (
                  <div key={row.categoryId} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                    />
                    <span className="text-sprout-text text-sm truncate flex-1">{row.categoryName}</span>
                    <span className="text-sprout-text-muted text-xs shrink-0">
                      {formatCurrency(row.total)} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}