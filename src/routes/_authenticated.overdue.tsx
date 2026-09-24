import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, EmptyState, LoadingRows, StatTile } from "@/components/common/States";
import { PriorityBadge } from "@/components/common/Badges";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployees, useTaskMutations, useTasks } from "@/hooks/useData";
import { formatDate } from "@/lib/task-utils";
import type { Task, TaskWithMeta } from "@/types";

export const Route = createFileRoute("/_authenticated/overdue")({
  head: () => ({
    meta: [
      { title: "Overdue Tasks — Quorum Agency OS" },
      {
        name: "description",
        content: "Every task past its due date, who owns it, how late it is and how to reschedule it.",
      },
      { property: "og:title", content: "Overdue Tasks — Quorum Agency OS" },
      { property: "og:description", content: "Triage missed deadlines and reassign or reschedule work." },
    ],
  }),
  component: OverduePage,
});

function OverduePage() {
  const { data: tasks = [], isLoading } = useTasks({ status: "overdue" });
  const { data: employees = [] } = useEmployees();
  const { update } = useTaskMutations();
  const [editing, setEditing] = useState<Task | null>(null);
  const [rescheduling, setRescheduling] = useState<TaskWithMeta | null>(null);
  const [newDate, setNewDate] = useState("");

  const employeeName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? "Unassigned";
  const worst = tasks.reduce((max, t) => Math.max(max, t.days_overdue), 0);
  const urgent = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overdue Tasks"
        description="Tasks whose due date has passed while their status is not Completed."
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Overdue tasks" value={tasks.length} tone="bad" />
        <StatTile label="High / urgent" value={urgent} tone="warn" />
        <StatTile label="Worst delay" value={`${worst}d`} />
      </div>

      {isLoading ? (
        <LoadingRows rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState title="Nothing is overdue" description="Every task is on or ahead of schedule." />
      ) : (
        <div className="panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Original due date</TableHead>
                <TableHead>Days overdue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reschedule / reassign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{employeeName(t.employee_id)}</TableCell>
                  <TableCell className="max-w-[240px] truncate font-medium">{t.title}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(t.due_date)}</TableCell>
                  <TableCell className="font-mono text-xs text-bad">{t.days_overdue}d</TableCell>
                  <TableCell>
                    <PriorityBadge priority={t.priority} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.status === "in_progress" ? "In Progress" : "To Do"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={t.employee_id ?? ""}
                        onValueChange={async (v) => {
                          await update.mutateAsync({ id: t.id, input: { employee_id: v } });
                          toast.success("Task reassigned");
                        }}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="Reassign" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          setRescheduling(t);
                          setNewDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rescheduling ? (
        <div className="panel flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">New due date for "{rescheduling.title}"</p>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            variant="brand"
            onClick={async () => {
              await update.mutateAsync({ id: rescheduling.id, input: { due_date: newDate } });
              setRescheduling(null);
              toast.success("Task rescheduled");
            }}
          >
            Save new date
          </Button>
          <Button variant="ghost" onClick={() => setRescheduling(null)}>
            Cancel
          </Button>
        </div>
      ) : null}

      <TaskDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} task={editing} />
    </div>
  );
}
