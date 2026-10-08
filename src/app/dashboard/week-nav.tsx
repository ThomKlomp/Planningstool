import Link from "next/link";
import { getISOWeekNumber, toDateParam, getWeekDates } from "@/lib/week";

export default function WeekNav({
  basePath,
  weekStart,
  extraQuery,
}: {
  basePath: string;
  weekStart: Date;
  /** Extra queryparameters die bij elke link behouden blijven, bv. "tab=rooster". */
  extraQuery?: string;
}) {
  const href = (date?: Date) => {
    const params = [extraQuery, date ? `week=${toDateParam(date)}` : ""].filter(Boolean).join("&");
    return params ? `${basePath}?${params}` : basePath;
  };
  const prev = new Date(weekStart);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(weekStart);
  next.setDate(next.getDate() + 7);

  const currentWeekStart = getWeekDates(new Date())[0];
  const isCurrentWeek = weekStart.toDateString() === currentWeekStart.toDateString();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href={href(prev)}
        className="rounded-full border border-line px-2.5 py-1 hover:border-ink"
        aria-label="Vorige week"
      >
        ←
      </Link>
      <span className="font-medium">
        Week {getISOWeekNumber(weekStart)}
        <span className="ml-1.5 hidden text-ink/40 sm:inline">
          ({weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} –{" "}
          {weekEnd.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})
        </span>
      </span>
      <Link
        href={href(next)}
        className="rounded-full border border-line px-2.5 py-1 hover:border-ink"
        aria-label="Volgende week"
      >
        →
      </Link>
      {!isCurrentWeek && (
        <Link
          href={href()}
          className="rounded-full px-2.5 py-1 text-xs text-awning hover:underline"
        >
          Vandaag
        </Link>
      )}
    </div>
  );
}
