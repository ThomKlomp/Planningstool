"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="mt-6 w-full rounded-full bg-ink px-4 py-3 font-medium text-paper hover:bg-awning transition-colors"
    >
      Inloggen met Google
    </button>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-display text-2xl text-ink">Welkom terug</h1>
        <p className="mt-2 text-sm text-ink/60">
          Log in met je Google-account om bij je zaak te komen.
        </p>
        <Suspense fallback={null}>
          <SignInButton />
        </Suspense>
      </div>
    </main>
  );
}


