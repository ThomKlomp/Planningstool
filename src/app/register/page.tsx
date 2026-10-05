import type { Metadata } from "next";
import RegisterForm from "./register-form";

// Geen zoekresultaat: ingelogde of token-afhankelijke pagina.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="auth-backdrop flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <h1 className="font-display text-2xl text-ink">Account aanmaken</h1>
        <p className="mt-2 text-sm text-ink/60">
          Voor het starten van je eigen zaak zonder Google-account.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
