import { useState } from "react";
import { Loader2, X } from "lucide-react";
import NexusLogo3D from "./NexusLogo3D";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
};

export function LoginModal({ open, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      onSuccess(email.trim());
      setDone(false);
      setEmail("");
      setPassword("");
      onClose();
    }, 850);
  };

  const field =
    "w-full rounded-xl border border-gold/25 bg-ink/70 px-4 py-3 text-sm text-warm placeholder:text-muted-foreground focus:border-gold focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/80 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="glass-panel w-full max-w-md animate-rise-in rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <NexusLogo3D size={44} withOrbit={false} />
            <h2 id="login-title" className="font-display text-2xl text-gold-gradient">
              Welcome back
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login"
            className="grid size-9 place-items-center rounded-full border border-gold/25 text-gold hover:border-gold-bright"
          >
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <p className="py-10 text-center text-sm text-gold-pale">
            Access granted. Initialising your Nexus session…
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="text-xs tracking-wide text-gold/80">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`mt-1.5 ${field}`}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-xs tracking-wide text-gold/80">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`mt-1.5 ${field}`}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-neon-bright">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/60 bg-linear-to-b from-crimson-dark/70 to-ink py-3 text-sm font-medium text-gold transition-all hover:border-gold-bright hover:shadow-neon disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Authenticating" : "Login"}
            </button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button type="button" className="hover:text-gold">
                Forgot password?
              </button>
              <button type="button" className="hover:text-gold">
                Create account
              </button>
            </div>

            <div className="h-px hairline-gold" />

            <button
              type="button"
              onClick={() => onSuccess("demo@nexus.ai")}
              className="w-full rounded-full border border-gold/25 py-3 text-sm text-warm transition-colors hover:border-gold"
            >
              Continue with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginModal;
