import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/task-utils";
import type { TaskPriority, TaskStatus } from "@/types";

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-warn/15 text-warn",
  completed: "bg-good/15 text-good",
  overdue: "bg-bad/15 text-bad",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warn/15 text-warn",
  urgent: "bg-bad/15 text-bad",
};

const base = "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap";

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return <span className={cn(base, priorityStyles[priority], className)}>{PRIORITY_LABELS[priority]}</span>;
}
