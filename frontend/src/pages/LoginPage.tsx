import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthInput from "../components/AuthInput";

export default function LoginPage() {
  const { login, continueAsDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  async function handleDemo() {
    setError("");
    setIsDemoLoading(true);
    try {
      await continueAsDemo();
      navigate("/dashboard");
    } catch {
      setError("Couldn't load the demo right now. Try again.");
    } finally {
      setIsDemoLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setIsLoading(false);
    }
  }

  const anyLoading = isLoading || isDemoLoading;

  return (
    <div className="min-h-screen bg-sprout-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-sprout-primary-light flex items-center justify-center mb-3">
            <Sprout size={22} className="text-sprout-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-sprout-text mb-1">Finance tracker</h1>
          <p className="text-sprout-text-muted text-sm">Track spending, budgets, and goals.</p>
        </div>

        <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-6">
          <button
            onClick={handleDemo}
            disabled={anyLoading}
            className="w-full bg-sprout-primary text-white font-medium py-3 rounded-xl mb-5 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDemoLoading && <Loader2 size={16} className="animate-spin" />}
            {isDemoLoading ? "Loading demo..." : "Continue without login"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-sprout-border flex-1" />
            <span className="text-sprout-text-muted text-xs">or sign in</span>
            <div className="h-px bg-sprout-border flex-1" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AuthInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sprout-danger text-sm">{error}</p>}
            <button
              type="submit"
              disabled={anyLoading}
              className="w-full bg-sprout-surface border border-sprout-border text-sprout-text font-medium py-2.5 rounded-xl hover:bg-sprout-bg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-sprout-text-muted mt-5">
          No account?{" "}
          <Link to="/signup" className="text-sprout-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}