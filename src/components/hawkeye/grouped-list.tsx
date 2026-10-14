import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function GroupedList({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {title && <p className="font-technical mb-2 px-1 text-[11px] text-muted-foreground">{title}</p>}
      <div className="overflow-hidden rounded-[20px] border border-border bg-card">{children}</div>
    </div>
  );
}

export function ListRow({
  href,
  avatar,
  title,
  subtitle,
  trailing,
  showChevron = true,
}: {
  href?: string;
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
}) {
  const content = (
    <div className="flex h-16 items-center gap-3 border-b border-border px-4 last:border-b-0 hover:bg-muted">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-foreground">{title}</p>
        {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing}
      {href && showChevron && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
