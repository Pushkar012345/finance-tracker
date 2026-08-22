import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  // "page" — full-screen fallback, for wrapping the whole app/route.
  // "section" — compact inline fallback, for wrapping one dashboard widget
  // so a crash in, say, the chart doesn't take down budgets/goals/transactions
  // alongside it.
  variant?: "page" | "section";
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // In a real deployment this is where an error-tracking call (Sentry etc.)
    // would go. For now it at least surfaces in the console instead of
    // silently white-screening.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.variant === "section") {
      return (
        <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-6 text-center">
          <p className="text-sprout-text text-sm font-medium mb-1">
            {this.props.sectionName ? `${this.props.sectionName} couldn't load` : "This section couldn't load"}
          </p>
          <p className="text-sprout-text-muted text-xs">
            The rest of the page should still work. Try refreshing.
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-sprout-bg flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-lg font-semibold text-sprout-text mb-2">
            Something went wrong
          </p>
          <p className="text-sprout-text-muted text-sm mb-5">
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-sprout-primary text-white text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}