"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const DEMO_PASSWORD = "Demo1234!";

function DemoSwitchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const email = params.get("email");

  useEffect(() => {
    if (!email) {
      setError("Geen e-mailadres opgegeven.");
      return;
    }

    signIn("credentials", { email, password: DEMO_PASSWORD, redirect: false }).then((result) => {
      if (result?.error) {
        // Dit werkt alleen voor de demo-accounts, hun wachtwoord staat vast
        // op "Demo1234!". Bij elk ander account faalt dit vanzelf.
        setError("Inloggen mislukt. Dit werkt alleen voor demo-accounts.");
        return;
      }
      router.push("/dashboard");
    });
  }, [email, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        {error ? (
          <>
            <h1 className="font-display text-xl text-ink">Inloggen mislukt</h1>
            <p className="mt-2 text-sm text-ink/60">{error}</p>
            <a
              href="/signin"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-awning transition-colors"
            >
              Naar het gewone inlogscherm
            </a>
          </>
        ) : (
          <p className="text-sm text-ink/60">Bezig met inloggen als {email}...</p>
        )}
      </div>
    </main>
  );
}

export default function DemoSwitchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
          <p className="text-sm text-ink/60">Bezig met inloggen...</p>
        </main>
      }
    >
      <DemoSwitchInner />
    </Suspense>
  );
}
