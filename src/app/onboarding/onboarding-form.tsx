"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis, probeer het opnieuw.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Naam van je zaak
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Café De Pub"
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 focus:border-awning focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper hover:bg-awning transition-colors disabled:opacity-50"
      >
        {loading ? "Bezig..." : "Omgeving aanmaken"}
      </button>
    </form>
  );
}
