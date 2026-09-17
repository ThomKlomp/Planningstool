"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/billing/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Kon de code niet toepassen.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Kortingscode"
        className="w-full max-w-xs rounded-lg border border-line px-3 py-2 text-sm uppercase"
      />
      <button
        onClick={apply}
        disabled={busy || !code.trim()}
        className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink disabled:opacity-50"
      >
        {busy ? "Bezig..." : "Toepassen"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
