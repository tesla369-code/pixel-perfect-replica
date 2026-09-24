import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, EmptyState, LoadingRows, StatTile } from "@/components/common/States";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatusBadge, PriorityBadge } from "@/components/common/Badges";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrentGoal } from "@/hooks/useCurrentGoal";
import { useGoalMutations, useMonthlySummary, useTasks, useWeeklyGoals, useEmployees } from "@/hooks/useData";
import { currentWeekNumber, formatDate, formatShortDate, monthLabel } from "@/lib/task-utils";
import type { TaskWithMeta, WeekNumber } from "@/types";

interface WeekSearch {
  week?: WeekNumber;
  goal?: string;
}

export const Route = createFileRoute("/_authenticated/weekly-planning")({
  validateSearch: (search: Record<string, unknown>): WeekSearch => {
    const week = Number(search.week);
    return {
      week: week >= 1 && week <= 4 ? (week as WeekNumber) : undefined,
      goal: typeof search.goal === "string" ? search.goal : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Weekly Planning — Quorum Agency OS" },
      {
        name: "description",
        content: "Set the objective for each week and review the tasks, progress and blockers inside it.",
      },
      { property: "og:title", content: "Weekly Planning — Quorum Agency OS" },
      { property: "og:description", content: "Weekly objectives, task lists and completion for Weeks 1–4." },
    ],
  }),
  component: WeeklyPlanningPage,
});

function WeeklyPlanningPage() {
  const { week: weekParam, goal: goalParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { goal, goals } = useCurrentGoal(goalParam);
  const { data: summary, isLoading } = useMonthlySummary(goal?.id);
  const { data: weeklyGoals = [] } = useWeeklyGoals(goal?.id);
  const { data: tasks = [] } = useTasks({ monthlyGoalId: goal?.id ?? "all" });
  const { data: employees = [] } = useEmployees();
  const { updateWeek } = useGoalMutations();

  const activeWeek = weekParam ?? currentWeekNumber();
  const [objectiveDraft, setObjectiveDraft] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detail, setDetail] = useState<TaskWithMeta | null>(null);

  if (isLoading || !summary) return <LoadingRows rows={5} />;
  if (!goal) {
    return <EmptyState title="No monthly goal" description="Create a monthly goal before planning weeks." />;
  }

  const week = summary.weeks.find((w) => w.week_number === activeWeek)!;
  const weekRecord = weeklyGoals.find((w) => w.week_number === activeWeek);
  const weekTasks = tasks.filter((t) => t.week_number === activeWeek);
  const employeeName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? "Unassigned";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weekly Planning"
        description={`${monthLabel(goal.month)} · ${goal.title}`}
        actions={
          <>
            <Select
              value={goal.id}
              onValueChange={(v) => navigate({ search: { week: activeWeek, goal: v } })}
            >
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {monthLabel(g.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="brand" onClick={() => setDialogOpen(true)}>
              Add task to Week {activeWeek}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.weeks.map((w) => (
          <button
            key={w.week_number}
            onClick={() => navigate({ search: { week: w.week_number, goal: goal.id } })}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              w.week_number === activeWeek
                ? "border-brand/40 bg-brand/[0.06] ring-1 ring-brand/20"
                : "border-border bg-surface hover:bg-accent",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">W{w.week_number}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{w.total} tasks</span>
            </div>
            <div className="mt-3 font-mono text-xl font-semibold">{w.completion_percentage}%</div>
            <ProgressBar
              className="mt-2"
              value={w.completion_percentage}
              tone={w.week_number === activeWeek ? "gradient" : "brand"}
            />
          </button>
        ))}
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Week {activeWeek} objective</h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {week.start_date ? `${formatDate(week.start_date)} → ${formatDate(week.end_date)}` : "—"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={objectiveDraft ?? weekRecord?.objective ?? ""}
            onChange={(e) => setObjectiveDraft(e.target.value)}
            placeholder="What must be true by the end of this week?"
          />
          <Button
            variant="subtle"
            onClick={async () => {
              if (!weekRecord) return;
              await updateWeek.mutateAsync({
                id: weekRecord.id,
                input: { objective: objectiveDraft ?? weekRecord.objective },
              });
              setObjectiveDraft(null);
              toast.success("Weekly objective saved");
            }}
          >
            Save objective
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Tasks" value={week.total} />
        <StatTile label="Completed" value={week.completed} tone="good" />
        <StatTile label="Pending" value={week.pending} tone="warn" />
        <StatTile label="Overdue" value={week.overdue} tone="bad" />
      </div>

      <div className="panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Week {activeWeek} tasks</h2>
          <span className="font-mono text-xs text-muted-foreground">{weekTasks.length} items</span>
        </div>
        {weekTasks.length === 0 ? (
          <EmptyState
            className="m-4 border-0"
            title="Nothing planned yet"
            description="Add the first task for this week."
            action={
              <Button variant="brand" onClick={() => setDialogOpen(true)}>
                Add task
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {weekTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setDetail(t)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent"
              >
                <StatusBadge status={t.derived_status} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                <PriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
                  {employeeName(t.employee_id)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatShortDate(t.due_date)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaults={{
          monthly_goal_id: goal.id,
          week_number: activeWeek,
          start_date: week.start_date || undefined,
          due_date: week.end_date || undefined,
        }}
      />
      <TaskDetailSheet task={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}
