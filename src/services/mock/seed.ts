import type {
  ActivityLog,
  AppNotification,
  Employee,
  MonthlyGoal,
  Settings,
  Task,
  TaskComment,
  TaskPriority,
  WeekNumber,
  WeeklyGoal,
} from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface SeedData {
  employees: Employee[];
  monthlyGoals: MonthlyGoal[];
  weeklyGoals: WeeklyGoal[];
  tasks: Task[];
  comments: TaskComment[];
  notifications: AppNotification[];
  activity: ActivityLog[];
  settings: Settings;
}

const EMPLOYEE_SEED = [
  ["Maya Chen", "Creative Director", "Design"],
  ["Diego Ramos", "Senior Designer", "Design"],
  ["Aisha Okafor", "Content Strategist", "Content"],
  ["Liam Park", "Performance Marketer", "Marketing"],
  ["Sofia Ricci", "Account Manager", "Client Services"],
  ["Noah Feldman", "Frontend Developer", "Engineering"],
  ["Priya Nair", "Motion Designer", "Design"],
  ["Tomas Bauer", "Data Analyst", "Analytics"],
] as const;

const TASK_TITLES = [
  "Draft Q4 social content calendar",
  "Wireframe the pricing page",
  "Homepage hero copy pass",
  "Build campaign tracking sheet",
  "Finalize lookbook photography",
  "Approve case study layout",
  "Sign-off on email sequence",
  "Client onboarding flow update",
  "Brand refresh deck",
  "Paid search keyword audit",
  "Motion pass on product reel",
  "Monthly analytics readout",
  "Competitor landscape scan",
  "Landing page QA sweep",
  "Newsletter template rebuild",
  "Retainer scope review",
  "Ad creative variations batch",
  "Site speed optimisation pass",
  "Customer interview synthesis",
  "Quarterly roadmap workshop",
  "Social asset resizing",
  "SEO content brief set",
  "Design system audit",
  "Pitch deck refresh",
];

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/** Builds deterministic-but-realistic demo data anchored to the current month. */
export function buildSeed(today = new Date()): SeedData {
  const employees: Employee[] = EMPLOYEE_SEED.map(([name, designation, department], i) => ({
    id: `emp-${i + 1}`,
    employee_code: `EMP-${pad(i + 1)}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@agency.com`,
    avatar_url: null,
    designation,
    department,
    is_active: i !== 7,
    created_at: new Date(today.getFullYear(), 0, 5 + i).toISOString(),
  }));

  const current = new Date(today.getFullYear(), today.getMonth(), 1);
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const makeGoal = (base: Date, index: number, status: MonthlyGoal["status"]): MonthlyGoal => ({
    id: `goal-${index}`,
    month: monthKey(base),
    title:
      index === 1
        ? `${monthLabel(base).split(" ")[0]} delivery target`
        : `${monthLabel(base).split(" ")[0]} retainer push`,
    description:
      index === 1
        ? "Ship every client deliverable on schedule while lifting team utilisation above 85%."
        : "Close out retainer commitments and prepare the next quarter's creative pipeline.",
    target: index === 1 ? "Complete 100% of committed client deliverables" : "Clear all open retainer work",
    start_date: iso(new Date(base.getFullYear(), base.getMonth(), 1)),
    end_date: iso(new Date(base.getFullYear(), base.getMonth() + 1, 0)),
    status,
    created_at: new Date(base.getFullYear(), base.getMonth(), 1).toISOString(),
  });

  const monthlyGoals: MonthlyGoal[] = [makeGoal(current, 1, "active"), makeGoal(previous, 2, "completed")];

  const weeklyObjectives: Record<WeekNumber, string> = {
    1: "Kick off briefs and lock scope with every client",
    2: "Production sprint — first drafts out for review",
    3: "Revisions, QA and internal sign-off",
    4: "Ship, report and prep next month's pipeline",
  };

  const weeklyGoals: WeeklyGoal[] = [];
  for (const goal of monthlyGoals) {
    const [y, m] = goal.month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    ([1, 2, 3, 4] as WeekNumber[]).forEach((week) => {
      const start = (week - 1) * 7 + 1;
      const end = week === 4 ? lastDay : week * 7;
      weeklyGoals.push({
        id: `${goal.id}-w${week}`,
        monthly_goal_id: goal.id,
        week_number: week,
        objective: weeklyObjectives[week],
        start_date: `${goal.month}-${pad(start)}`,
        end_date: `${goal.month}-${pad(end)}`,
      });
    });
  }

  const tasks: Task[] = [];
  let counter = 0;
  const currentWeek = Math.min(4, Math.ceil(today.getDate() / 7)) as WeekNumber;

  for (const goal of monthlyGoals) {
    const isCurrent = goal.id === "goal-1";
    const [y, m] = goal.month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();

    ([1, 2, 3, 4] as WeekNumber[]).forEach((week) => {
      const perWeek = isCurrent ? 8 : 6;
      for (let i = 0; i < perWeek; i++) {
        counter += 1;
        const employee = employees[(counter + week) % employees.length];
        const startDay = Math.min(lastDay, (week - 1) * 7 + 1 + (i % 3));
        const dueDay = Math.min(lastDay, (week - 1) * 7 + 4 + (i % 4));
        const createdAt = new Date(y, m - 1, Math.max(1, startDay - 2)).toISOString();

        let status: Task["status"];
        if (!isCurrent) {
          status = i === 0 && week === 4 ? "todo" : "completed";
        } else if (week < currentWeek) {
          status = i % 7 === 0 ? "in_progress" : "completed";
        } else if (week === currentWeek) {
          status = i % 3 === 0 ? "completed" : i % 3 === 1 ? "in_progress" : "todo";
        } else {
          status = "todo";
        }

        tasks.push({
          id: `task-${counter}`,
          task_code: `TSK-${pad(counter)}`,
          title: TASK_TITLES[counter % TASK_TITLES.length],
          description:
            "Coordinate with the account lead, deliver the asset in the shared drive and flag blockers early.",
          employee_id: employee.id,
          monthly_goal_id: goal.id,
          week_number: week,
          start_date: `${goal.month}-${pad(Math.max(1, startDay))}`,
          due_date: `${goal.month}-${pad(Math.max(1, dueDay))}`,
          priority: PRIORITIES[counter % PRIORITIES.length],
          status,
          notes: i % 4 === 0 ? "Client asked for an extra round of revisions." : "",
          created_at: createdAt,
          completed_at:
            status === "completed" ? new Date(y, (m ?? 1) - 1, Math.min(lastDay, dueDay)).toISOString() : null,
        });
      }
    });
  }

  const comments: TaskComment[] = tasks.slice(0, 6).map((t, i) => ({
    id: `comment-${i + 1}`,
    task_id: t.id,
    author: "Dana Reyes",
    body: i % 2 === 0 ? "Please prioritise this before Thursday's review." : "Draft looks good — one more pass on tone.",
    created_at: t.created_at,
  }));

  const overdue = tasks.filter(
    (t) => t.monthly_goal_id === "goal-1" && t.status !== "completed" && new Date(t.due_date) < today,
  );

  const notifications: AppNotification[] = [
    ...overdue.slice(0, 3).map((t, i) => ({
      id: `notif-od-${i + 1}`,
      kind: "task_overdue" as const,
      title: "Task is overdue",
      body: `${t.title} passed its due date (${t.due_date}).`,
      task_id: t.id,
      read: false,
      created_at: new Date(today.getTime() - (i + 1) * 3600_000).toISOString(),
    })),
    {
      id: "notif-week",
      kind: "weekly_reminder",
      title: `Week ${currentWeek} closes soon`,
      body: "Review open items before the weekly checkpoint.",
      task_id: null,
      read: false,
      created_at: new Date(today.getTime() - 5 * 3600_000).toISOString(),
    },
    {
      id: "notif-deadline",
      kind: "deadline_upcoming",
      title: "3 deadlines in the next 48 hours",
      body: "Check the calendar for items due this week.",
      task_id: null,
      read: true,
      created_at: new Date(today.getTime() - 26 * 3600_000).toISOString(),
    },
  ];

  const activity: ActivityLog[] = tasks.slice(0, 8).map((t, i) => ({
    id: `log-${i + 1}`,
    entity: "tasks",
    entity_id: t.id,
    action: i % 2 === 0 ? "created" : "status_changed",
    summary: i % 2 === 0 ? `Task "${t.title}" created` : `Task "${t.title}" moved to ${t.status}`,
    created_at: new Date(today.getTime() - (i + 1) * 7200_000).toISOString(),
  }));

  const settings: Settings = {
    organization_name: "Quorum Agency",
    week_starts_on: "monday",
    deadline_reminder_days: 2,
    notifications_enabled: true,
  };

  return { employees, monthlyGoals, weeklyGoals, tasks, comments, notifications, activity, settings };
}
