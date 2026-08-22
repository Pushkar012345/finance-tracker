import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Download, RefreshCw, ChevronDown } from "lucide-react";
import {
  listReports,
  getOrGenerateReport,
  regenerateReport,
  downloadReportPdf,
  type AIReport,
} from "../lib/ai";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function reportLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function lastMonth(): { month: number; year: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default function MonthlyReports() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["ai-reports"],
    queryFn: listReports,
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      const { month, year } = lastMonth();
      return getOrGenerateReport(month, year);
    },
    onSuccess: (report) => {
      setError("");
      setExpandedId(report.id);
      queryClient.invalidateQueries({ queryKey: ["ai-reports"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || "Couldn't generate a report for last month.");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (report: AIReport) => regenerateReport(report.month, report.year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-reports"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || "Couldn't regenerate that report.");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (report: AIReport) => downloadReportPdf(report),
    onError: () => setError("Couldn't download the PDF. Try again."),
  });

  return (
    <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sprout-text font-display font-medium text-sm">
          <FileText size={16} className="text-sprout-primary" />
          Monthly AI reports
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="text-xs font-medium text-sprout-primary hover:underline disabled:opacity-50"
        >
          {generateMutation.isPending ? "Generating…" : "Generate last month's report"}
        </button>
      </div>

      {error && <p className="text-sprout-danger text-xs mb-2">{error}</p>}

      {isLoading && <p className="text-sprout-text-muted text-xs">Loading reports…</p>}

      {!isLoading && (reports?.length ?? 0) === 0 && (
        <p className="text-sprout-text-muted text-xs">
          No reports yet — generate one for last month above, or wait for the automatic run on the 1st.
        </p>
      )}

      <div className="space-y-2">
        {reports?.map((report) => {
          const isExpanded = expandedId === report.id;
          return (
            <div key={report.id} className="border border-sprout-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="text-sprout-text text-sm font-medium">
                  {reportLabel(report.month, report.year)}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-sprout-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-sprout-border pt-2.5">
                  <p className="text-sprout-text text-sm whitespace-pre-line mb-3">{report.summary}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => downloadMutation.mutate(report)}
                      disabled={downloadMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-medium text-sprout-primary hover:underline disabled:opacity-50"
                    >
                      <Download size={13} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => regenerateMutation.mutate(report)}
                      disabled={regenerateMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-medium text-sprout-text-muted hover:text-sprout-text disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={regenerateMutation.isPending ? "animate-spin" : ""} />
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}