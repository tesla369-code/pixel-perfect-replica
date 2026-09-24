import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCurrentGoal } from "@/hooks/useCurrentGoal";
import { useActivity, useEmployees, useMonthlySummary } from "@/hooks/useData";
import { ProgressBar } from "@/components/common/ProgressBar";
import { EmptyState, LoadingRows, StatTile } from "@/components/common/States";
import { currentWeekNumber, initials, monthLabel } from "@/lib/task-utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Quorum Agency OS" },
      {
        name: "description",
        content: "Monthly goal progress, weekly breakdown, task counts and team workload at a glance.",
      },
      { property: "og:title", content: "Dashboard — Quorum Agency OS" },
      { property: "og:description", content: "Monthly goal progress and team workload at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { goal, isLoading: goalLoading } = useCurrentGoal();
  const { data: summary, isLoading } = useMonthlySummary(goal?.id);
  const { data: employees = [] } = useEmployees();
  const { data: activity = [] } = useActivity();
  const activeWeek = currentWeekNumber();

  if (goalLoading || isLoading || !summary) {
    return <LoadingRows rows={6} />;
  }

  if (!goal) {
    return (
      <EmptyState
        title="No monthly goal yet"
        description="Create a monthly goal to start planning weeks and assigning tasks."
        action={
          <Button asChild variant="brand">
            <Link to="/monthly-goals">Create monthly goal</Link>
          </Button>
        }
      />
    );
  }

  const chartData = summary.weeks.map((w) => ({
    name: `W${w.week_number}`,
    Completed: w.completed,
    Pending: w.pending,
    Overdue: w.overdue,
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-end">
        <div className="flex-1">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Current monthly goal
          </div>
          <h1 className="mt-2 max-w-[18ch] text-4xl font-semibold leading-none tracking-tight xl:text-6xl">
            <span className="text-gradient-brand">{summary.completion_percentage}%</span> toward{" "}
            {monthLabel(goal.month).split(" ")[0]} delivery target
          </h1>
          <p className="mt-3 max-w-[46ch] text-sm text-muted-foreground">
            {summary.completed} of {summary.total} tasks shipped across {employees.length} teammates.{" "}
            {summary.overdue} items are past due and need triage.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold">
              {summary.completed}/{summary.total}
            </div>
            <div className="text-xs text-muted-foreground">tasks complete</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-bad">{summary.overdue}</div>
            <div className="text-xs text-muted-foreground">overdue</div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Week progress</h2>
          <span className="font-mono text-xs text-muted-foreground">Week {activeWeek} of 4</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.weeks.map((w) => {
            const active = w.week_number === activeWeek;
            const done = w.completion_percentage === 100;
            return (
              <Link
                key={w.week_number}
                to="/weekly-planning"
                search={{ week: w.week_number }}
                className={
                  active
                    ? "rounded-lg border border-brand/40 bg-brand/[0.06] p-4 ring-1 ring-brand/20 transition-colors"
                    : "panel p-4 transition-colors hover:bg-accent"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">W{w.week_number}</span>
                  <span
                    className={
                      done
                        ? "rounded bg-good/15 px-1.5 py-0.5 text-[10px] font-medium text-good"
                        : active
                          ? "rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-medium text-warn"
                          : "rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    }
                  >
                    {done ? "Done" : active ? "In progress" : "Planned"}
                  </span>
                </div>
                <div className="mt-3 font-mono text-xl font-semibold">{w.completion_percentage}%</div>
                <ProgressBar
                  className="mt-2"
                  value={w.completion_percentage}
                  tone={done ? "good" : active ? "gradient" : "muted"}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total tasks" value={summary.total} />
        <StatTile label="Completed" value={summary.completed} tone="good" />
        <StatTile label="In progress" value={summary.in_progress} tone="warn" />
        <StatTile label="Overdue" value={summary.overdue} tone="bad" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="panel xl:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">Employee workload</h2>
            <span className="font-mono text-xs text-muted-foreground">{employees.length} people</span>
          </div>
          <div className="divide-y divide-border">
            {employees.map((e) => {
              const overloaded = e.stats.overdue > 2;
              return (
                <Link
                  key={e.id}
                  to="/employees"
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">
                    {initials(e.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">{e.name}</span>
                      <span
                        className={
                          overloaded
                            ? "font-mono text-xs text-bad"
                            : "font-mono text-xs text-muted-foreground"
                        }
                      >
                        {e.stats.completion_percentage}%
                        {overloaded ? ` · ${e.stats.overdue} overdue` : ""}
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-1.5"
                      value={e.stats.completion_percentage}
                      tone={overloaded ? "bad" : "brand"}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="panel p-4 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Weekly completion</h2>
            <span className="font-mono text-xs text-muted-foreground">this month</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Completed" fill="var(--color-good)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pending" fill="var(--color-brand)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Overdue" fill="var(--color-bad)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="text-xs font-medium text-muted-foreground">Recent activity</h3>
            <ul className="mt-2 space-y-1.5">
              {activity.slice(0, 4).map((a) => (
                <li key={a.id} className="truncate text-[12px] text-muted-foreground">
                  {a.summary}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
