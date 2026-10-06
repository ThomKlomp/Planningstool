// Functieblokken op de homepage. Klik (of druk Enter/spatie) op een blok en
// het draait om: op de achterkant zie je hoe die functie er in de app uitziet.
// Puur CSS (een verborgen checkbox, zie .flip in globals.css), dus geen
// client-JavaScript nodig en toegankelijk met het toetsenbord.
import { VENUES, range, shortRange, type Venue, type VenueData } from "./venue";

const BLUE = "#6E9BD1";
const ORNG = "#E0A458";

function Pill({ children, tone = "sage" }: { children: React.ReactNode; tone?: "sage" | "sand" | "mist" }) {
  const t =
    tone === "sage"
      ? "bg-[#CBD9B8] text-ink"
      : tone === "sand"
      ? "bg-sand text-[#4A2A12]"
      : "bg-mist text-ink/60";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-bold ${t}`}>
      {children}
    </span>
  );
}

function MiniBtn({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "ghost" | "dark" }) {
  const v =
    variant === "primary"
      ? "bg-terra text-white"
      : variant === "dark"
      ? "bg-ink text-white"
      : "border-[1.5px] border-ink text-ink";
  return (
    <span className={`inline-flex items-center justify-center rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold ${v}`}>
      {children}
    </span>
  );
}

function Panel({ children, gap = "gap-2" }: { children: React.ReactNode; gap?: string }) {
  return (
    <div className={`flex flex-col ${gap} rounded-[18px] bg-white p-3 text-ink shadow-[0_8px_20px_-14px_rgba(30,51,38,0.5)]`}>
      {children}
    </div>
  );
}

function Shift({
  name,
  time,
  state = "n",
  note,
}: {
  name: string;
  time: string;
  state?: "n" | "offer" | "taken" | "open";
  note?: string;
}) {
  const tone =
    state === "open"
      ? "border-[1.5px] border-dashed border-amber bg-amber/10"
      : state === "offer"
      ? "border border-amber/50 bg-amber/15"
      : state === "taken"
      ? "bg-[#CBD9B8]"
      : "bg-mist";
  return (
    <div className={`flex min-w-0 flex-col gap-px rounded-[9px] px-[7px] py-1.5 text-[11px] ${tone}`}>
      <div className="font-bold leading-tight">{name}</div>
      <div className="leading-tight text-ink/60">{time}</div>
      {note ? <div className="font-bold leading-tight text-terra">{note}</div> : null}
    </div>
  );
}

function Group({ team, first = false, children }: { team: string; first?: boolean; children: React.ReactNode }) {
  const dot = first ? BLUE : ORNG;
  const text = first ? "#3A6EA5" : "#9A5F10";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: text }}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        {team}
      </div>
      {children}
    </div>
  );
}

function Day({ label, children, avail }: { label: string; children: React.ReactNode; avail: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-[#F4F8F0] p-2">
      <div className="font-display text-[13px] font-bold">{label}</div>
      {children}
      <div className="rounded-[9px] border-[1.5px] border-dashed border-ink/30 py-1 text-center text-[10px] font-bold text-ink/55">
        + Shift
      </div>
      <div className="text-[10px] text-ink/55">{avail} beschikbaar</div>
    </div>
  );
}

function Choice({ selected }: { selected: 0 | 1 | 2 }) {
  const opts = [
    { g: "✓", c: "#2F7D4F" },
    { g: "?", c: "#E8A33D" },
    { g: "✕", c: "#C0392B" },
  ];
  return (
    <span className="flex gap-1">
      {opts.map((o, i) => (
        <span
          key={o.g}
          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-bold"
          style={
            selected === i
              ? { backgroundColor: o.c, color: "#fff", border: `2px solid ${o.c}` }
              : { backgroundColor: "#fff", color: "rgba(30,51,38,0.55)", border: "1.5px solid #8A9A85" }
          }
        >
          {o.g}
        </span>
      ))}
    </span>
  );
}

function AvailabilityUi({ v }: { v: VenueData }) {
  const shift = (n: string, t: string, sel: 0 | 1 | 2) => (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span>
        <b>{n}</b> <span className="text-ink/55">{t}</span>
      </span>
      <Choice selected={sel} />
    </div>
  );
  const day = (d: string, a: 0 | 1 | 2, b: 0 | 1 | 2) => (
    <div className="flex flex-col gap-[7px] rounded-xl bg-[#F4F8F0] px-2.5 py-2">
      <div className="font-display text-sm font-bold">{d}</div>
      {shift("Middagshift", "12–18", a)}
      {shift("Avondshift", shortRange(v.eve), b)}
    </div>
  );
  return (
    <Panel>
      <div className="flex items-center justify-between gap-1.5">
        <Pill>Beschikbaarheid open</Pill>
        <span className="text-[11px] font-bold text-awning">✓ Opgeslagen</span>
      </div>
      <div className="rounded-xl bg-mist px-2.5 py-2 text-xs">
        <b className="font-display">Ma 5</b> <span className="text-ink/55">Gesloten · Vaste sluitingsdag</span>
      </div>
      {day("Di 6", 0, 1)}
      {day("Wo 7", 0, 2)}
      <div className="flex flex-wrap gap-x-2.5 text-[10.5px] text-ink/55">
        <span>✓ Beschikbaar</span>
        <span>? Weet ik nog niet</span>
        <span>✕ Niet beschikbaar</span>
      </div>
    </Panel>
  );
}

function RosterUi({ v }: { v: VenueData }) {
  return (
    <Panel gap="gap-2.5">
      <div className="flex items-center justify-between gap-1.5">
        <Pill tone="sand">Concept, nog niet zichtbaar</Pill>
        <MiniBtn>Rooster publiceren</MiniBtn>
      </div>
      <div className="font-display text-[13px] font-bold">Week 41 · 5 – 11 okt</div>
      <div className="grid grid-cols-3 gap-[7px]">
        <Day label="Wo 7" avail={4}>
          <Group team={v.teamA} first>
            <Shift name="Tom Visser" time="12:00–18:00" state="offer" note="Aangeboden" />
            <Shift name="Nina de Boer" time={range(v.eve)} />
          </Group>
          <Group team={v.teamB}>
            <Shift name="Ahmed El Idrissi" time="12:00–18:00" />
          </Group>
        </Day>
        <Day label="Do 8" avail={5}>
          <Group team={v.teamA} first>
            <Shift name="Julia Bakker" time={range(v.eve)} state="taken" note="Overgenomen van Tom Visser" />
          </Group>
          <Group team={v.teamB}>
            <Shift name="Elif Yildiz" time="12:00–18:00" />
          </Group>
        </Day>
        <Day label="Vr 9" avail={3}>
          <Group team={v.teamA} first>
            <Shift name="Tom Visser" time={range(v.late)} />
            <Shift name="Nog niet toegewezen" time={range(v.late)} state="open" />
          </Group>
          <Group team={v.teamB}>
            <Shift name="Elif Yildiz" time={range(v.late)} />
          </Group>
        </Day>
      </div>
    </Panel>
  );
}

function TeamsUi({ v }: { v: VenueData }) {
  const row = (n: string, c: string) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-4 w-4 rounded-[5px]" style={{ backgroundColor: c }} />
      <b className="flex-1">{n}</b>
      <span className="text-ink/55">↑ ↓</span>
    </div>
  );
  const mem = (n: string, t: string, c: string) => (
    <div className="flex items-center justify-between text-xs">
      <span>{n}</span>
      <span className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#8A9A85] px-2 py-0.5 text-[11px]">
        <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: c }} />
        {t} ▾
      </span>
    </div>
  );
  return (
    <Panel>
      <div className="font-display text-sm font-bold">Teams</div>
      {row(v.teamA, BLUE)}
      {row(v.teamB, ORNG)}
      <div className="border-t border-line pt-2 text-[11px] font-bold text-ink/55">Medewerkers indelen</div>
      {mem("Julia Bakker", v.teamA, BLUE)}
      {mem("Elif Yildiz", v.teamB, ORNG)}
      {mem("Nina de Boer", v.teamA, BLUE)}
      <div className="flex flex-wrap items-center gap-1.5">
        <MiniBtn variant="ghost">+ Extra team</MiniBtn>
        <MiniBtn variant="dark">+ Nieuw team</MiniBtn>
      </div>
      <div className="rounded-[10px] bg-mist px-2.5 py-2 text-[11px] text-ink/70">
        Op het rooster zie je met een kleur wie bij welk team hoort.
      </div>
    </Panel>
  );
}

function SwapUi({ v }: { v: VenueData }) {
  const step = (n: number, children: React.ReactNode) => (
    <div className="flex items-start gap-2.5">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
        {n}
      </span>
      <div className="flex flex-1 flex-col gap-1.5 text-xs">{children}</div>
    </div>
  );
  return (
    <Panel gap="gap-2.5">
      {step(
        1,
        <>
          <div className="rounded-lg border-l-4 bg-mist px-2 py-1.5" style={{ borderColor: BLUE }}>
            <b>Za 10 · {shortRange(v.late)}</b>
            <div className="text-[11px] text-ink/55">Nina de Boer · {v.teamA}</div>
          </div>
          <div>
            <Pill tone="sand">Aangeboden aan het team</Pill>
          </div>
        </>
      )}
      {step(
        2,
        <div>
          <b>Tom</b> neemt de dienst over <Pill>1 ruilvoorstel</Pill>
        </div>
      )}
      {step(
        3,
        <>
          <div>Jij geeft je akkoord</div>
          <div className="flex gap-1.5">
            <MiniBtn>Goedkeuren</MiniBtn>
            <MiniBtn variant="ghost">Afkeuren</MiniBtn>
          </div>
        </>
      )}
      {step(
        4,
        <>
          <div className="rounded-lg bg-[#CBD9B8] px-2 py-1.5 font-bold">Overgenomen van Nina</div>
          <div className="text-[11px] text-ink/55">Het rooster past zich vanzelf aan.</div>
        </>
      )}
    </Panel>
  );
}

function HoursUi({ v }: { v: VenueData }) {
  const entry = (day: string, t: string, badge: React.ReactNode, extra?: React.ReactNode) => (
    <div className="flex flex-col gap-[5px] rounded-xl bg-[#F4F8F0] px-2.5 py-2 text-xs">
      <div className="flex justify-between gap-1.5">
        <b>{day}</b>
        <span>{t}</span>
      </div>
      {badge}
      {extra}
    </div>
  );
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <b className="font-display text-sm">Mijn uren</b>
        <span className="text-[10.5px] text-ink/55">Goedgekeurd 42,5 · In behandeling 11</span>
      </div>
      {entry("Di 6", range(v.eve), <Pill>Goedgekeurd</Pill>)}
      {entry(
        "Wo 7",
        "12:00–18:00 · pauze 30",
        <Pill tone="mist">Concept, nog te bevestigen</Pill>,
        <div className="flex gap-1.5">
          <MiniBtn>Bevestigen &amp; indienen</MiniBtn>
          <MiniBtn variant="ghost">Aanpassen</MiniBtn>
        </div>
      )}
      {entry(
        "Do 8",
        "12:00–18:00",
        <Pill tone="sand">Vraag gesteld</Pill>,
        <>
          <div className="rounded-lg bg-sand px-2 py-1 text-[11px] text-[#4A2A12]">
            <b>Vraag van je manager:</b> Klopt de eindtijd?
          </div>
          <div>
            <MiniBtn>Aanpassen &amp; opnieuw indienen</MiniBtn>
          </div>
        </>
      )}
    </Panel>
  );
}

const FEATURES: {
  title: string;
  label: string;
  body: string;
  tile: string;
  icon: React.ReactNode;
  ui: (v: VenueData) => React.ReactNode;
}[] = [
  {
    title: "Beschikbaarheid",
    label: "Beschikbaarheid",
    body: "Medewerkers geven per dag of per shift aan of ze kunnen, net zo simpel als een datumprikker. Handig of je nu vooral in het weekend plant (café, bar) of ook doordeweeks met lunch en diner (restaurant): jij zet weken vooraf open, zodat er nooit een gat valt.",
    tile: "#F3D9B1",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
    ui: (v) => <AvailabilityUi v={v} />,
  },
  {
    title: "Rooster",
    label: "Rooster",
    body: "Beschikbaarheid staat er al naast zodra je gaat inplannen. Sleep niemand meer tussen appjes, het staat gewoon in beeld.",
    tile: "#9CCFE8",
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
    ui: (v) => <RosterUi v={v} />,
  },
  {
    title: "Teams",
    label: "Teams",
    body: "Deel medewerkers in bij bediening, keuken of bar. Handig zodra je met meerdere onderdelen tegelijk plant, zoals keuken en bediening in een restaurant: op het rooster zie je in één oogopslag wie waar hoort.",
    tile: "#CBD9B8",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5.5" />
      </>
    ),
    ui: (v) => <TeamsUi v={v} />,
  },
  {
    title: "Ruilen & overnemen",
    label: "Ruilen en overnemen",
    body: "Een medewerker kan niet meer? Die biedt de dienst aan, een collega neemt 'm over, en jij geeft (als je dat wil) nog even je akkoord.",
    tile: "#E9A5B5",
    icon: <path d="M7 7h11l-3-3M17 17H6l3 3" />,
    ui: (v) => <SwapUi v={v} />,
  },
  {
    title: "Uren",
    label: "Uren",
    body: "Gewerkte uren vullen zich deels vanzelf in op basis van het rooster. Medewerkers bevestigen, jij keurt goed of stuurt terug met een vraag.",
    tile: "#F3D9B1",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    ui: (v) => <HoursUi v={v} />,
  },
];

export default function FeatureFlipCards({
  bodies,
  venue = "horeca",
}: {
  bodies?: Record<string, string>;
  venue?: Venue;
}) {
  const v = VENUES[venue];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <div key={f.title} className="flip">
          <input type="checkbox" aria-label={`Bekijk ${f.label} in de app`} />
          <div className="flip-inner">
            <div className="flip-face flip-front flex flex-col gap-3.5 bg-white p-8">
              <div
                className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px]"
                style={{ backgroundColor: f.tile }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E3326" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-display text-2xl font-bold">{f.title}</h3>
              <p className="flex-1 text-base leading-relaxed text-ink/70">{bodies?.[f.title] ?? f.body}</p>
              <div
                className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2.5 text-sm font-bold"
                style={{ backgroundColor: f.tile }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3326" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
                </svg>
                Bekijk in de app
              </div>
            </div>
            <div className="flip-face flip-back flex flex-col gap-3 p-5" style={{ backgroundColor: f.tile }}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-[19px] font-bold">{f.title}</div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">In de app</span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">{f.ui(v)}</div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold">↺ Klik om terug te draaien</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
