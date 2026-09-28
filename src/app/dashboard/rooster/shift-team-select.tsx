"use client";

export type MemberTeam = { id: string; name: string };

/**
 * Team-keuze bij een dienst. Verschijnt alleen als de gekozen medewerker in
 * meer dan één team zit (een uitzondering), anders zie je er niets van.
 * teams[0] is het hoofdteam; een lege waarde betekent "hoofdteam".
 */
export default function ShiftTeamSelect({
  teams,
  value,
  onChange,
}: {
  teams: MemberTeam[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (teams.length < 2) return null;
  return (
    <div>
      <label className="block text-xs text-ink/60">Voor welk team?</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
      >
        <option value="">{teams[0].name} (hoofdteam)</option>
        {teams.slice(1).map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
