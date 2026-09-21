import ExcelJS from "exceljs";

export type ExportEntry = {
  date: Date; // @db.Date (UTC-middernacht)
  startTime: string;
  endTime: string;
  breakMinutes: number;
  memberName: string;
  departmentName: string | null;
};

/** Gewerkte uren (decimaal) van één urenregel; over middernacht wordt ondersteund. */
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

const iso = (d: Date) => d.toISOString().slice(0, 10);

function isoWeek(d: Date): { year: number; week: number; monday: Date; sunday: Date } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  const monday = new Date(t);
  monday.setUTCDate(t.getUTCDate() - (dayNum - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const thursday = new Date(t);
  thursday.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: thursday.getUTCFullYear(), week, monday, sunday };
}

const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const HOURS_FMT = "0.00";

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFAF7F2" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B1B18" } };
  row.alignment = { vertical: "middle" };
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: { header: string; width: number; hours?: boolean }[],
  rows: (string | number)[][]
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width }));
  styleHeader(ws.getRow(1));
  rows.forEach((r) => ws.addRow(r));

  columns.forEach((c, i) => {
    if (c.hours) ws.getColumn(i + 1).numFmt = HOURS_FMT;
  });

  // Totaalregel met echte SUM-formules, zodat filteren/aanpassen in Excel klopt.
  if (rows.length > 0) {
    const last = rows.length + 1;
    const total = ws.addRow(columns.map(() => ""));
    total.getCell(1).value = "Totaal";
    columns.forEach((c, i) => {
      if (c.hours || c.header === "Diensten") {
        const col = ws.getColumn(i + 1).letter;
        total.getCell(i + 1).value = { formula: `SUM(${col}2:${col}${last})` };
      }
    });
    total.font = { bold: true };
    total.border = { top: { style: "thin" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: last, column: columns.length } };
  }
  return ws;
}

export async function buildHoursWorkbook(entries: ExportEntry[], periodLabel: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Shiftje";
  wb.created = new Date();

  const sorted = [...entries].sort(
    (a, b) =>
      a.memberName.localeCompare(b.memberName, "nl") ||
      a.date.getTime() - b.date.getTime() ||
      a.startTime.localeCompare(b.startTime)
  );

  // --- Maandoverzicht: per persoon per maand
  const month = new Map<string, { name: string; team: string; y: number; m: number; n: number; h: number }>();
  // --- Weekoverzicht: per persoon per ISO-week
  const week = new Map<string, { name: string; team: string; w: ReturnType<typeof isoWeek>; n: number; h: number }>();
  // --- Dagoverzicht: per persoon per dag
  const day = new Map<string, { name: string; team: string; date: Date; times: string[]; brk: number; h: number }>();

  for (const e of sorted) {
    const h = workedHours(e);
    const team = e.departmentName ?? "";
    const y = e.date.getUTCFullYear();
    const m = e.date.getUTCMonth();

    const mk = `${e.memberName}|${y}-${m}`;
    const mo = month.get(mk) ?? { name: e.memberName, team, y, m, n: 0, h: 0 };
    mo.n += 1; mo.h += h; month.set(mk, mo);

    const w = isoWeek(e.date);
    const wk = `${e.memberName}|${w.year}-${w.week}`;
    const we = week.get(wk) ?? { name: e.memberName, team, w, n: 0, h: 0 };
    we.n += 1; we.h += h; week.set(wk, we);

    const dk = `${e.memberName}|${iso(e.date)}`;
    const da = day.get(dk) ?? { name: e.memberName, team, date: e.date, times: [], brk: 0, h: 0 };
    da.times.push(`${e.startTime}–${e.endTime}`);
    da.brk += e.breakMinutes || 0;
    da.h += h;
    day.set(dk, da);
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;

  addSheet(
    wb,
    "Maandoverzicht",
    [
      { header: "Medewerker", width: 26 },
      { header: "Team", width: 16 },
      { header: "Maand", width: 18 },
      { header: "Diensten", width: 10 },
      { header: "Uren", width: 10, hours: true },
    ],
    Array.from(month.values()).map((r) => [r.name, r.team, `${MONTHS[r.m]} ${r.y}`, r.n, r2(r.h)])
  );

  addSheet(
    wb,
    "Weekoverzicht",
    [
      { header: "Medewerker", width: 26 },
      { header: "Team", width: 16 },
      { header: "Week", width: 14 },
      { header: "Van", width: 12 },
      { header: "Tot", width: 12 },
      { header: "Diensten", width: 10 },
      { header: "Uren", width: 10, hours: true },
    ],
    Array.from(week.values()).map((r) => [
      r.name, r.team, `Week ${r.w.week} (${r.w.year})`, iso(r.w.monday), iso(r.w.sunday), r.n, r2(r.h),
    ])
  );

  addSheet(
    wb,
    "Dagoverzicht",
    [
      { header: "Medewerker", width: 26 },
      { header: "Team", width: 16 },
      { header: "Datum", width: 12 },
      { header: "Dag", width: 12 },
      { header: "Tijden", width: 24 },
      { header: "Pauze (min)", width: 12 },
      { header: "Uren", width: 10, hours: true },
    ],
    Array.from(day.values()).map((r) => [
      r.name, r.team, iso(r.date),
      r.date.toLocaleDateString("nl-NL", { weekday: "long", timeZone: "UTC" }),
      r.times.join("; "), r.brk, r2(r.h),
    ])
  );

  // Metadata-blad bovenaan is bewust weggelaten; periode zit in de bestandsnaam.
  void periodLabel;
  return wb;
}
