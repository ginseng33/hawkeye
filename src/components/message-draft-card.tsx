"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Draft = {
  id: string;
  channel: string;
  variant_label: string | null;
  body: string;
  status: string;
};

export function MessageDraftCard({
  draft,
  onMarkSent,
  onDelete,
}: {
  draft: Draft;
  onMarkSent: (draftId: string) => void;
  onDelete: (draftId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(draft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {draft.channel === "email" ? "Email" : "DM"} · {draft.variant_label ?? "default"} ·{" "}
          {draft.status === "sent" ? "Inviato" : "Bozza"}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-wrap text-sm">{draft.body}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? "Copiato!" : "Copia"}
        </Button>
        {draft.status !== "sent" && (
          <Button type="button" variant="outline" size="sm" onClick={() => onMarkSent(draft.id)}>
            Segna come inviato
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(draft.id)}>
          Elimina
        </Button>
      </div>
    </div>
  );
}
