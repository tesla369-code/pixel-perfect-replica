import type { DataService } from "@/services/types";
import { buildSeed, type SeedData } from "@/services/mock/seed";
import type {
  ActivityLog,
  AppNotification,
  Employee,
  EmployeeInput,
  EmployeeStats,
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
  WeekNumber,
  WeeklyGoal,
} from "@/types";

const STORAGE_KEY = "quorum.mock.v1";
const LATENCY = 180;

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function decorateTask(task: Task, today = startOfToday()): TaskWithMeta {
  const due = new Date(`${task.due_date}T00:00:00`);
  const isOverdue = task.status !== "completed" && due < today;
  const daysOverdue = isOverdue ? Math.floor((today.getTime() - due.getTime()) / 86_400_000) : 0;
  return {
    ...task,
    derived_status: isOverdue ? "overdue" : task.status,
    days_overdue: daysOverdue,
  };
}

function computeStats(tasks: TaskWithMeta[]): EmployeeStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.derived_status === "completed").length;
  const overdue = tasks.filter((t) => t.derived_status === "overdue").length;
  const pending = total - completed - overdue;
  return {
    total,
    completed,
    pending,
    overdue,
    completion_percentage: total ? Math.round((completed / total) * 100) : 0,
  };
}

class MockDataService implements DataService {
  private db: SeedData;

  constructor() {
    this.db = buildSeed();
    this.hydrate();
  }

