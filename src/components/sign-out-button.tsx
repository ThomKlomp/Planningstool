"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-ink hover:text-ink sm:w-full sm:rounded-lg sm:px-3 sm:py-2 sm:text-left sm:text-sm"
    >
      Uitloggen
    </button>
  );
}
