"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageDraftCard } from "./message-draft-card";

type Draft = {
  id: string;
  channel: string;
  variant_label: string | null;
  body: string;
  status: string;
};

export function DraftsSection({
  drafts,
  generateAction,
  markSentAction,
  deleteAction,
}: {
  drafts: Draft[];
  generateAction: (formData: FormData) => Promise<void>;
  markSentAction: (draftId: string) => Promise<void>;
  deleteAction: (draftId: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleMarkSent(draftId: string) {
    await markSentAction(draftId);
    router.refresh();
  }

  async function handleDelete(draftId: string) {
    await deleteAction(draftId);
    router.refresh();
  }

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Bozze di contatto</h2>

      {drafts.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          {drafts.map((draft) => (
            <MessageDraftCard
              key={draft.id}
              draft={draft}
              onMarkSent={handleMarkSent}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <form action={generateAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="channel" className="text-xs font-medium text-muted-foreground">
            Canale
          </label>
          <select id="channel" name="channel" className="h-9 rounded-md border bg-transparent px-3 text-sm">
            <option value="email">Email</option>
            <option value="dm">DM Instagram</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="variant_label" className="text-xs font-medium text-muted-foreground">
            Variante (opzionale)
          </label>
          <input
            id="variant_label"
            name="variant_label"
            placeholder="es. diretta, calorosa"
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm">
          Genera messaggio
        </Button>
      </form>
    </div>
  );
}
