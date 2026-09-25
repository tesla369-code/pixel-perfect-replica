import { useMemo } from "react";
import { useMonthlyGoals } from "@/hooks/useData";
import type { MonthlyGoal } from "@/types";

/** Resolves the goal for the current month, falling back to the newest goal. */
export function useCurrentGoal(preferredId?: string) {
  const { data: goals = [], isLoading } = useMonthlyGoals();

  const goal = useMemo<MonthlyGoal | null>(() => {
    if (!goals.length) return null;
    if (preferredId) {
      const match = goals.find((g) => g.id === preferredId);
      if (match) return match;
    }
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return goals.find((g) => g.month === key) ?? goals[0] ?? null;
  }, [goals, preferredId]);

  return { goal, goals, isLoading };
}
