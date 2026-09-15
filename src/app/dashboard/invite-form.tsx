"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Invite = { id: string; email: string; role: string; token: string };

export default function InviteForm({
  onInvited,
}: {
  onInvited?: (invite: Invite) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteUrl: string; emailSent: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

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

    setResult({ inviteUrl: data.inviteUrl, emailSent: data.emailSent });
    if (data.invite) {
      onInvited?.(data.invite);
    }
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
      {result && (
        <p className="w-full text-sm text-awning">
          {result.emailSent ? (
            "Uitnodiging verstuurd per e-mail."
          ) : (
            <>
              Uitnodiging aangemaakt, maar e-mail kon niet verstuurd worden.
              Deel deze link handmatig:{" "}
              <span className="break-all font-mono text-xs">{result.inviteUrl}</span>
            </>
          )}
        </p>
      )}
    </form>
  );
}
