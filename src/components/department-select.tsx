"use client";

export default function DepartmentSelect({
  departments,
  value,
  onChange,
}: {
  departments: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-ink/60">Team</label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
      >
        <option value="" disabled>
          Kies je team...
        </option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
