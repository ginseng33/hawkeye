"use client";

import { useRouter } from "next/navigation";

const PIPELINE_STATUSES = [
  { value: "new", label: "Nuovo" },
  { value: "to_contact", label: "Da contattare" },
  { value: "contacted", label: "Contattato" },
  { value: "replied", label: "Ha risposto" },
  { value: "sample_sent", label: "Campione inviato" },
  { value: "negotiating", label: "In trattativa" },
  { value: "partner", label: "Partner" },
  { value: "rejected", label: "Rifiutato" },
  { value: "not_interested", label: "Non interessato" },
];

export function StatusSelect({
  id,
  currentStatus,
  onChangeStatus,
}: {
  id: string;
  currentStatus: string;
  onChangeStatus: (id: string, status: string) => Promise<void>;
}) {
  const router = useRouter();

  return (
    <select
      value={currentStatus}
      onChange={async (e) => {
        await onChangeStatus(id, e.target.value);
        router.refresh();
      }}
      className="h-7 rounded border bg-transparent px-1.5 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {PIPELINE_STATUSES.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
