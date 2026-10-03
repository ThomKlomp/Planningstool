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

/**
 * Team-keuze bij een open dienst (nog geen medewerker). Alleen leden van dat
 * team zien 'm dan als open dienst die ze kunnen oppakken; leeg = alle teams.
 */
export function OpenShiftTeamSelect({
  departments,
  value,
  onChange,
}: {
  departments: MemberTeam[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (departments.length === 0) return null;
  return (
    <div>
      <label className="block text-xs text-ink/60">Open dienst voor welk team?</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
      >
        <option value="">Alle teams</option>
        {departments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[11px] text-ink/50">
        Leden van dit team krijgen een melding en kunnen de dienst zelf oppakken.
      </p>
    </div>
  );
}
