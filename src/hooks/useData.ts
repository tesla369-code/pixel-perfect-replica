import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataService } from "@/services";
import type {
  EmployeeInput,
  ID,
  MonthlyGoalInput,
  Settings,
  TaskFilters,
  TaskInput,
  WeeklyGoal,
} from "@/types";

export const queryKeys = {
  employees: ["employees"] as const,
  employee: (id: ID) => ["employees", id] as const,
  goals: ["monthly-goals"] as const,
  goal: (id: ID) => ["monthly-goals", id] as const,
  weeklyGoals: (id: ID) => ["weekly-goals", id] as const,
  tasks: (filters?: TaskFilters) => ["tasks", filters ?? {}] as const,
  task: (id: ID) => ["tasks", "detail", id] as const,
  comments: (id: ID) => ["task-comments", id] as const,
  summary: (id: ID) => ["monthly-summary", id] as const,
  notifications: ["notifications"] as const,
  activity: ["activity"] as const,
  settings: ["settings"] as const,
};

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["employees"] });
    qc.invalidateQueries({ queryKey: ["monthly-summary"] });
    qc.invalidateQueries({ queryKey: ["monthly-goals"] });
    qc.invalidateQueries({ queryKey: ["weekly-goals"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
  };
}

export const useEmployees = () =>
  useQuery({ queryKey: queryKeys.employees, queryFn: () => dataService.listEmployees() });

export const useMonthlyGoals = () =>
  useQuery({ queryKey: queryKeys.goals, queryFn: () => dataService.listMonthlyGoals() });

export const useWeeklyGoals = (goalId?: ID) =>
  useQuery({
    queryKey: queryKeys.weeklyGoals(goalId ?? "none"),
    queryFn: () => dataService.listWeeklyGoals(goalId!),
    enabled: Boolean(goalId),
  });

export const useTasks = (filters?: TaskFilters) =>
  useQuery({ queryKey: queryKeys.tasks(filters), queryFn: () => dataService.listTasks(filters) });

export const useMonthlySummary = (goalId?: ID) =>
  useQuery({
    queryKey: queryKeys.summary(goalId ?? "none"),
    queryFn: () => dataService.getMonthlySummary(goalId!),
    enabled: Boolean(goalId),
  });

export const useNotifications = () =>
  useQuery({ queryKey: queryKeys.notifications, queryFn: () => dataService.listNotifications() });

export const useActivity = () =>
  useQuery({ queryKey: queryKeys.activity, queryFn: () => dataService.listActivity() });

export const useSettings = () =>
  useQuery({ queryKey: queryKeys.settings, queryFn: () => dataService.getSettings() });

export function useTaskMutations() {
  const invalidate = useInvalidateAll();

  const create = useMutation({
    mutationFn: (input: TaskInput) => dataService.createTask(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<TaskInput> }) => dataService.updateTask(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: ID) => dataService.deleteTask(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useEmployeeMutations() {
  const invalidate = useInvalidateAll();
  return {
    create: useMutation({
      mutationFn: (input: EmployeeInput) => dataService.createEmployee(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: ID; input: Partial<EmployeeInput> }) =>
        dataService.updateEmployee(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: ID) => dataService.deleteEmployee(id),
      onSuccess: invalidate,
    }),
  };
}

export function useGoalMutations() {
  const invalidate = useInvalidateAll();
  return {
    create: useMutation({
      mutationFn: (input: MonthlyGoalInput) => dataService.createMonthlyGoal(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: ID; input: Partial<MonthlyGoalInput> }) =>
        dataService.updateMonthlyGoal(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: ID) => dataService.deleteMonthlyGoal(id),
      onSuccess: invalidate,
    }),
    updateWeek: useMutation({
      mutationFn: ({ id, input }: { id: ID; input: Partial<Omit<WeeklyGoal, "id">> }) =>
        dataService.updateWeeklyGoal(id, input),
      onSuccess: invalidate,
    }),
  };
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: queryKeys.notifications });
  return {
    markRead: useMutation({ mutationFn: (id: ID) => dataService.markNotificationRead(id), onSuccess }),
    markAllRead: useMutation({ mutationFn: () => dataService.markAllNotificationsRead(), onSuccess }),
    remove: useMutation({ mutationFn: (id: ID) => dataService.deleteNotification(id), onSuccess }),
    clearAll: useMutation({ mutationFn: () => dataService.clearNotifications(), onSuccess }),
  };
}

export const useTaskComments = (taskId?: ID) =>
  useQuery({
    queryKey: queryKeys.comments(taskId ?? "none"),
    queryFn: () => dataService.listTaskComments(taskId!),
    enabled: Boolean(taskId),
  });

export function useCommentMutations(taskId?: ID) {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: queryKeys.comments(taskId ?? "none") });
  return {
    create: useMutation({ mutationFn: (body: string) => dataService.addTaskComment(taskId!, body), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: ID; body: string }) => dataService.updateTaskComment(id, body),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: ID) => dataService.deleteTaskComment(id), onSuccess }),
  };
}

export function useSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Settings>) => dataService.updateSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings }),
  });
}
