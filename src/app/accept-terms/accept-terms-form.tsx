"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AcceptTermsForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checked) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/accept-terms", { method: "POST" });
    if (!res.ok) {
      setError("Er ging iets mis, probeer het opnieuw.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="flex items-start gap-3 text-sm text-ink/70">
        <input
          type="checkbox"
          required
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line text-awning focus:ring-awning"
        />
        <span>
          Ik ga akkoord met de{" "}
          <Link href="/voorwaarden" target="_blank" className="text-awning hover:underline">
            algemene voorwaarden
          </Link>{" "}
          en het{" "}
          <Link href="/privacy" target="_blank" className="text-awning hover:underline">
            privacybeleid
          </Link>{" "}
          van Shiftje.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!checked || loading}
        className="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper transition-colors hover:bg-awning disabled:opacity-40"
      >
        {loading ? "Bezig..." : "Doorgaan"}
      </button>
    </form>
  );
}
