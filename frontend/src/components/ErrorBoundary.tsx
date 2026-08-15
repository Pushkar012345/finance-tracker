import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Rendered instead of the default card when a child throws. */
  fallback?: ReactNode;
  /** Short label shown in the default fallback, e.g. "budgets" or "the dashboard". */
  label?: string;
  /**
   * "page" renders a full-screen fallback (use once, near the root).
   * "section" renders a compact inline card (use around individual widgets
   * so one broken section doesn't take the rest of the page down with it).
   */
  variant?: "page" | "section";
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors in its children (not async/event-handler
 * errors — those still need their own try/catch, same as React always).
 * Without a boundary here, any uncaught render error in ANY component
 * white-screens the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment this is where you'd forward to an error-tracking
    // service (Sentry, etc). Logging to console keeps it visible for now.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const label = this.props.label ?? "this section";

    if (this.props.variant === "page") {
      return (
        <div className="min-h-screen bg-sprout-bg flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-sprout-primary-light flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-sprout-warning" />
            </div>
            <h1 className="font-display text-lg text-sprout-text mb-1.5">Something went wrong</h1>
            <p className="text-sprout-text-muted text-sm mb-5">
              An unexpected error broke the page. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 bg-sprout-primary text-white text-sm font-medium px-4 py-2.5 rounded-sprout hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={14} />
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-sprout-surface border border-sprout-border rounded-sprout p-5 mb-6 text-center">
        <p className="text-sprout-text-muted text-sm mb-2">
          Couldn't load {label}. The rest of the page is unaffected.
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 text-sprout-primary text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <RotateCcw size={13} />
          Try again
        </button>
      </div>
    );
  }
}