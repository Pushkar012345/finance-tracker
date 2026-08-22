import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthInput from "../components/AuthInput";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signup(name, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.error ?? "Couldn't create your account. Try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sprout-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-sprout-primary-light flex items-center justify-center mb-3">
            <Sprout size={22} className="text-sprout-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-sprout-text mb-1">Create your account</h1>
          <p className="text-sprout-text-muted text-sm">Start tracking in under a minute.</p>
        </div>

        <div className="bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <AuthInput
              label="Name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {error && <p className="text-sprout-danger text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sprout-primary text-white font-medium py-2.5 rounded-xl hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-sprout-text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-sprout-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}