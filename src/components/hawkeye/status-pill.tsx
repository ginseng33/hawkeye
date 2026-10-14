export type PipelineStatus =
  | "new"
  | "to_contact"
  | "contacted"
  | "replied"
  | "sample_sent"
  | "negotiating"
  | "partner"
  | "rejected"
  | "not_interested";

const STATUS_LABEL: Record<PipelineStatus, string> = {
  new: "Nuovo",
  to_contact: "Da contattare",
  contacted: "Contattato",
  replied: "Ha risposto",
  sample_sent: "Campione inviato",
  negotiating: "In trattativa",
  partner: "Partner",
  rejected: "Rifiutato",
  not_interested: "Non interessato",
};

const STATUS_TONE: Record<PipelineStatus, "neutral" | "warning" | "success" | "destructive"> = {
  new: "neutral",
  to_contact: "neutral",
  contacted: "warning",
  replied: "warning",
  sample_sent: "warning",
  negotiating: "warning",
  partner: "success",
  rejected: "destructive",
  not_interested: "destructive",
};

const TONE_CLASSES = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-tint text-warning",
  success: "bg-success-tint text-success",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatusPill({ status }: { status: string }) {
  const key = (status in STATUS_LABEL ? status : "new") as PipelineStatus;
  const tone = STATUS_TONE[key];

  return (
    <span
      className={`font-technical inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] ${TONE_CLASSES[tone]}`}
    >
      {STATUS_LABEL[key]}
    </span>
  );
}
