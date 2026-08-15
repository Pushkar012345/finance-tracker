import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { NotificationType } from "@prisma/client";

let transporter: Transporter | null = null;

// Lazy singleton, same pattern as the cloudinary.config() call in
// ai.service.ts — only built once, and only if SMTP is actually configured.
function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise no-ops. Email delivery
 * is best-effort — a failure here should never block the in-app
 * notification from being created, so callers should catch/log rather
 * than let this throw into a request/job path.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[notification.service] SMTP not configured — skipping email "${subject}" to ${to}.`);
    return;
  }
  await transport.sendMail({ from: env.smtp.from, to, subject, html });
}

interface BudgetAlertInput {
  userId: string;
  userEmail: string;
  userName: string;
  budgetId: string;
  categoryName: string;
  baseCurrency: string;
  limit: number;
  spent: number;
  percentUsed: number;
  type: Extract<NotificationType, "BUDGET_WARNING" | "BUDGET_EXCEEDED">;
}

/**
 * Persists a Notification row and (best-effort) emails the user. Used by
 * the budget alert job — kept in one place so the in-app record and the
 * email always stay in sync with each other.
 */
export async function createBudgetAlertNotification(input: BudgetAlertInput) {
  const isExceeded = input.type === "BUDGET_EXCEEDED";
  const title = isExceeded
    ? `Budget exceeded: ${input.categoryName}`
    : `Approaching budget limit: ${input.categoryName}`;
  const message = isExceeded
    ? `You've spent ${input.baseCurrency} ${input.spent.toFixed(2)} of your ${input.baseCurrency} ${input.limit.toFixed(2)} ${input.categoryName} budget (${input.percentUsed}%).`
    : `You've used ${input.percentUsed}% of your ${input.baseCurrency} ${input.limit.toFixed(2)} ${input.categoryName} budget (${input.baseCurrency} ${input.spent.toFixed(2)} spent so far).`;

  const notification = await prisma.notification.create({
    data: {
      type: input.type,
      title,
      message,
      userId: input.userId,
      budgetId: input.budgetId,
    },
  });

  try {
    await sendEmail(
      input.userEmail,
      title,
      `<p>Hi ${input.userName},</p><p>${message}</p><p>— Finance Tracker</p>`
    );
  } catch (err) {
    console.error(`[notification.service] Failed to send email for notification ${notification.id}:`, err);
  }

  return notification;
}