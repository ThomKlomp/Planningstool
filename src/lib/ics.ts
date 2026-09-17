// Genereert een iCalendar (.ics) feed met de shifts van één medewerker, voor
// gebruik als agenda-abonnement in Google Agenda en Apple Agenda.
//
// Gebruikt TZID=Europe/Amsterdam (met een meegeleverde VTIMEZONE-definitie)
// zodat tijden ook rond de overgang naar/van zomertijd kloppen — puur UTC
// zou shifts in de zomer een uur laten verschuiven.

type ShiftForFeed = {
  id: string;
  date: Date; // @db.Date-waarde (middernacht UTC voor die kalenderdag)
  startTime: string; // "17:00"
  endTime: string; // "23:00"
  role: string | null;
  note: string | null;
  updatedAt: Date;
};

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Amsterdam",
  "X-LIC-LOCATION:Europe/Amsterdam",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

// RFC5545: regels langer dan 75 octets moeten gevouwen worden.
function fold(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function escapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function localDateTime(date: Date, time: string) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const [hh, mm] = time.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildShiftsICS(opts: {
  companyName: string;
  memberName: string;
  shifts: ShiftForFeed[];
}) {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Shiftje//Roosterfeed//NL");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(fold(`X-WR-CALNAME:Shiftje — ${escapeText(opts.companyName)}`));
  lines.push("X-WR-TIMEZONE:Europe/Amsterdam");
  // De meeste clients (Google, Apple) hanteren hun eigen ververs-interval en
  // negeren dit, maar het kan geen kwaad om het toch mee te geven.
  lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
  lines.push("X-PUBLISHED-TTL:PT1H");
  lines.push(VTIMEZONE);

  for (const shift of opts.shifts) {
    lines.push("BEGIN:VEVENT");
    // Stabiele UID op basis van het shift-ID: cruciaal zodat een gewijzigde
    // shift als update herkend wordt i.p.v. als nieuw event, en zodat een
    // verwijderde shift (die simpelweg niet meer in de feed staat) bij de
    // volgende ophaalbeurt uit de agenda verdwijnt.
    lines.push(`UID:shift-${shift.id}@shiftje.nl`);
    lines.push(`DTSTAMP:${utcStamp(shift.updatedAt)}`);
    lines.push(`DTSTART;TZID=Europe/Amsterdam:${localDateTime(shift.date, shift.startTime)}`);
    lines.push(`DTEND;TZID=Europe/Amsterdam:${localDateTime(shift.date, shift.endTime)}`);
    lines.push(fold(`SUMMARY:${escapeText(shift.role ? `Dienst — ${shift.role}` : "Dienst")}`));
    lines.push(fold(`LOCATION:${escapeText(opts.companyName)}`));
    if (shift.note) {
      lines.push(fold(`DESCRIPTION:${escapeText(shift.note)}`));
    }
    // SEQUENCE afgeleid van updatedAt zodat agenda-apps een wijziging altijd
    // als nieuwere versie herkennen (ze vergelijken SEQUENCE en DTSTAMP).
    lines.push(`SEQUENCE:${Math.floor(shift.updatedAt.getTime() / 1000)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
