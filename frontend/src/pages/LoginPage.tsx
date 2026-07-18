import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, continueAsDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemo() {
    setError("");
    setIsLoading(true);
    try {
      await continueAsDemo();
      navigate("/dashboard");
    } catch {
      setError("Couldn't load the demo right now. Try again.");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-sprout-text mb-1">Finance tracker</h1>
          <p className="text-sprout-text-muted text-sm">Track spending, budgets, and goals.</p>
        </div>

        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="w-full bg-sprout-primary text-white font-medium py-3 rounded-xl mb-4 disabled:opacity-60"
        >
          {isLoading ? "Loading demo..." : "Continue without login"}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-sprout-border flex-1" />
          <span className="text-sprout-text-muted text-xs">or sign in</span>
          <div className="h-px bg-sprout-border flex-1" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sprout-surface border border-sprout-border text-sprout-text font-medium py-2.5 rounded-xl disabled:opacity-60"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-sprout-text-muted mt-4">
          No account? <Link to="/signup" className="text-sprout-primary font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}