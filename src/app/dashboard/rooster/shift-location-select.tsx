"use client";

export type LocationOption = { id: string; name: string; color?: string };

/**
 * Locatie-keuze bij een dienst. Een medewerker met locaties mag alleen op een eigen
 * locatie ingeroosterd worden; bij precies één eigen locatie is er niets te kiezen
 * (die wordt vanzelf gebruikt). Een open dienst of een medewerker zonder koppeling
 * mag elke locatie van de zaak hebben. Zonder locaties in de zaak verschijnt niets.
 */
export default function ShiftLocationSelect({
  locations,
  memberLocationIds,
  hasMember,
  value,
  onChange,
}: {
  locations: LocationOption[];
  memberLocationIds: string[]; // locaties van de gekozen medewerker (leeg = alle)
  hasMember: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  if (locations.length === 0) return null;
  const restricted = hasMember && memberLocationIds.length > 0;
  const options = restricted ? locations.filter((l) => memberLocationIds.includes(l.id)) : locations;
  if (restricted && options.length < 2) return null;

  return (
    <div>
      <label className="block text-xs text-ink/60">
        {hasMember ? "Op welke locatie?" : "Open dienst op welke locatie?"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
      >
        {!restricted && <option value="">{hasMember ? "Geen vaste locatie" : "Alle locaties"}</option>}
        {restricted && <option value="">{options[0].name} (eerste locatie)</option>}
        {options.slice(restricted ? 1 : 0).map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
