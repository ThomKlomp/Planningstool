"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    setResent(false);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error === "EmailNotVerified") {
      setNeedsVerification(true);
      setLoading(false);
      return;
    }
    if (result?.error) {
      setError("E-mailadres of wachtwoord klopt niet.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function resendVerification() {
    setLoading(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setResent(true);
  }

  return (
    <>
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-6 w-full rounded-full bg-ink px-4 py-3 font-medium text-paper hover:bg-awning transition-colors"
      >
        Inloggen met Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-line" />
        of
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleCredentialsSubmit} className="space-y-3 text-left">
        <div>
          <label className="block text-xs text-ink/60">E-mailadres</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60">Wachtwoord</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {needsVerification && (
          <div className="rounded-lg bg-amber/10 px-3 py-2 text-sm text-amber-dark">
            <p>Bevestig eerst je e-mailadres — check je inbox voor de link.</p>
            {resent ? (
              <p className="mt-1 text-xs">Opnieuw verstuurd, check je inbox.</p>
            ) : (
              <button
                type="button"
                onClick={resendVerification}
                disabled={loading}
                className="mt-1 text-xs underline hover:no-underline disabled:opacity-50"
              >
                Verstuur de link opnieuw
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Inloggen met e-mail"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink/50">
        Nog geen account?{" "}
        <Link href="/register" className="text-awning hover:underline">
          Account aanmaken
        </Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-display text-2xl text-ink">Welkom terug</h1>
        <p className="mt-2 text-sm text-ink/60">
          Log in om bij je zaak te komen.
        </p>
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>
    </main>
  );
}
