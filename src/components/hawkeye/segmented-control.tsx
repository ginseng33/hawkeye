"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SegmentedItem = { label: string; href: string };

/** Navigation variant: highlights based on the current route. */
export function SegmentedControl({ items }: { items: SegmentedItem[] }) {
  const pathname = usePathname();

  return (
    <div className="font-technical inline-flex items-center gap-0.5 rounded-xl bg-black/30 p-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-lg px-3.5 py-1.5 text-[12px] transition-all " +
              (active
                ? "bezel text-primary border border-border"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Controlled variant: for in-page filters (not navigation). */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="font-technical inline-flex items-center gap-0.5 rounded-xl bg-black/30 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={
            "rounded-lg px-3.5 py-1.5 text-[12px] transition-all " +
            (value === opt.value
              ? "bezel text-primary border border-border"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
