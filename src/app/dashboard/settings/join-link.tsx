"use client";

import { useState } from "react";

export default function JoinLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/join/${slug}` : `/join/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Klembord niet beschikbaar (bv. geen https): niets doen, de link
      // staat gewoon zichtbaar in het veld om handmatig te selecteren.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-4">
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink/70"
      />
      <button
        onClick={copy}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper hover:bg-awning transition-colors"
      >
        {copied ? "Gekopieerd" : "Kopiëren"}
      </button>
    </div>
  );
}
