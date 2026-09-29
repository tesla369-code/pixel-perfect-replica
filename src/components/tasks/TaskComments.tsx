import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCommentMutations, useTaskComments } from "@/hooks/useData";
import { formatDate } from "@/lib/task-utils";
import type { ID } from "@/types";

export function TaskComments({ taskId }: { taskId: ID }) {
  const { data: comments = [] } = useTaskComments(taskId);
  const { create, update, remove } = useCommentMutations(taskId);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [editBody, setEditBody] = useState("");

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="mb-3 text-sm font-medium">Comments ({comments.length})</div>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {c.author} · {formatDate(c.created_at)}
              </span>
              <div className="flex gap-2">
                <button
                  aria-label="Edit comment"
                  className="hover:text-foreground"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditBody(c.body);
                  }}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  aria-label="Delete comment"
                  className="hover:text-bad"
                  onClick={() => remove.mutate(c.id, { onSuccess: () => toast.success("Comment deleted") })}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            {editingId === c.id ? (
              <div className="mt-2 space-y-2">
                <Textarea rows={2} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={!editBody.trim()}
                    onClick={() =>
                      update.mutate(
                        { id: c.id, body: editBody.trim() },
                        { onSuccess: () => setEditingId(null) },
                      )
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm">{c.body}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <Textarea rows={2} placeholder="Add a comment…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button
          size="sm"
          variant="subtle"
          disabled={!draft.trim() || create.isPending}
          onClick={() => create.mutate(draft.trim(), { onSuccess: () => setDraft("") })}
        >
          Add comment
        </Button>
      </div>
    </div>
  );
}
