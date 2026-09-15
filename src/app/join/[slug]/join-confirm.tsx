"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DepartmentSelect from "@/components/department-select";

export default function JoinConfirm({
  slug,
  companyName,
  suggestedName,
  departments,
}: {
  slug: string;
  companyName: string;
  suggestedName: string;
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(suggestedName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(
    suggestedName.split(" ").slice(1).join(" ")
  );
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDepartmentChoice = departments.length > 1;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/join/${slug}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        ...(needsDepartmentChoice ? { departmentId } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis, probeer het opnieuw.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <p className="text-xs uppercase tracking-wide text-awning text-center">
          Uitnodiging
        </p>
        <h1 className="mt-2 text-center font-display text-2xl text-ink">
          {companyName}
        </h1>
        <p className="mt-3 text-center text-sm text-ink/60">
          Je staat op het punt om als <span className="font-medium">medewerker</span>{" "}
          toe te treden tot <span className="font-medium">{companyName}</span>.
        </p>

        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <p className="text-xs text-ink/50">
            Zodat je collega&apos;s en manager weten wie je bent (dat is met
            een Google-account niet altijd duidelijk):
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-ink/60">Voornaam</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-ink/60">Achternaam</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
            </div>
          </div>

          {needsDepartmentChoice && (
            <DepartmentSelect
              departments={departments}
              value={departmentId}
              onChange={setDepartmentId}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper hover:bg-awning transition-colors disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Word medewerker"}
          </button>
        </form>
      </div>
    </main>
  );
}
