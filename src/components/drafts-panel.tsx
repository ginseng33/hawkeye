"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/hawkeye/side-panel";
import { SegmentedToggle } from "@/components/hawkeye/segmented-control";
import { MessageDraftCard } from "./message-draft-card";

type Draft = {
  id: string;
  channel: string;
  variant_label: string | null;
  body: string;
  status: string;
};

export function DraftsPanel({
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
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"email" | "dm">("email");
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
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Genera messaggio {drafts.length > 0 && `(${drafts.length})`}
      </Button>

      <SidePanel
        open={open}
        onOpenChange={setOpen}
        title="Bozze di contatto"
        description="Mai inviate in automatico — copia e invia tu"
      >
        {drafts.length > 0 && (
          <div className="mb-5 flex flex-col gap-3">
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

        <form action={generateAction} className="flex flex-col gap-3">
          <div>
            <p className="font-technical mb-1.5 text-[11px] text-muted-foreground">Canale</p>
            <SegmentedToggle
              options={[
                { label: "Email", value: "email" },
                { label: "DM Instagram", value: "dm" },
              ]}
              value={channel}
              onChange={setChannel}
            />
            <input type="hidden" name="channel" value={channel} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="variant_label" className="font-technical text-[11px] text-muted-foreground">
              Variante (opzionale)
            </label>
            <input
              id="variant_label"
              name="variant_label"
              placeholder="es. diretta, calorosa"
              className="bezel h-9 rounded-xl border border-border px-3 text-sm"
            />
          </div>
          <Button type="submit" className="w-fit">
            Genera
          </Button>
        </form>
      </SidePanel>
    </>
  );
}
