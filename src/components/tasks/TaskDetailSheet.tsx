import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/common/Badges";
import { formatDate } from "@/lib/task-utils";
import { useEmployees } from "@/hooks/useData";
import type { TaskWithMeta } from "@/types";

export function TaskDetailSheet({
  task,
  onOpenChange,
  onEdit,
}: {
  task: TaskWithMeta | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: TaskWithMeta) => void;
}) {
  const { data: employees = [] } = useEmployees();
  const employee = employees.find((e) => e.id === task?.employee_id);

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {task ? (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6 text-left text-lg leading-snug">{task.title}</SheetTitle>
              <SheetDescription className="text-left font-mono text-xs">{task.task_code}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={task.derived_status} />
              <PriorityBadge priority={task.priority} />
              {task.days_overdue > 0 ? (
                <span className="rounded bg-bad/15 px-1.5 py-0.5 text-[10px] font-medium text-bad">
                  {task.days_overdue} day{task.days_overdue === 1 ? "" : "s"} overdue
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{task.description}</p>

            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <Row label="Assigned to" value={employee?.name ?? "Unassigned"} />
              <Row label="Week" value={`Week ${task.week_number}`} />
              <Row label="Start date" value={formatDate(task.start_date)} />
              <Row label="Due date" value={formatDate(task.due_date)} />
              <Row label="Created" value={formatDate(task.created_at)} />
              <Row label="Completed" value={formatDate(task.completed_at)} />
            </dl>

            {task.notes ? (
              <div className="mt-5 rounded-lg border border-border bg-surface p-3">
                <div className="text-xs text-muted-foreground">Notes</div>
                <p className="mt-1 text-sm">{task.notes}</p>
              </div>
            ) : null}

            {onEdit ? (
              <Button variant="brand" className="mt-6 w-full" onClick={() => onEdit(task)}>
                Edit task
              </Button>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
