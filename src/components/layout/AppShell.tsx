import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationMutations, useNotifications } from "@/hooks/useData";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/monthly-goals", label: "Monthly Goals", icon: Target },
  { to: "/weekly-planning", label: "Weekly Planning", icon: Gauge },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/overdue", label: "Overdue Tasks", icon: TriangleAlert },
  { to: "/reports", label: "Reports", icon: Gauge },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-0.5 p-3 text-sm">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors",
              active
                ? "bg-accent font-medium text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
      <div className="grid size-8 place-items-center rounded-md bg-gradient-brand font-mono text-sm font-semibold text-primary-foreground">
        Q
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Quorum</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agency OS</div>
      </div>
    </div>
  );
}

function NotificationsBell() {
  const { data: notifications = [] } = useNotifications();
  const { markAllRead, markRead, remove, clearAll } = useNotificationMutations();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-bad font-mono text-[9px] font-semibold text-primary-foreground">
              {unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          <div className="flex gap-3">
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
            <button
              className="text-[11px] text-muted-foreground hover:text-bad"
              onClick={() => clearAll.mutate()}
            >
              Clear all
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="group flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-0 hover:bg-accent"
              >
                <button onClick={() => markRead.mutate(n.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-brand" /> : null}
                    <span className="text-[13px] font-medium">{n.title}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{n.body}</p>
                </button>
                <button
                  aria-label="Delete notification"
                  onClick={() => remove.mutate(n.id)}
                  className="text-muted-foreground hover:text-bad"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children, search }: { children: ReactNode; search?: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const monthText = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <Brand />
          <NavList />
          <div className="mt-auto p-3">
            <div className="rounded-lg border border-border bg-background px-3 py-3">
              <div className="text-xs text-muted-foreground">Admin</div>
              <div className="text-sm font-medium">{user?.name ?? "Administrator"}</div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
                }}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-3" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open navigation"
                  className="grid size-9 place-items-center rounded-md border border-border lg:hidden"
                >
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <NavList onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">{search}</div>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{monthText}</span>
              <NotificationsBell />
              <Button asChild variant="brand" size="sm" className="hidden sm:inline-flex">
                <Link to="/tasks" search={{ new: true }}>
                  New task
                </Link>
              </Button>
            </div>
          </header>

          <main className="min-w-0 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
