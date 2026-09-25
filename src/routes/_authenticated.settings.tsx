import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, LoadingRows } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, useSettingsMutation } from "@/hooks/useData";
import type { Settings } from "@/types";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Quorum Agency OS" },
      { name: "description", content: "Organization name, week start and reminder preferences." },
      { property: "og:title", content: "Settings — Quorum Agency OS" },
      { property: "og:description", content: "Configure your agency workspace." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSettingsMutation();
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) return <LoadingRows rows={4} />;

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Settings" description="Workspace preferences for your agency." />
      <form
        className="panel space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.organization_name.trim()) { toast.error("Organization name is required"); return; }
          save.mutate(form, { onSuccess: () => toast.success("Settings saved") });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="org">Organization name</Label>
          <Input id="org" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Week starts on</Label>
          <Select value={form.week_starts_on} onValueChange={(v) => setForm({ ...form, week_starts_on: v as Settings["week_starts_on"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="days">Deadline reminder (days before)</Label>
          <Input
            id="days"
            type="number"
            min={0}
            max={14}
            value={form.deadline_reminder_days}
            onChange={(e) => setForm({ ...form, deadline_reminder_days: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="notif">Notifications enabled</Label>
          <Switch id="notif" checked={form.notifications_enabled} onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })} />
        </div>
        <Button type="submit" variant="brand" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
