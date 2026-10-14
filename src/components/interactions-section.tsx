const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  dm: "DM",
  phone: "Telefono",
  visit: "Visita",
  other: "Altro",
};

const TYPE_LABEL: Record<string, string> = {
  first_contact: "Primo contatto",
  follow_up: "Follow-up",
  reply: "Risposta",
  call: "Call",
  sample_sent: "Campione inviato",
  agreement: "Accordo",
  garment_sent: "Capo inviato",
  content_published: "Contenuto pubblicato",
};

type Interaction = {
  id: string;
  occurred_at: string;
  channel: string;
  interaction_type: string;
  notes: string | null;
};

export function InteractionsSection({
  interactions,
  logAction,
}: {
  interactions: Interaction[];
  logAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Storico interazioni</h2>

      {interactions.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {interactions.map((i) => (
            <div key={i.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {TYPE_LABEL[i.interaction_type] ?? i.interaction_type} · {CHANNEL_LABEL[i.channel] ?? i.channel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(i.occurred_at).toLocaleDateString("it-IT")}
                </span>
              </div>
              {i.notes && <p className="mt-1 text-muted-foreground">{i.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <form action={logAction} className="flex flex-col gap-3 rounded border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="channel" className="text-xs font-medium text-muted-foreground">
              Canale
            </label>
            <select
              id="channel"
              name="channel"
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {Object.entries(CHANNEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="interaction_type" className="text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <select
              id="interaction_type"
              name="interaction_type"
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
            Note (opzionale)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-9 w-fit rounded-md border bg-secondary px-4 text-sm font-medium hover:bg-secondary/80"
        >
          Registra interazione
        </button>
      </form>
    </div>
  );
}
