import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader, EmptyState, LoadingRows } from "@/components/common/States";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoalMutations, useMonthlyGoals, useTasks } from "@/hooks/useData";
import { formatDate, monthLabel, pct } from "@/lib/task-utils";
import type { GoalStatus, MonthlyGoal } from "@/types";

export const Route = createFileRoute("/_authenticated/monthly-goals")({
  head: () => ({
    meta: [
      { title: "Monthly Goals — Quorum Agency OS" },
      {
        name: "description",
        content: "Create monthly goals, set targets and watch completion across the four planning weeks.",
      },
      { property: "og:title", content: "Monthly Goals — Quorum Agency OS" },
      { property: "og:description", content: "Create monthly goals and track completion week by week." },
    ],
  }),
  component: MonthlyGoalsPage,
});

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Pick a month"),
  title: z.string().min(3, "Give the goal a title"),
  description: z.string().optional().default(""),
  target: z.string().min(2, "Describe the target"),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: z.enum(["planned", "active", "completed", "at_risk"]),
});
type FormValues = z.input<typeof schema>;

const STATUS_LABEL: Record<GoalStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  at_risk: "At risk",
};

function MonthlyGoalsPage() {
  const { data: goals = [], isLoading } = useMonthlyGoals();
  const { data: tasks = [] } = useTasks();
  const { create, update, remove } = useGoalMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MonthlyGoal | null>(null);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: thisMonth,
      title: "",
      description: "",
      target: "",
      start_date: `${thisMonth}-01`,
      end_date: `${thisMonth}-28`,
      status: "planned",
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      month: thisMonth,
      title: "",
      description: "",
      target: "",
      start_date: `${thisMonth}-01`,
      end_date: `${thisMonth}-28`,
      status: "planned",
    });
    setOpen(true);
  }

  function openEdit(goal: MonthlyGoal) {
    setEditing(goal);
    form.reset({ ...goal });
    setOpen(true);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, description: values.description ?? "" };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: payload });
        toast.success("Goal updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Goal created with Weeks 1–4");
      }
      setOpen(false);
    } catch {
      toast.error("Could not save the goal");
    }
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly Goals"
        description="Each goal is automatically split into Week 1 through Week 4."
        actions={
          <Button variant="brand" onClick={openCreate}>
            New monthly goal
          </Button>
        }
      />

      {isLoading ? (
        <LoadingRows rows={3} />
      ) : goals.length === 0 ? (
        <EmptyState
          title="No monthly goals yet"
          description="Create your first goal to start weekly planning."
          action={
            <Button variant="brand" onClick={openCreate}>
              New monthly goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const goalTasks = tasks.filter((t) => t.monthly_goal_id === goal.id);
            const completed = goalTasks.filter((t) => t.derived_status === "completed").length;
            const percentage = pct(completed, goalTasks.length);
            return (
              <div key={goal.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {monthLabel(goal.month)}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight">{goal.title}</h2>
                  </div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {STATUS_LABEL[goal.status]}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Target</dt>
                    <dd className="mt-0.5 font-medium">{goal.target}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Window</dt>
                    <dd className="mt-0.5 font-mono">
                      {formatDate(goal.start_date)} → {formatDate(goal.end_date)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-mono">{percentage}%</span>
                  </div>
                  <ProgressBar className="mt-1.5" value={percentage} tone="gradient" />
                  <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    {completed}/{goalTasks.length} tasks
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((w) => {
                    const weekTasks = goalTasks.filter((t) => t.week_number === w);
                    const weekDone = weekTasks.filter((t) => t.derived_status === "completed").length;
                    return (
                      <div key={w} className="rounded-md border border-border p-2">
                        <div className="font-mono text-[10px] text-muted-foreground">W{w}</div>
                        <div className="mt-1 font-mono text-sm">{pct(weekDone, weekTasks.length)}%</div>
                        <ProgressBar className="mt-1" value={pct(weekDone, weekTasks.length)} />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="subtle" onClick={() => openEdit(goal)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(goal)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit monthly goal" : "New monthly goal"}</DialogTitle>
            <DialogDescription>Weeks 1–4 are generated automatically for every goal.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="month">Month</Label>
                <Input id="month" type="month" {...form.register("month")} />
                {form.formState.errors.month ? (
                  <p className="text-xs text-bad">{form.formState.errors.month.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as GoalStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Goal title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title ? (
                <p className="text-xs text-bad">{form.formState.errors.title.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">Target</Label>
              <Input id="target" {...form.register("target")} />
              {form.formState.errors.target ? (
                <p className="text-xs text-bad">{form.formState.errors.target.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start date</Label>
                <Input id="start_date" type="date" {...form.register("start_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End date</Label>
                <Input id="end_date" type="date" {...form.register("end_date")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={form.formState.isSubmitting}>
                {editing ? "Save changes" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this monthly goal?"
        description="Its weekly objectives and every task inside it will be removed."
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove.mutateAsync(pendingDelete.id);
          setPendingDelete(null);
          toast.success("Goal deleted");
        }}
      />
    </div>
  );
}
