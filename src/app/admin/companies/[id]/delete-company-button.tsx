"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCompanyButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Weet je zeker dat je "${companyName}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch(`/api/admin/companies/${companyId}`, { method: "DELETE" });
    router.push("/admin/companies");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {busy ? "Bezig..." : `${companyName} verwijderen`}
    </button>
  );
}
