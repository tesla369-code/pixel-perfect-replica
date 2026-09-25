import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader, EmptyState, LoadingRows } from "@/components/common/States";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmployeeMutations, useEmployees } from "@/hooks/useData";
import { initials } from "@/lib/task-utils";
import type { EmployeeWithStats } from "@/types";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Quorum Agency OS" },
      {
        name: "description",
        content: "Manage the eight-person agency roster with workload, completion rates and overdue counts.",
      },
      { property: "og:title", content: "Employees — Quorum Agency OS" },
      { property: "og:description", content: "Team roster with workload and completion rates." },
    ],
  }),
  component: EmployeesPage,
});

const schema = z.object({
  employee_code: z.string().min(2, "Employee ID is required"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().min(2, "Department is required"),
  is_active: z.boolean(),
});
type FormValues = z.input<typeof schema>;

function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const { create, update, remove } = useEmployeeMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeWithStats | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EmployeeWithStats | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_code: "",
      name: "",
      email: "",
      designation: "",
      department: "",
      is_active: true,
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      employee_code: `EMP-${String(employees.length + 1).padStart(2, "0")}`,
      name: "",
      email: "",
      designation: "",
      department: "",
      is_active: true,
    });
    setOpen(true);
  }

  function openEdit(employee: EmployeeWithStats) {
    setEditing(employee);
    form.reset({
      employee_code: employee.employee_code,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      department: employee.department,
      is_active: employee.is_active,
    });
    setOpen(true);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, avatar_url: editing?.avatar_url ?? null };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: payload });
        toast.success("Employee updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Employee added");
      }
      setOpen(false);
    } catch {
      toast.error("Could not save the employee");
    }
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        description="Eight teammates, their workload and how much of it is finished."
        actions={
          <Button variant="brand" onClick={openCreate}>
            Add employee
          </Button>
        }
      />

      {isLoading ? (
        <LoadingRows rows={4} />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Add your first teammate to assign tasks." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((e) => (
            <div key={e.id} className="panel p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs text-muted-foreground">
                  {initials(e.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">{e.name}</h2>
                    <span
                      className={
                        e.is_active
                          ? "rounded bg-good/15 px-1.5 py-0.5 text-[10px] font-medium text-good"
                          : "rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      }
                    >
                      {e.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.designation} · {e.department}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{e.employee_code}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <Metric label="Total" value={e.stats.total} />
                <Metric label="Done" value={e.stats.completed} tone="text-good" />
                <Metric label="Pending" value={e.stats.pending} tone="text-warn" />
                <Metric label="Late" value={e.stats.overdue} tone="text-bad" />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-mono">{e.stats.completion_percentage}%</span>
                </div>
                <ProgressBar className="mt-1.5" value={e.stats.completion_percentage} />
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="subtle" onClick={() => openEdit(e)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => update.mutate({ id: e.id, input: { is_active: !e.is_active } })}
                >
                  {e.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingDelete(e)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>Employees do not sign in — this is roster data only.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID" error={form.formState.errors.employee_code?.message}>
                <Input {...form.register("employee_code")} />
              </Field>
              <Field label="Full name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register("email")} />
              </Field>
              <Field label="Designation" error={form.formState.errors.designation?.message}>
                <Input {...form.register("designation")} />
              </Field>
              <Field label="Department" error={form.formState.errors.department?.message}>
                <Input {...form.register("department")} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive teammates keep their history.</p>
              </div>
              <Switch
                id="is_active"
                checked={form.watch("is_active")}
                onCheckedChange={(v) => form.setValue("is_active", v)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand">
                {editing ? "Save changes" : "Add employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Remove this employee?"
        description="Their tasks stay in the system but become unassigned."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove.mutateAsync(pendingDelete.id);
          setPendingDelete(null);
          toast.success("Employee removed");
        }}
      />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-md border border-border py-1.5">
      <div className={`font-mono text-sm font-semibold ${tone ?? ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-bad">{error}</p> : null}
    </div>
  );
}
