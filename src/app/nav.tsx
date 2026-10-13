import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b px-8 py-3 text-sm">
      <span className="font-semibold">Hawkeye</span>
      <Link href="/stores" className="text-muted-foreground hover:text-foreground">
        Negozi
      </Link>
      <Link href="/settings" className="text-muted-foreground hover:text-foreground">
        Impostazioni
      </Link>
    </nav>
  );
}
