import { useState, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Plain placeholder-only inputs (the previous version) lose their label
// the moment the user starts typing, which makes a half-filled form hard
// to scan. A persistent label above the field fixes that; the password
// type gets a show/hide toggle since finance-app passwords are often
// re-checked before submitting.
const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, type, className, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="text-sprout-text-muted text-xs font-medium mb-1.5 block">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          type={isPassword && showPassword ? "text" : type}
          className={`w-full border border-sprout-border rounded-xl px-4 py-2.5 text-sm text-sprout-text bg-sprout-surface placeholder:text-sprout-text-muted/60 focus:outline-none focus:ring-2 focus:ring-sprout-primary/40 focus:border-sprout-primary transition-colors ${
            isPassword ? "pr-11" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sprout-text-muted hover:text-sprout-text transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  );
});

export default AuthInput;