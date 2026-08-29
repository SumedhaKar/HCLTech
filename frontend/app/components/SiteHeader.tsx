import Link from "next/link";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/profile", label: "Profile" },
] as const;

export default function SiteHeader({
  active,
}: {
  active?: (typeof NAV_ITEMS)[number]["href"];
}) {
  return (
    <header className="flex flex-col items-start gap-3 border-b border-signage-line bg-signage px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-10">
      <Link
        href="/"
        className="font-serif text-lg tracking-tight text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.4)]"
      >
        PathFinder
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              item.href === active
                ? "font-mono text-[11px] uppercase tracking-[0.14em] text-blaze-deep"
                : "font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
