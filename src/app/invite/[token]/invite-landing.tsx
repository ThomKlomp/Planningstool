"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function InviteLanding({
  token,
  companyName,
  role,
  email,
}: {
  token: string;
  companyName: string;
  role: string;
  email: string;
}) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/invites/${token}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        password,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      setError(data.error ?? "Er ging iets mis.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-xs uppercase tracking-wide text-awning">
          Uitnodiging
        </p>

        <h1 className="mt-2 font-display text-2xl text-ink">
          {companyName}
        </h1>

        <p className="mt-3 text-sm text-ink/60">
          Je bent uitgenodigd om als{" "}
          <span className="font-medium">{role}</span> mee te werken bij{" "}
          <span className="font-medium">{companyName}</span>, voor{" "}
          <span className="font-medium">{email}</span>.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-awning/10 px-4 py-4 text-left text-sm text-awning">
            <p className="font-medium">Check je e-mail</p>

            <p className="mt-1 text-awning/90">
              We hebben een bevestigingslink gestuurd naar {email}. Klik
              daarop om je account te activeren, en log daarna in.
            </p>
          </div>
        ) : !showEmailForm ? (
          <>
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: `/invite/${token}`,
                })
              }
              className="mt-6 w-full rounded-full bg-ink px-4 py-3 font-medium text-paper transition-colors hover:bg-awning"
            >
              Inloggen met Google
            </button>

            <button
              onClick={() => setShowEmailForm(true)}
              className="mt-3 w-full rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink"
            >
              Liever met e-mail + wachtwoord
            </button>
          </>
        ) : (
          <form
            onSubmit={handleRegister}
            className="mt-6 space-y-3 text-left"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-ink/60">
                  Voornaam
                </label>

                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs text-ink/60">
                  Achternaam
                </label>

                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink/60">
                Wachtwoord (min. 8 tekens)
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper transition-colors hover:bg-awning disabled:opacity-50"
            >
              {loading
                ? "Bezig..."
                : "Account aanmaken & accepteren"}
            </button>

            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full text-center text-xs text-ink/50 hover:underline"
            >
              ← Terug
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
