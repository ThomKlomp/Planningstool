"use client";

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
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-xs uppercase tracking-wide text-awning">Uitnodiging</p>
        <h1 className="mt-2 font-display text-2xl text-ink">{companyName}</h1>
        <p className="mt-3 text-sm text-ink/60">
          Je bent uitgenodigd om als <span className="font-medium">{role}</span> mee
          te werken bij <span className="font-medium">{companyName}</span>. Log in met{" "}
          <span className="font-medium">{email}</span> om de uitnodiging te accepteren.
        </p>
        <button
          onClick={() =>
            signIn("google", { callbackUrl: `/invite/${token}` })
          }
          className="mt-6 w-full rounded-full bg-ink px-4 py-3 font-medium text-paper hover:bg-awning transition-colors"
        >
          Inloggen met Google
        </button>
      </div>
    </main>
  );
}
