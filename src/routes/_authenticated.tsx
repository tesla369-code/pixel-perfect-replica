import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function GlobalSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/tasks", search: { q: value || undefined } });
      }}
      className="relative max-w-md"
    >
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
        /
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tasks, people, goals…"
        aria-label="Search tasks"
        className="w-full rounded-md border border-border bg-background py-2 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </form>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen space-y-4 bg-background p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <AppShell search={<GlobalSearch />}>
      <Outlet />
    </AppShell>
  );
}
