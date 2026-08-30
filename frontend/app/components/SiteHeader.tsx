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
    <header className="flex flex-col items-start gap-3 border-b border-border bg-ground px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-10">
      <Link
        href="/"
        className="font-serif text-lg tracking-tight text-text"
      >
        PathFinder
      </Link>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              item.href === active
                ? "font-mono text-[11px] uppercase tracking-[0.14em] text-text"
                : "font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint transition-colors hover:text-text"
            }
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/chat"
          className="rounded-full bg-blaze px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_8px_20px_-8px_rgba(224,136,56,0.5)]"
        >
          Find my path »
        </Link>
      </nav>
    </header>
  );
}
