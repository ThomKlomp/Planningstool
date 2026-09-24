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
    <nav className="mt-4">
      {/* Mobiel: hamburgermenu */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
          className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
        >
          <span aria-hidden className="text-base leading-none">☰</span>
          Menu
        </button>
        {open && (
          <div className="mt-2 space-y-0.5 rounded-xl border border-line bg-white p-2">
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
        )}
      </div>

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
