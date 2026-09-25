import type { TaskPriority, TaskStatus, WeekNumber } from "@/types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "completed", "overdue"];
export const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(value: string) {
  const d = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function currentWeekNumber(date = new Date()): WeekNumber {
  return Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7))) as WeekNumber;
}

export function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}
