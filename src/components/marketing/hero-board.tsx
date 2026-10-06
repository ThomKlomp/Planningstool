// Bewegende UI in de hero van de homepage: het rooster zoals het in de app
// staat (per dag een kolom, binnen elke dag per team, naam met de tijden
// eronder). Puur CSS-animatie (zie .ui-* in globals.css): geen state, geen
// scripts. Bij "minder beweging" staat alles stil.
import { VENUES, range, type Venue } from "./venue";

const BLUE = "#6E9BD1";
const ORNG = "#E0A458";

type ShiftState = "n" | "offer" | "taken" | "open";

function Shift({
  name,
  time,
  role,
  state = "n",
  note,
  k,
}: {
  name: string;
  time: string;
  role?: string;
  state?: ShiftState;
  note?: string;
  k?: number;
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
    <div
      className={`${k !== undefined ? "ui-pop " : ""}flex min-w-0 flex-col gap-px rounded-[9px] px-[7px] py-1.5 text-[11px] text-ink ${tone}`}
      style={k !== undefined ? { animationDelay: `${(k * 0.08).toFixed(2)}s` } : undefined}
    >
      <div className="font-bold leading-tight">
        {name}
        {role ? <span className="font-normal text-ink/60"> · {role}</span> : null}
      </div>
      <div className="leading-tight text-ink/60">{time}</div>
      {note ? <div className="font-bold leading-tight text-terra">{note}</div> : null}
    </div>
  );
}

function TeamGroup({ team, first = false, children }: { team: string; first?: boolean; children: React.ReactNode }) {
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

function DayCol({
  label,
  today = false,
  avail,
  children,
}: {
  label: string;
  today?: boolean;
  avail: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-[#F4F8F0] p-2">
      <div
        className={`font-display text-[13px] font-bold ${
          today ? "self-start rounded-lg bg-ink px-2 py-0.5 text-paper" : ""
        }`}
      >
        {label}
      </div>
      {children}
      <div className="rounded-[9px] border-[1.5px] border-dashed border-ink/30 py-1 text-center text-[10px] font-bold text-ink/55">
        + Shift
      </div>
      <div className="text-[10px] text-ink/55">{avail} beschikbaar</div>
    </div>
  );
}

export default function HeroBoard({ venue = "horeca" }: { venue?: Venue }) {
  const v = VENUES[venue];
  const DAY = "12:00–18:00";
  const EVE = range(v.eve);
  const LATE = range(v.late);
  const SWAP = venue === "cafe" ? EVE : DAY; // dienst in het ruilverzoek
  return (
    <div className="min-w-0 rounded-[28px] bg-white p-5 shadow-[0_30px_50px_-30px_rgba(30,51,38,0.55)]">
      <div className="mb-3.5 flex items-center gap-2 font-display text-xl font-bold">
        Rooster
        <span className="font-body text-xs font-medium text-ink/55">Café De Pub</span>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-base font-bold">
          <span className="font-body text-[13px] font-medium text-ink/55">← Vorige week</span>
          5 – 11 okt
          <span className="font-body text-[13px] font-medium text-ink/55">Volgende week →</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#CBD9B8] px-2.5 py-1 text-[11px] font-bold text-ink">
            Gepubliceerd
          </span>
          <span className="relative inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-awning">
            <span className="relative h-2 w-2">
              <i className="ui-ping absolute inset-0 block rounded-full bg-awning" />
              <i className="absolute inset-0 block rounded-full bg-awning" />
            </span>
            LIVE
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[460px] grid-cols-5 gap-2">
          <DayCol label="Di 6" avail={5}>
            <TeamGroup team={v.teamA} first>
              <Shift name="Julia Bakker" time={DAY} k={1} />
            </TeamGroup>
            <TeamGroup team={v.teamB}>
              <Shift name="Elif Yildiz" time={EVE} role={v.chef} k={2} />
            </TeamGroup>
          </DayCol>
          <DayCol label="Wo 7" today avail={4}>
            <TeamGroup team={v.teamA} first>
              <div className="relative h-[62px]">
                <div className="ui-toast-a absolute inset-0">
                  <Shift name="Tom Visser" time={SWAP} state="offer" note="Aangeboden" />
                </div>
                <div className="ui-toast-b absolute inset-0">
                  <Shift name="Julia Bakker" time={SWAP} state="taken" note="Overgenomen van Tom" />
                </div>
              </div>
              <Shift name="Nina de Boer" time={EVE} k={4} />
            </TeamGroup>
            <TeamGroup team={v.teamB}>
              <Shift name="Ahmed El Idrissi" time={DAY} k={5} />
            </TeamGroup>
          </DayCol>
          <DayCol label="Do 8" avail={5}>
            <TeamGroup team={v.teamA} first>
              <Shift name="Julia Bakker" time={EVE} k={6} />
            </TeamGroup>
            <TeamGroup team={v.teamB}>
              <Shift name="Ahmed El Idrissi" time={DAY} role={v.afwas} k={7} />
            </TeamGroup>
          </DayCol>
          <DayCol label="Vr 9" avail={3}>
            <TeamGroup team={v.teamA} first>
              <Shift name="Tom Visser" time={LATE} k={8} />
              <Shift name="Nog niet toegewezen" time={LATE} state="open" k={9} />
            </TeamGroup>
            <TeamGroup team={v.teamB}>
              <Shift name="Elif Yildiz" time={LATE} k={10} />
            </TeamGroup>
          </DayCol>
          <DayCol label="Za 10" avail={5}>
            <TeamGroup team={v.teamA} first>
              <Shift name="Nina de Boer" time={DAY} k={11} />
              <Shift name="Julia Bakker" time={LATE} k={12} />
            </TeamGroup>
            <TeamGroup team={v.teamB}>
              <Shift name="Ahmed El Idrissi" time={LATE} k={13} />
            </TeamGroup>
          </DayCol>
        </div>
      </div>

      <div className="relative mt-3.5 h-14">
        <div className="ui-toast-a absolute inset-0 flex items-center gap-2.5 rounded-2xl bg-sand px-3 text-xs text-[#4A2A12]">
          <span className="flex-1">
            <b>Ruilverzoek:</b> Tom wil wo 7 okt, {SWAP} overgeven, Julia neemt het over
          </span>
          <span className="ui-press inline-block rounded-[10px] bg-terra px-3 py-2 text-xs font-bold text-white">
            Goedkeuren
          </span>
        </div>
        <div className="ui-toast-b absolute inset-0 flex items-center gap-2 rounded-2xl bg-[#CBD9B8] px-3 text-xs font-bold text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5 9-10" />
          </svg>
          Goedgekeurd, het rooster is bijgewerkt
        </div>
        <svg
          className="ui-cursor absolute right-6 top-[26px] drop-shadow-md"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M5 3l14 8-6 2-3 6z" fill="#FFFFFF" stroke="#1E3326" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
