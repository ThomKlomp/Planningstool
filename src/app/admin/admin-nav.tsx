"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = {
  href: string;
  label: string;
  badge?: number;
};

/**
 * Navigatie van het adminportaal. Vanaf sm: een horizontale rij zoals
 * voorheen; daaronder (mobiel) een hamburgermenu (drie streepjes), want de
 * volledige rij paste niet meer op een telefoonscherm.
 */
export default function AdminNav({
  items,
  backLink,
}: {
  items: AdminNavItem[];
  backLink?: { href: string; label: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="relative mt-4">
      {/* Mobiel: knop rechts; het paneel hoort NIET in dezelfde flex-rij (dat
          rekte de knop eerder per ongeluk uit tot een lange ovale vorm). */}
      <div className="relative z-30 flex justify-end sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
          className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
        >
          <span aria-hidden className="text-base leading-none">☰</span>
          Menu
        </button>
      </div>

      {/* Zwevend paneel: neemt geen ruimte in, klapt over de pagina heen in
          plaats van de inhoud omlaag te duwen. */}
      <div
        className={`absolute right-0 top-full z-30 mt-2 w-64 origin-top-right rounded-xl border border-line bg-white p-2 shadow-lg transition duration-150 ease-out sm:hidden ${
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
        {backLink && (
          <Link
            href={backLink.href}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-ink/50 hover:bg-paper hover:text-ink"
          >
            {backLink.label}
          </Link>
        )}
      </div>

      {/* Achtergrond: tik ernaast om te sluiten */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-20 sm:hidden"
        />
      )}

      {/* Vanaf sm: horizontale rij, zoals voorheen */}
      <div className="hidden sm:flex sm:gap-1 sm:overflow-x-auto sm:text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 ${
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
        {backLink && (
          <Link
            href={backLink.href}
            className="ml-auto shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ink/50 hover:bg-paper hover:text-ink"
          >
            {backLink.label}
          </Link>
        )}
      </div>
    </nav>
  );
}
