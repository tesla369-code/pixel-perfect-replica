import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, StatTile } from "@/components/common/States";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useEmployees, useMonthlySummary, useTasks } from "@/hooks/useData";
import { useCurrentGoal } from "@/hooks/useCurrentGoal";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Quorum Agency OS" },
      { name: "description", content: "Completion, productivity and workload reports for the agency team." },
      { property: "og:title", content: "Reports — Quorum Agency OS" },
      { property: "og:description", content: "Monthly and weekly performance reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const goal = useCurrentGoal();
  const goalId = (goal as { goal?: { id: string } } | undefined)?.goal?.id ?? (goal as { id?: string } | undefined)?.id;
  const { data: summary } = useMonthlySummary(goalId);
  const { data: employees = [] } = useEmployees();
  const { data: tasks = [] } = useTasks();

  const weekly = (summary?.weeks ?? []).map((w) => ({
    name: `W${w.week_number}`,
    Completed: w.completed,
    Pending: w.pending,
    Overdue: w.overdue,
  }));
  const people = employees.map((e) => ({
    name: e.name.split(" ")[0],
    Completed: e.stats.completed,
    Pending: e.stats.pending,
    Overdue: e.stats.overdue,
  }));
  const completed = tasks.filter((t) => t.derived_status === "completed").length;
  const overdue = tasks.filter((t) => t.derived_status === "overdue").length;
  const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="How the month is going, week by week and person by person." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Month completion" value={`${summary?.completion_percentage ?? 0}%`} tone="brand" />
        <StatTile label="All tasks" value={tasks.length} />
        <StatTile label="Completed" value={completed} tone="good" />
        <StatTile label="Overdue" value={overdue} tone="bad" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-medium">Weekly completion</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="var(--good)" />
                <Bar dataKey="Pending" stackId="a" fill="var(--brand)" />
                <Bar dataKey="Overdue" stackId="a" fill="var(--bad)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-medium">Workload by employee</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={people}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="var(--good)" />
                <Bar dataKey="Pending" stackId="a" fill="var(--brand)" />
                <Bar dataKey="Overdue" stackId="a" fill="var(--bad)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="panel p-4">
        <h2 className="mb-3 text-sm font-medium">Employee productivity</h2>
        <div className="space-y-3">
          {employees.map((e) => (
            <div key={e.id} className="grid grid-cols-[140px_1fr_48px] items-center gap-3 text-sm">
              <span className="truncate">{e.name}</span>
              <ProgressBar value={e.stats.completion_percentage} />
              <span className="text-right font-mono text-xs">{e.stats.completion_percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
