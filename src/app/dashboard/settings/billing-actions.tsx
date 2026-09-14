"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingActions({
  mode,
  interval,
}: {
  mode: "subscribe" | "cancel";
  interval?: "MONTHLY" | "YEARLY";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.checkoutUrl) {
      setError(data.error ?? "Er ging iets mis, probeer het opnieuw.");
      setLoading(false);
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  async function cancel() {
    if (!confirm("Abonnement opzeggen? Je verliest toegang zodra de huidige periode afloopt.")) {
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Opzeggen mislukt.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  if (mode === "cancel") {
    return (
      <div>
        <button
          onClick={cancel}
          disabled={loading}
          className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Abonnement opzeggen"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={subscribe}
        disabled={loading}
        className="w-full rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
      >
        {loading ? "Bezig..." : "Kiezen"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
