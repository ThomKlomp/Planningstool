"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full rounded-lg border border-line px-3 py-2 text-left text-sm text-ink/70 hover:border-ink hover:text-ink"
    >
      Uitloggen
    </button>
  );
}
