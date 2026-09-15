"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscountCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/billing/redeem-discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Code ongeldig.");
      return;
    }

    setMessage(data.message ?? "Kortingscode toegepast.");
    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-ink/60">Kortingscode</label>
        <input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Bv. LAUNCH2026"
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink disabled:opacity-50"
      >
        {loading ? "Bezig..." : "Toepassen"}
      </button>
      {message && <span className="text-xs text-awning">{message}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
