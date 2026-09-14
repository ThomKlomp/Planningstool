"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Request = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  offeredByName: string;
  claimedByName: string;
};

export default function PendingSwapApprovals({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(id: string, action: "approve" | "reject") {
    setBusyId(id);
    await fetch(`/api/shift-swaps/${id}/${action}`, { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/40">
        Wacht op jouw goedkeuring
      </p>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-amber/40 bg-amber/5 text-sm">
        {requests.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">
                {new Date(r.date).toLocaleDateString("nl-NL", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {r.startTime}–{r.endTime}
                {r.role ? ` · ${r.role}` : ""}
              </p>
              <p className="text-xs text-ink/50">
                {r.offeredByName} → {r.claimedByName}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => respond(r.id, "approve")}
                disabled={busyId === r.id}
                className="rounded-full bg-awning px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Goedkeuren
              </button>
              <button
                onClick={() => respond(r.id, "reject")}
                disabled={busyId === r.id}
                className="rounded-full border border-line px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Afkeuren
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
