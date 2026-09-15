"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CompanyDetails = {
  billingName: string;
  kvkNumber: string;
  vatNumber: string;
  address: string;
  postalCode: string;
};

export default function CompanyDetailsSetting({
  initialValue,
}: {
  initialValue: CompanyDetails;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof CompanyDetails, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Bedrijfsnaam"
          value={values.billingName}
          onChange={(v) => update("billingName", v)}
          placeholder="Café De Pub B.V."
        />
        <Field
          label="KVK-nummer"
          value={values.kvkNumber}
          onChange={(v) => update("kvkNumber", v)}
          placeholder="12345678"
        />
        <Field
          label="BTW-nummer"
          value={values.vatNumber}
          onChange={(v) => update("vatNumber", v)}
          placeholder="NL123456789B01"
        />
        <Field
          label="Postcode"
          value={values.postalCode}
          onChange={(v) => update("postalCode", v)}
          placeholder="1234 AB"
        />
        <div className="sm:col-span-2">
          <Field
            label="Adres"
            value={values.address}
            onChange={(v) => update("address", v)}
            placeholder="Straatnaam 1, Amsterdam"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        {saved && <span className="text-xs text-awning">Opgeslagen</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-ink/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
      />
    </div>
  );
}
