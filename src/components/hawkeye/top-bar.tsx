"use client";

import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { SegmentedControl } from "./segmented-control";
import { openCommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { label: "Negozi", href: "/stores" },
  { label: "Influencer", href: "/creators" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Dashboard", href: "/dashboard" },
];

export function TopBar({ userInitial = "G" }: { userInitial?: string }) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Link href="/stores" className="font-technical text-[14px] text-foreground">
          HAWKEYE
        </Link>

        <SegmentedControl items={NAV_ITEMS} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className="bezel font-technical flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3.5" />
            Cerca
            <kbd className="ml-1 rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          <Link
            href="/settings"
            className="bezel flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
          <ThemeToggle />
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary-tint text-[13px] font-bold text-primary">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
