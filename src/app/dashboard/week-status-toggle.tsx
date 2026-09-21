"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WeekStatusToggle({
  weekStart,
  initialIsOpen,
  hasOverride = false,
  canManage,
  openLabel = "Week open, klik om te sluiten",
  closedLabel = "Week gesloten, klik om te openen",
}: {
  weekStart: string;
  initialIsOpen: boolean;
  hasOverride?: boolean;
  canManage: boolean;
  openLabel?: string;
  closedLabel?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [overridden, setOverridden] = useState(hasOverride);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !isOpen;
    setSaving(true);
    setIsOpen(next);
    setOverridden(true);

    await fetch("/api/week-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, isOpen: next }),
    });

    setSaving(false);
    router.refresh();
  }

  async function resetToAutomatic() {
    setSaving(true);
    await fetch(`/api/week-status?weekStart=${encodeURIComponent(weekStart)}`, {
      method: "DELETE",
    });
    setSaving(false);
    setOverridden(false);
    router.refresh();
  }

  if (!canManage) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          isOpen ? "bg-awning/10 text-awning" : "bg-ink/10 text-ink/60"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-awning" : "bg-ink/40"}`}
        />
        {isOpen ? "Beschikbaarheid open" : "Beschikbaarheid gesloten"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity disabled:opacity-50 ${
          isOpen ? "bg-awning/10 text-awning hover:bg-awning/20" : "bg-ink/10 text-ink/60 hover:bg-ink/20"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-awning" : "bg-ink/40"}`} />
        {isOpen ? openLabel : closedLabel}
      </button>
      {overridden && (
        <button
          onClick={resetToAutomatic}
          disabled={saving}
          className="text-xs text-ink/40 hover:text-ink hover:underline disabled:opacity-50"
          title="Handmatige instelling verwijderen, terug naar de automatische regel"
        >
          Terug naar automatisch
        </button>
      )}
    </div>
  );
}
