"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteUrl(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      setLoading(false);
      return;
    }

    setInviteUrl(data.inviteUrl);
    setEmail("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-ink/60">E-mailadres</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@voorbeeld.nl"
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs text-ink/60">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER")}
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        >
          <option value="EMPLOYEE">Medewerker</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning transition-colors disabled:opacity-50"
      >
        {loading ? "Versturen..." : "Uitnodigen"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {inviteUrl && (
        <p className="w-full text-sm text-awning">
          Uitnodiging aangemaakt. Link (later automatisch per e-mail):{" "}
          <span className="break-all font-mono text-xs">{inviteUrl}</span>
        </p>
      )}
    </form>
  );
}
