"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function AccountSettingsForm({
  initialName,
  initialEmail,
  hasPassword,
}: {
  initialName: string;
  initialEmail: string;
  hasPassword: boolean;
}) {
  return (
    <div className="space-y-8">
      <NameForm initialName={initialName} />
      <EmailForm initialEmail={initialEmail} />
      <PasswordForm hasPassword={hasPassword} />
    </div>
  );
}

function NameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section>
      <h2 className="font-display text-xl">Naam</h2>
      <p className="mt-1 text-sm text-ink/60">Hoe je naam getoond wordt in Shiftje.</p>
      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        {saved && <span className="text-xs text-awning">Opgeslagen</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </form>
    </section>
  );
}

function EmailForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setMessage(
      data.emailChanged
        ? "E-mailadres bijgewerkt. Check je nieuwe inbox om 'm te bevestigen."
        : "Niets veranderd."
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl">E-mailadres</h2>
      <p className="mt-1 text-sm text-ink/60">
        Waarop je meldingen en het rooster ontvangt. Na wijzigen moet je 'm
        opnieuw bevestigen via een link in je nieuwe inbox.
      </p>
      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        {message && <span className="text-xs text-awning">{message}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </form>
    </section>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Wachtwoord bijgewerkt.");
  }

  return (
    <section>
      <h2 className="font-display text-xl">Wachtwoord</h2>
      <p className="mt-1 text-sm text-ink/60">
        {hasPassword
          ? "Wijzig het wachtwoord waarmee je inlogt."
          : "Je logt nu in met Google. Hier kun je ook een wachtwoord instellen, handig als je liever met e-mail en wachtwoord inlogt."}
      </p>
      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
        {hasPassword && (
          <div>
            <label className="block text-xs text-ink/60">Huidig wachtwoord</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-ink/60">
            {hasPassword ? "Nieuw wachtwoord" : "Wachtwoord instellen"} (min. 8 tekens)
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        {message && <span className="text-xs text-awning">{message}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </form>
      {hasPassword && (
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="mt-4 text-xs text-ink/40 hover:text-ink hover:underline"
        >
          Overal uitloggen (opnieuw inloggen nodig)
        </button>
      )}
    </section>
  );
}
