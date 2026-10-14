// Klein gekleurd labeltje met de naam van een locatie (kostenplaats).
export default function LocationBadge({
  name,
  color,
  className = "",
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink/70 ${className}`}
      title={`Locatie: ${name}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? "#475569" }}
        aria-hidden
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
