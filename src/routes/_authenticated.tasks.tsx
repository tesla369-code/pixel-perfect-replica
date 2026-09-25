import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, LoadingRows } from "@/components/common/States";
import { PriorityBadge, StatusBadge } from "@/components/common/Badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmployees, useTaskMutations, useTasks } from "@/hooks/useData";
import { formatShortDate, initials, PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER } from "@/lib/task-utils";
import type { Task, TaskPriority, TaskStatus, TaskWithMeta, WeekNumber } from "@/types";

interface TaskSearch {
  q?: string | undefined;
  new?: boolean | undefined;
}

export const Route = createFileRoute("/_authenticated/tasks")({
  validateSearch: (search: Record<string, unknown>): TaskSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    new: search["new"] === true || search["new"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tasks — Quorum Agency OS" },
      {
        name: "description",
        content: "Create, assign, filter and track every task across kanban, list, weekly and employee views.",
      },
      { property: "og:title", content: "Tasks — Quorum Agency OS" },
      { property: "og:description", content: "Kanban, list, weekly and employee views of all agency tasks." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { q, new: newParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: employees = [] } = useEmployees();
  const { update, remove } = useTaskMutations();

  const [search, setSearch] = useState(q ?? "");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [week, setWeek] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<TaskWithMeta | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskWithMeta | null>(null);

  useEffect(() => {
    if (newParam) {
      setEditing(null);
      setDialogOpen(true);
      navigate({ search: { q } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam]);

  useEffect(() => setSearch(q ?? ""), [q]);

  const filters = useMemo(
    () => ({
      search,
      employeeId,
      week: week === "all" ? ("all" as const) : (Number(week) as WeekNumber),
      status: status as TaskStatus | "all",
      priority: priority as TaskPriority | "all",
    }),
    [search, employeeId, week, status, priority],
  );

  const { data: tasks = [], isLoading } = useTasks(filters);
  const employeeName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? "Unassigned";

  async function changeStatus(task: TaskWithMeta, next: Task["status"]) {
    await update.mutateAsync({ id: task.id, input: { status: next } });
    toast.success(`Moved to ${STATUS_LABELS[next]}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks"
        description="Everything assigned this month, across every week and teammate."
        actions={
          <Button
            variant="brand"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New task
          </Button>
        }
      />

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or code…"
          className="h-9 w-full sm:w-64"
        />
        <FilterSelect value={employeeId} onChange={setEmployeeId} placeholder="Employee">
          <SelectItem value="all">All employees</SelectItem>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect value={week} onChange={setWeek} placeholder="Week">
          <SelectItem value="all">All weeks</SelectItem>
          {[1, 2, 3, 4].map((w) => (
            <SelectItem key={w} value={String(w)}>
              Week {w}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus} placeholder="Status">
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect value={priority} onChange={setPriority} placeholder="Priority">
          <SelectItem value="all">All priorities</SelectItem>
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </FilterSelect>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{tasks.length} tasks</span>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="employee">Employee</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <LoadingRows className="mt-4" rows={5} />
        ) : tasks.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No tasks match these filters"
            description="Try clearing a filter or create a new task for this week."
          />
        ) : (
          <>
            <TabsContent value="kanban" className="mt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {STATUS_ORDER.map((col) => {
                  const columnTasks = tasks.filter((t) => t.derived_status === col);
                  return (
                    <div key={col} className="panel p-3">
                      <div className="flex items-center justify-between px-1 pb-2">
                        <span className="text-xs font-semibold">{STATUS_LABELS[col]}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {String(columnTasks.length).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {columnTasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setDetail(t)}
                            className="block w-full rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-brand/40"
                          >
                            <div className="text-[12.5px] font-medium leading-snug">{t.title}</div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <PriorityBadge priority={t.priority} />
                              <span className="truncate font-mono text-[10px] text-muted-foreground">
                                {employeeName(t.employee_id)} · {formatShortDate(t.due_date)}
                              </span>
                            </div>
                          </button>
                        ))}
                        {columnTasks.length === 0 ? (
                          <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">Empty</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <div className="panel overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => (
                      <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetail(t)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.task_code}</TableCell>
                        <TableCell className="max-w-[280px] truncate font-medium">{t.title}</TableCell>
                        <TableCell className="text-sm">{employeeName(t.employee_id)}</TableCell>
                        <TableCell className="font-mono text-xs">W{t.week_number}</TableCell>
                        <TableCell className="font-mono text-xs">{formatShortDate(t.due_date)}</TableCell>
                        <TableCell>
                          <PriorityBadge priority={t.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.derived_status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Select
                              value={t.status}
                              onValueChange={(v) => changeStatus(t, v as Task["status"])}
                            >
                              <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Edit task"
                              onClick={() => {
                                setEditing(t);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Delete task"
                              onClick={() => setPendingDelete(t)}
                            >
                              <Trash2 className="text-bad" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="mt-4 space-y-4">
              {[1, 2, 3, 4].map((w) => {
                const weekTasks = tasks.filter((t) => t.week_number === w);
                return (
                  <div key={w} className="panel">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                      <h3 className="text-sm font-semibold">Week {w}</h3>
                      <span className="font-mono text-xs text-muted-foreground">{weekTasks.length} tasks</span>
                    </div>
                    <div className="divide-y divide-border">
                      {weekTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setDetail(t)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent"
                        >
                          <StatusBadge status={t.derived_status} />
                          <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                            {employeeName(t.employee_id)}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatShortDate(t.due_date)}
                          </span>
                        </button>
                      ))}
                      {weekTasks.length === 0 ? (
                        <p className="px-4 py-5 text-center text-xs text-muted-foreground">
                          Nothing planned for this week.
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="employee" className="mt-4 space-y-4">
              {employees.map((e) => {
                const own = tasks.filter((t) => t.employee_id === e.id);
                if (!own.length) return null;
                return (
                  <div key={e.id} className="panel">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
                      <span className="grid size-7 place-items-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">
                        {initials(e.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{e.name}</div>
                        <div className="text-[11px] text-muted-foreground">{e.designation}</div>
                      </div>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {own.length} tasks
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {own.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setDetail(t)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent"
                        >
                          <StatusBadge status={t.derived_status} />
                          <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            W{t.week_number} · {formatShortDate(t.due_date)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </>
        )}
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
      <TaskDetailSheet
        task={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onEdit={(t) => {
          setDetail(null);
          setEditing(t);
          setDialogOpen(true);
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this task?"
        description={`"${pendingDelete?.title}" will be permanently removed.`}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove.mutateAsync(pendingDelete.id);
          setPendingDelete(null);
          toast.success("Task deleted");
        }}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[150px] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
