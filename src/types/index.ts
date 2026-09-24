/**
 * Domain types. These mirror the future Supabase PostgreSQL schema:
 * users, employees, monthly_goals, weekly_goals, tasks, task_comments,
 * notifications, activity_logs, settings.
 */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

export type WeekNumber = 1 | 2 | 3 | 4;

export const WEEK_NUMBERS: WeekNumber[] = [1, 2, 3, 4];

export type TaskStatus = "todo" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type GoalStatus = "planned" | "active" | "completed" | "at_risk";

export interface User {
  id: ID;
  email: string;
  name: string;
}

export interface Employee {
  id: ID;
  employee_code: string;
  name: string;
  email: string;
  avatar_url: string | null;
  designation: string;
  department: string;
  is_active: boolean;
  created_at: ISODateTime;
}

export interface EmployeeStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_percentage: number;
}

export interface EmployeeWithStats extends Employee {
  stats: EmployeeStats;
}

export interface MonthlyGoal {
  id: ID;
  month: string; // YYYY-MM
  title: string;
  description: string;
  target: string;
  start_date: ISODate;
  end_date: ISODate;
  status: GoalStatus;
  created_at: ISODateTime;
}

export interface WeeklyGoal {
  id: ID;
  monthly_goal_id: ID;
  week_number: WeekNumber;
  objective: string;
  start_date: ISODate;
  end_date: ISODate;
}

export interface Task {
  id: ID;
  task_code: string;
  title: string;
  description: string;
  employee_id: ID | null;
  monthly_goal_id: ID;
  week_number: WeekNumber;
  start_date: ISODate;
  due_date: ISODate;
  priority: TaskPriority;
  status: Exclude<TaskStatus, "overdue">;
  notes: string;
  created_at: ISODateTime;
  completed_at: ISODateTime | null;
}

export interface TaskComment {
  id: ID;
  task_id: ID;
  author: string;
  body: string;
  created_at: ISODateTime;
}

export type NotificationKind =
  | "deadline_upcoming"
  | "task_overdue"
  | "task_assigned"
  | "weekly_reminder";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  task_id: ID | null;
  read: boolean;
  created_at: ISODateTime;
}

export interface ActivityLog {
  id: ID;
  entity: string;
  entity_id: ID;
  action: string;
  summary: string;
  created_at: ISODateTime;
}

export interface Settings {
  organization_name: string;
  week_starts_on: "monday" | "sunday";
  deadline_reminder_days: number;
  notifications_enabled: boolean;
}

/** Derived status that accounts for overdue due dates. */
export interface TaskWithMeta extends Task {
  derived_status: TaskStatus;
  days_overdue: number;
}

export interface WeekSummary {
  week_number: WeekNumber;
  objective: string;
  start_date: ISODate;
  end_date: ISODate;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_percentage: number;
}

export interface MonthlySummary {
  goal: MonthlyGoal | null;
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_percentage: number;
  weeks: WeekSummary[];
}

export interface TaskFilters {
  search?: string;
  employeeId?: ID | "all";
  week?: WeekNumber | "all";
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  monthlyGoalId?: ID | "all";
}

export type TaskInput = Omit<Task, "id" | "task_code" | "created_at" | "completed_at">;
export type EmployeeInput = Omit<Employee, "id" | "created_at">;
export type MonthlyGoalInput = Omit<MonthlyGoal, "id" | "created_at">;
