"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleAdminButton({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPlatformAdmin: !isAdmin }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        className="text-xs text-ink/60 hover:text-ink hover:underline disabled:opacity-50"
      >
        {isAdmin ? "Intrekken" : "Maak admin"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
