"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardNavItem = {
  href: string;
  label: string;
  badge?: number;
};

/**
 * Navigatie in het dashboard. Vanaf sm: een vaste zijbalk zoals voorheen;
 * daaronder (telefoon) een hamburgermenu rechtsboven, want met meerdere
 * onderdelen (Overzicht, Beschikbaarheid, Rooster, Uren, Agenda-koppeling,
 * Meldingen, Instellingen, Mijn account, eventueel Adminportaal) paste de
 * rij niet meer op één telefoonscherm.
 */
export default function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <>
      {/* Mobiel: hamburgermenu, rechts uitgelijnd */}
      <div className="sm:hidden">
        <div className="flex justify-end px-4 pb-2">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
            className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
          >
            <span aria-hidden className="text-base leading-none">☰</span>
            Menu
          </button>
        </div>
        {open && (
          <nav className="mx-4 mb-3 space-y-0.5 rounded-xl border border-line bg-white p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  isActive(item.href) ? "bg-paper font-medium text-ink" : "text-ink/70 hover:bg-paper hover:text-ink"
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-ink">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Vanaf sm: vaste zijbalk, zoals voorheen */}
      <nav className="hidden sm:block sm:space-y-1 sm:px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-left text-sm ${
              isActive(item.href) ? "bg-paper font-medium text-ink" : "text-ink/70 hover:bg-paper hover:text-ink"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-ink">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
