/** Gewerkte uren (decimaal) van één urenregel, met pauze; werken over middernacht wordt ondersteund. */
export function workedHours(e: { startTime: string; endTime: string; breakMinutes: number }): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  if (!e.startTime || !e.endTime) return 0;
  let diff = toMin(e.endTime) - toMin(e.startTime);
  if (diff <= 0) diff += 24 * 60;
  return Math.max(0, diff - (e.breakMinutes || 0)) / 60;
}

/** 12,5 -> "12 u 30 min", 8 -> "8 u", 0,75 -> "45 min". */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return "0 u";
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} u`;
  return `${h} u ${m} min`;
}
