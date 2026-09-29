import type {
  ActivityLog,
  AppNotification,
  Employee,
  EmployeeInput,
  EmployeeWithStats,
  ID,
  MonthlyGoal,
  MonthlyGoalInput,
  MonthlySummary,
  Settings,
  Task,
  TaskComment,
  TaskFilters,
  TaskInput,
  TaskWithMeta,
  WeeklyGoal,
} from "@/types";

/**
 * The single data-access contract for the whole app.
 * The UI only ever talks to this interface, never to a concrete store.
 * Swap the mock implementation for a Supabase one without touching components.
 */
export interface DataService {
  // employees
  listEmployees(): Promise<EmployeeWithStats[]>;
  getEmployee(id: ID): Promise<EmployeeWithStats | null>;
  createEmployee(input: EmployeeInput): Promise<Employee>;
  updateEmployee(id: ID, input: Partial<EmployeeInput>): Promise<Employee>;
  deleteEmployee(id: ID): Promise<void>;

  // monthly goals + weekly goals
  listMonthlyGoals(): Promise<MonthlyGoal[]>;
  getMonthlyGoal(id: ID): Promise<MonthlyGoal | null>;
  createMonthlyGoal(input: MonthlyGoalInput): Promise<MonthlyGoal>;
  updateMonthlyGoal(id: ID, input: Partial<MonthlyGoalInput>): Promise<MonthlyGoal>;
  deleteMonthlyGoal(id: ID): Promise<void>;
  listWeeklyGoals(monthlyGoalId: ID): Promise<WeeklyGoal[]>;
  updateWeeklyGoal(id: ID, input: Partial<Omit<WeeklyGoal, "id">>): Promise<WeeklyGoal>;

  // tasks
  listTasks(filters?: TaskFilters): Promise<TaskWithMeta[]>;
  getTask(id: ID): Promise<TaskWithMeta | null>;
  createTask(input: TaskInput): Promise<Task>;
  updateTask(id: ID, input: Partial<TaskInput>): Promise<Task>;
  deleteTask(id: ID): Promise<void>;
  listTaskComments(taskId: ID): Promise<TaskComment[]>;
  addTaskComment(taskId: ID, body: string): Promise<TaskComment>;
  updateTaskComment(id: ID, body: string): Promise<TaskComment>;
  deleteTaskComment(id: ID): Promise<void>;

  // aggregates
  getMonthlySummary(monthlyGoalId: ID): Promise<MonthlySummary>;

  // notifications + activity + settings
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: ID): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  deleteNotification(id: ID): Promise<void>;
  clearNotifications(): Promise<void>;
  listActivity(limit?: number): Promise<ActivityLog[]>;
  getSettings(): Promise<Settings>;
  updateSettings(input: Partial<Settings>): Promise<Settings>;
}
