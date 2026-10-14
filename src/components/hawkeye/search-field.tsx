"use client";

import { Search } from "lucide-react";

export function SearchField({
  value,
  onChange,
  placeholder = "Cerca",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bezel h-10 w-full rounded-xl border border-border pr-4 pl-10 text-[14px] text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
      />
    </div>
  );
}
