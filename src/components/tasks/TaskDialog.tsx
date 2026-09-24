import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees, useMonthlyGoals, useTaskMutations } from "@/hooks/useData";
import { PRIORITY_LABELS } from "@/lib/task-utils";
import type { Task, TaskInput, TaskPriority, WeekNumber } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Give the task a clear title"),
  description: z.string().max(600).optional().default(""),
  employee_id: z.string().min(1, "Assign the task to someone"),
  monthly_goal_id: z.string().min(1, "Pick a monthly goal"),
  week_number: z.coerce.number().min(1).max(4),
  start_date: z.string().min(1, "Start date is required"),
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "completed"]),
  notes: z.string().max(600).optional().default(""),
});

type FormValues = z.input<typeof schema>;

export interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaults?: Partial<TaskInput>;
}

export function TaskDialog({ open, onOpenChange, task, defaults }: TaskDialogProps) {
  const { data: employees = [] } = useEmployees();
  const { data: goals = [] } = useMonthlyGoals();
  const { create, update } = useTaskMutations();
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      employee_id: "",
      monthly_goal_id: "",
      week_number: 1,
      start_date: today,
      due_date: today,
      priority: "medium",
      status: "todo",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      employee_id: task?.employee_id ?? defaults?.employee_id ?? employees[0]?.id ?? "",
      monthly_goal_id: task?.monthly_goal_id ?? defaults?.monthly_goal_id ?? goals[0]?.id ?? "",
      week_number: task?.week_number ?? defaults?.week_number ?? 1,
      start_date: task?.start_date ?? defaults?.start_date ?? today,
      due_date: task?.due_date ?? defaults?.due_date ?? today,
      priority: task?.priority ?? "medium",
      status: task?.status ?? "todo",
      notes: task?.notes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, employees.length, goals.length]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: TaskInput = {
      title: values.title,
      description: values.description ?? "",
      employee_id: values.employee_id,
      monthly_goal_id: values.monthly_goal_id,
      week_number: Number(values.week_number) as WeekNumber,
      start_date: values.start_date,
      due_date: values.due_date,
      priority: values.priority as TaskPriority,
      status: values.status,
      notes: values.notes ?? "",
    };
    try {
      if (task) {
        await update.mutateAsync({ id: task.id, input: payload });
        toast.success("Task updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not save the task");
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Assign work to a teammate and tie it to a week of the monthly goal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Task title</Label>
            <Input id="title" {...form.register("title")} placeholder="e.g. Draft Q4 content calendar" />
            {errors.title ? <p className="text-xs text-bad">{errors.title.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Assigned employee</Label>
              <Select
                value={form.watch("employee_id")}
                onValueChange={(v) => form.setValue("employee_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · {e.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id ? <p className="text-xs text-bad">{errors.employee_id.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Monthly goal</Label>
              <Select
                value={form.watch("monthly_goal_id")}
                onValueChange={(v) => form.setValue("monthly_goal_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Week</Label>
              <Select
                value={String(form.watch("week_number"))}
                onValueChange={(v) => form.setValue("week_number", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      Week {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" type="date" {...form.register("start_date")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...form.register("due_date")} />
              {errors.due_date ? <p className="text-xs text-bad">{errors.due_date.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
