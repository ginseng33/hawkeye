export function FormGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      {title && <p className="font-technical mb-2 px-1 text-[11px] text-muted-foreground">{title}</p>}
      <div className="overflow-hidden rounded-[20px] border border-border bg-card">{children}</div>
    </div>
  );
}

export function FormRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border px-4 py-2.5 last:border-b-0">
      <span className="shrink-0 text-[14px] text-foreground">{label}</span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}
