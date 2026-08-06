import { api } from "./api";

export interface CategorizeResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

export async function categorizeTransaction(description: string): Promise<CategorizeResult> {
  const { data } = await api.post("/transactions/categorize", { description });
  return data;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReceiptScanResult {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  imageUrl: string;
}

export async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  const formData = new FormData();
  formData.append("receipt", file);
  const { data } = await api.post("/ai/receipt-scan", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export interface MonthlyReportStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  spendByCategory: { category: string; amount: number }[];
  budgets: { category: string; limit: number; spent: number; percentUsed: number }[];
  goals: { name: string; savedAmount: number; targetAmount: number; percentComplete: number }[];
  transactionCount: number;
}

export interface AIReport {
  id: string;
  month: number;
  year: number;
  summary: string;
  stats: MonthlyReportStats;
  createdAt: string;
  updatedAt: string;
}

export async function listReports(): Promise<AIReport[]> {
  const { data } = await api.get("/ai/reports");
  return data;
}

export async function getOrGenerateReport(month: number, year: number): Promise<AIReport> {
  const { data } = await api.get("/ai/reports/one", { params: { month, year } });
  return data;
}

export async function regenerateReport(month: number, year: number): Promise<AIReport> {
  const { data } = await api.post("/ai/reports/generate", { month, year });
  return data;
}

// Downloads the PDF for a report and triggers a browser save, rather than
// returning a URL — the endpoint requires the auth header, so it can't be
// used as a plain <a href> without also leaking the access token in a
// query string.
export async function downloadReportPdf(report: AIReport): Promise<void> {
  const response = await api.get(`/ai/reports/${report.id}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `finance-report-${report.year}-${String(report.month).padStart(2, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const { data } = await api.post("/ai/chat", { message, history });
  return data.reply;
}