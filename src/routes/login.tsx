import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_CREDENTIALS } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Quorum Agency OS" },
      { name: "description", content: "Administrator sign-in for the Quorum agency task management system." },
      { property: "og:title", content: "Sign in — Quorum Agency OS" },
      { property: "og:description", content: "Administrator sign-in for Quorum agency task management." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await signIn(email, password);
    setSubmitting(false);
    if (message) setError(message);
    else navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-md bg-gradient-brand font-mono text-sm font-semibold text-primary-foreground">
            Q
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">Quorum</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agency OS</div>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-semibold leading-tight tracking-tight">
          <span className="text-gradient-brand">Sign in</span> to your workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrator access only. Employees do not have accounts in this version.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</p>
          ) : null}

          <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
            {submitting ? "Verifying…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          Demo access · {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
        </p>
      </div>
    </div>
  );
}
