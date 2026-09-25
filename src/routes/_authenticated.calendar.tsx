import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import type { TaskWithMeta } from "@/types";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Quorum Agency OS" },
      { name: "description", content: "See every task deadline on a monthly calendar." },
      { property: "og:title", content: "Calendar — Quorum Agency OS" },
      { property: "og:description", content: "Monthly calendar of task due dates." },
    ],
  }),
  component: CalendarPage,
});

const tone: Record<string, string> = {
  completed: "border-good/40 text-good",
  overdue: "border-bad/50 text-bad",
  in_progress: "border-brand/50 text-brand",
  todo: "border-border text-muted-foreground",
};

function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { data: tasks = [] } = useTasks();
  const [selected, setSelected] = useState<TaskWithMeta | null>(null);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, TaskWithMeta[]>();
    tasks.forEach((t) => m.set(t.due_date, [...(m.get(t.due_date) ?? []), t]));
    return m;
  }, [tasks]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        description="Task deadlines by day. Red = overdue, green = completed."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-36 text-center font-mono text-sm">{format(month, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />
      <div className="panel overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-7">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-b border-border px-2 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const list = byDay.get(format(day, "yyyy-MM-dd")) ?? [];
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-28 border-b border-r border-border p-1.5",
                  !isSameMonth(day, month) && "opacity-40",
                )}
              >
                <div className={cn("mb-1 font-mono text-xs", isToday(day) && "text-gradient-brand font-semibold")}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {list.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={cn("block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px]", tone[t.derived_status])}
                    >
                      {t.title}
                    </button>
                  ))}
                  {list.length > 3 ? <div className="text-[10px] text-muted-foreground">+{list.length - 3} more</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selected ? (
        <div className="panel p-4 text-sm">
          <div className="font-medium">{selected.title}</div>
          <p className="mt-1 text-muted-foreground">{selected.description}</p>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            {selected.task_code} · due {selected.due_date} · {selected.priority} · {selected.derived_status}
          </div>
        </div>
      ) : null}
    </div>
  );
}