  private hydrate() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) this.db = JSON.parse(raw) as SeedData;
    } catch {
      /* ignore corrupted cache, fall back to seed */
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      /* storage full or unavailable — in-memory state still works */
    }
  }

  private log(entity: string, entityId: ID, action: string, summary: string) {
    const entry: ActivityLog = {
      id: uid("log"),
      entity,
      entity_id: entityId,
      action,
      summary,
      created_at: new Date().toISOString(),
    };
    this.db.activity = [entry, ...this.db.activity].slice(0, 100);
  }

  private notify(notification: Omit<AppNotification, "id" | "created_at" | "read">) {
    this.db.notifications = [
      { ...notification, id: uid("notif"), read: false, created_at: new Date().toISOString() },
      ...this.db.notifications,
    ].slice(0, 50);
  }

  // ---------- employees ----------
  async listEmployees(): Promise<EmployeeWithStats[]> {
    const all = this.db.tasks.map((t) => decorateTask(t));
    return delay(
      this.db.employees.map((e) => ({
        ...e,
        stats: computeStats(all.filter((t) => t.employee_id === e.id)),
      })),
    );
  }

  async getEmployee(id: ID) {
    const list = await this.listEmployees();
    return list.find((e) => e.id === id) ?? null;
  }

  async createEmployee(input: EmployeeInput): Promise<Employee> {
    const employee: Employee = {
      ...input,
      id: uid("emp"),
      created_at: new Date().toISOString(),
    };
    this.db.employees = [...this.db.employees, employee];
    this.log("employees", employee.id, "created", `Employee ${employee.name} added`);
    this.persist();
    return delay(employee);
  }

  async updateEmployee(id: ID, input: Partial<EmployeeInput>): Promise<Employee> {
    const next = this.db.employees.map((e) => (e.id === id ? { ...e, ...input } : e));
    this.db.employees = next;
    const employee = next.find((e) => e.id === id)!;
    this.log("employees", id, "updated", `Employee ${employee.name} updated`);
    this.persist();
    return delay(employee);
  }

  async deleteEmployee(id: ID): Promise<void> {
    this.db.employees = this.db.employees.filter((e) => e.id !== id);
    this.db.tasks = this.db.tasks.map((t) => (t.employee_id === id ? { ...t, employee_id: null } : t));
    this.log("employees", id, "deleted", "Employee removed");
    this.persist();
    return delay(undefined);
  }

  // ---------- monthly goals ----------
  async listMonthlyGoals(): Promise<MonthlyGoal[]> {
    return delay([...this.db.monthlyGoals].sort((a, b) => b.month.localeCompare(a.month)));
  }

  async getMonthlyGoal(id: ID) {
    return delay(this.db.monthlyGoals.find((g) => g.id === id) ?? null);
  }

  async createMonthlyGoal(input: MonthlyGoalInput): Promise<MonthlyGoal> {
    const goal: MonthlyGoal = { ...input, id: uid("goal"), created_at: new Date().toISOString() };
    this.db.monthlyGoals = [...this.db.monthlyGoals, goal];

    const [y, m] = goal.month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    const weeks: WeeklyGoal[] = ([1, 2, 3, 4] as WeekNumber[]).map((week) => ({
      id: `${goal.id}-w${week}`,
      monthly_goal_id: goal.id,
      week_number: week,
      objective: "",
      start_date: `${goal.month}-${pad((week - 1) * 7 + 1)}`,
      end_date: `${goal.month}-${pad(week === 4 ? lastDay : week * 7)}`,
    }));
    this.db.weeklyGoals = [...this.db.weeklyGoals, ...weeks];
    this.log("monthly_goals", goal.id, "created", `Monthly goal "${goal.title}" created`);
    this.persist();
    return delay(goal);
  }

  async updateMonthlyGoal(id: ID, input: Partial<MonthlyGoalInput>): Promise<MonthlyGoal> {
    this.db.monthlyGoals = this.db.monthlyGoals.map((g) => (g.id === id ? { ...g, ...input } : g));
    const goal = this.db.monthlyGoals.find((g) => g.id === id)!;
    this.log("monthly_goals", id, "updated", `Monthly goal "${goal.title}" updated`);
    this.persist();
    return delay(goal);
  }

  async deleteMonthlyGoal(id: ID): Promise<void> {
    this.db.monthlyGoals = this.db.monthlyGoals.filter((g) => g.id !== id);
    this.db.weeklyGoals = this.db.weeklyGoals.filter((w) => w.monthly_goal_id !== id);
    this.db.tasks = this.db.tasks.filter((t) => t.monthly_goal_id !== id);
    this.log("monthly_goals", id, "deleted", "Monthly goal removed");
    this.persist();
    return delay(undefined);
  }

  async listWeeklyGoals(monthlyGoalId: ID): Promise<WeeklyGoal[]> {
    return delay(
      this.db.weeklyGoals
        .filter((w) => w.monthly_goal_id === monthlyGoalId)
        .sort((a, b) => a.week_number - b.week_number),
    );
  }

  async updateWeeklyGoal(id: ID, input: Partial<Omit<WeeklyGoal, "id">>): Promise<WeeklyGoal> {
    this.db.weeklyGoals = this.db.weeklyGoals.map((w) => (w.id === id ? { ...w, ...input } : w));
    this.persist();
    return delay(this.db.weeklyGoals.find((w) => w.id === id)!);
  }

  // ---------- tasks ----------
  async listTasks(filters: TaskFilters = {}): Promise<TaskWithMeta[]> {
    const today = startOfToday();
    let rows = this.db.tasks.map((t) => decorateTask(t, today));

    if (filters.monthlyGoalId && filters.monthlyGoalId !== "all") {
      rows = rows.filter((t) => t.monthly_goal_id === filters.monthlyGoalId);
    }
    if (filters.employeeId && filters.employeeId !== "all") {
      rows = rows.filter((t) => t.employee_id === filters.employeeId);
    }
    if (filters.week && filters.week !== "all") {
      rows = rows.filter((t) => t.week_number === filters.week);
    }
    if (filters.status && filters.status !== "all") {
      rows = rows.filter((t) => t.derived_status === filters.status);
    }
    if (filters.priority && filters.priority !== "all") {
      rows = rows.filter((t) => t.priority === filters.priority);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.task_code.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return delay(rows.sort((a, b) => a.due_date.localeCompare(b.due_date)));
  }

  async getTask(id: ID) {
    const found = this.db.tasks.find((t) => t.id === id);
    return delay(found ? decorateTask(found) : null);
  }

  async createTask(input: TaskInput): Promise<Task> {
    const task: Task = {
      ...input,
      id: uid("task"),
      task_code: `TSK-${String(this.db.tasks.length + 1).padStart(2, "0")}`,
      created_at: new Date().toISOString(),
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
    };
    this.db.tasks = [...this.db.tasks, task];
    this.log("tasks", task.id, "created", `Task "${task.title}" created`);
    this.notify({
      kind: "task_assigned",
      title: "New task assigned",
      body: `${task.title} · due ${task.due_date}`,
      task_id: task.id,
    });
    this.persist();
    return delay(task);
  }

  async updateTask(id: ID, input: Partial<TaskInput>): Promise<Task> {
    this.db.tasks = this.db.tasks.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, ...input };
      if (input.status) {
        next.completed_at = input.status === "completed" ? (t.completed_at ?? new Date().toISOString()) : null;
      }
      return next;
    });
    const task = this.db.tasks.find((t) => t.id === id)!;
    this.log("tasks", id, "updated", `Task "${task.title}" updated`);
    this.persist();
    return delay(task);
  }

  async deleteTask(id: ID): Promise<void> {
    this.db.tasks = this.db.tasks.filter((t) => t.id !== id);
    this.db.comments = this.db.comments.filter((c) => c.task_id !== id);
    this.log("tasks", id, "deleted", "Task removed");
    this.persist();
    return delay(undefined);
  }

  async listTaskComments(taskId: ID): Promise<TaskComment[]> {
    return delay(this.db.comments.filter((c) => c.task_id === taskId));
  }

  async addTaskComment(taskId: ID, body: string): Promise<TaskComment> {
    const comment: TaskComment = {
      id: uid("comment"),
      task_id: taskId,
      author: "Admin",
      body,
      created_at: new Date().toISOString(),
    };
    this.db.comments = [...this.db.comments, comment];
    this.persist();
    return delay(comment);
  }

  // ---------- aggregates ----------
  async getMonthlySummary(monthlyGoalId: ID): Promise<MonthlySummary> {
    const goal = this.db.monthlyGoals.find((g) => g.id === monthlyGoalId) ?? null;
    const rows = this.db.tasks.filter((t) => t.monthly_goal_id === monthlyGoalId).map((t) => decorateTask(t));
    const weeklyGoals = this.db.weeklyGoals.filter((w) => w.monthly_goal_id === monthlyGoalId);

    const weeks = ([1, 2, 3, 4] as WeekNumber[]).map((week) => {
      const weekTasks = rows.filter((t) => t.week_number === week);
      const wg = weeklyGoals.find((w) => w.week_number === week);
      const stats = computeStats(weekTasks);
      return {
        week_number: week,
        objective: wg?.objective ?? "",
        start_date: wg?.start_date ?? "",
        end_date: wg?.end_date ?? "",
        total: stats.total,
        completed: stats.completed,
        pending: stats.pending,
        overdue: stats.overdue,
        completion_percentage: stats.completion_percentage,
      };
    });

    const stats = computeStats(rows);
    return delay({
      goal,
      total: stats.total,
      completed: stats.completed,
      in_progress: rows.filter((t) => t.derived_status === "in_progress").length,
      pending: rows.filter((t) => t.derived_status === "todo").length,
      overdue: stats.overdue,
      completion_percentage: stats.completion_percentage,
      weeks,
    });
  }

  // ---------- notifications / activity / settings ----------
  async listNotifications(): Promise<AppNotification[]> {
    return delay([...this.db.notifications]);
  }

  async markNotificationRead(id: ID): Promise<void> {
    this.db.notifications = this.db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.persist();
    return delay(undefined);
  }

  async markAllNotificationsRead(): Promise<void> {
    this.db.notifications = this.db.notifications.map((n) => ({ ...n, read: true }));
    this.persist();
    return delay(undefined);
  }

  async listActivity(limit = 12): Promise<ActivityLog[]> {
    return delay(this.db.activity.slice(0, limit));
  }

  async getSettings(): Promise<Settings> {
    return delay({ ...this.db.settings });
  }

  async updateSettings(input: Partial<Settings>): Promise<Settings> {
    this.db.settings = { ...this.db.settings, ...input };
    this.persist();
    return delay({ ...this.db.settings });
  }
}

export const mockDataService: DataService = new MockDataService();
