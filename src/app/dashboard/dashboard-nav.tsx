"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/sign-out-button";

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
      {/* Mobiel: knop rechtsboven, los van de tekststroom (absoluut
          gepositioneerd t.o.v. de gezamenlijke wrapper in layout.tsx), zodat
          een lange zaaknaam gewoon naar een tweede regel kan doorlopen
          zonder dat de knop meezakt. */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
          className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
        >
          <span aria-hidden className="text-base leading-none">☰</span>
          Menu
        </button>

        <nav
          className={`absolute right-4 top-16 z-30 w-64 origin-top-right space-y-0.5 rounded-xl border border-line bg-white p-2 shadow-lg transition duration-150 ease-out ${
            open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          }`}
        >
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
          <div className="mt-1 border-t border-line pt-1">
            <SignOutButton className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink/50 hover:bg-paper hover:text-ink" />
          </div>
        </nav>

        {open && (
          <div
            onClick={() => setOpen(false)}
            aria-hidden
            className="fixed inset-0 z-20"
          />
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
