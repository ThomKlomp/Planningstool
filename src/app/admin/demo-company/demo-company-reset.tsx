"use client";

import { useState } from "react";

type Credential = { email: string; role: string; password: string };

export default function DemoCompanyReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    companySlug: string;
    companyName: string;
    credentials: Credential[];
  } | null>(null);

  async function reset() {
    if (
      !confirm(
        "Weet je zeker dat je de demo-zaak wil resetten? Alles wat je er tijdens een demo in hebt aangepast, verdwijnt en wordt vervangen door de oorspronkelijke showcase-data."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/demo-company/reset", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Resetten mislukt.");
      return;
    }

    setResult({
      companySlug: data.company.slug,
      companyName: data.company.name,
      credentials: data.credentials,
    });
  }

  return (
    <div>
      <button
        onClick={reset}
        disabled={loading}
        className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
      >
        {loading ? "Bezig..." : "Demo-zaak resetten naar origineel"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 rounded-xl border border-line bg-white p-5">
          <p className="text-sm font-medium text-awning">
            {result.companyName} staat weer op de oorspronkelijke showcase-data.
          </p>

          <p className="mt-4 text-xs uppercase tracking-wide text-ink/40">Inloggegevens</p>
          <p className="mt-1 text-xs text-ink/50">
            Zelfde wachtwoord voor iedereen, log in via e-mail + wachtwoord
            (niet Google) op <span className="font-mono">/signin</span>.
          </p>

          <div className="mt-3 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Wachtwoord</th>
                </tr>
              </thead>
              <tbody>
                {result.credentials.map((c) => (
                  <tr key={c.email} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-ink/60">{c.role}</td>
                    <td className="px-3 py-2 font-mono">{c.email}</td>
                    <td className="px-3 py-2 font-mono">{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-ink/40">
            Deel-link voor de "medewerker uitnodigen"-showcase:{" "}
            <span className="font-mono">/join/{result.companySlug}</span>
          </p>
        </div>
      )}
    </div>
  );
}
