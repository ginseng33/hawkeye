"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Store, Users, Kanban, LayoutDashboard, Settings, Search } from "lucide-react";

const NAV_ITEMS = [
  { label: "Negozi", href: "/stores", icon: Store },
  { label: "Influencer", href: "/creators", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Impostazioni", href: "/settings", icon: Settings },
  { label: "Scopri nuovi negozi", href: "/stores/discover", icon: Search },
];

export const COMMAND_PALETTE_OPEN_EVENT = "hawkeye:open-command-palette";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Cerca" description="Naviga in Hawkeye">
      <CommandInput placeholder="Cerca pagine, negozi, influencer…" />
      <CommandList>
        <CommandEmpty>Nessun risultato.</CommandEmpty>
        <CommandGroup heading="Vai a">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function openCommandPalette() {
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
}
