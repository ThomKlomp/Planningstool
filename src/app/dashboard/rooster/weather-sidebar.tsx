"use client";

import { useEffect, useState } from "react";

type Day = {
  date: string; // YYYY-MM-DD
  code: number;
  tMax: number;
  tMin: number;
  rain: number; // mm
  rainChance: number | null; // %
  wind: number; // km/u
};

type Place = { name: string; lat: number; lon: number };

const STORAGE_KEY = "rooster-weer-plaats";
const DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];

function describe(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Zonnig" };
  if (code <= 2) return { icon: "🌤️", label: "Half bewolkt" };
  if (code === 3) return { icon: "☁️", label: "Bewolkt" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Mist" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "Motregen" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", label: "Regen" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", label: "Sneeuw" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", label: "Buien" };
  if (code === 85 || code === 86) return { icon: "🌨️", label: "Sneeuwbuien" };
  if (code >= 95) return { icon: "⛈️", label: "Onweer" };
  return { icon: "🌡️", label: "Wisselend" };
}

// Korte indicatie voor het plannen van personeel (vooral terras).
function terrasHint(d: Day): { text: string; tone: string } {
  const wet = d.rain >= 1 || (d.rainChance ?? 0) >= 60;
  if (!wet && d.tMax >= 20 && d.wind < 38) return { text: "Terrasweer, druk verwacht", tone: "bg-awning/15 text-awning" };
  if (wet) return { text: "Nat, terras waarschijnlijk dicht", tone: "bg-ink/10 text-ink/70" };
  if (d.tMax < 10) return { text: "Koud, rustiger", tone: "bg-ink/10 text-ink/70" };
  return { text: "Wisselend", tone: "bg-ink/5 text-ink/60" };
}

// Haalt de plaats uit het bedrijfsadres ("Straat 1, Amsterdam" -> "Amsterdam").
function cityFromAddress(address: string | null): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return last.replace(/^\d{4}\s?[A-Za-z]{2}\s+/, "");
}

async function geocode(query: string): Promise<Place | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=nl&format=json`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results?.[0];
  return r ? { name: r.name, lat: r.latitude, lon: r.longitude } : null;
}

export default function WeatherSidebar({
  weekDates,
  defaultCity,
}: {
  weekDates: string[];
  defaultCity: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Startplaats: eerder gekozen plaats, anders de plaats uit het bedrijfsadres.
  useEffect(() => {
    let stored = "";
    try {
      stored = localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {}
    setQuery(stored || cityFromAddress(defaultCity));
  }, [defaultCity]);

  const weekKey = weekDates.join(",");

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setError("Vul een plaats in om het weer te zien.");
      setDays(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const p = place && place.name.toLowerCase() === q.toLowerCase() ? place : await geocode(q);
        if (!p) throw new Error("Plaats niet gevonden.");
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
          `&timezone=auto&past_days=7&forecast_days=16`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weer ophalen mislukt.");
        const j = await res.json();
        const all: Day[] = j.daily.time.map((t: string, i: number) => ({
          date: t,
          code: j.daily.weather_code[i],
          tMax: Math.round(j.daily.temperature_2m_max[i]),
          tMin: Math.round(j.daily.temperature_2m_min[i]),
          rain: j.daily.precipitation_sum[i] ?? 0,
          rainChance: j.daily.precipitation_probability_max?.[i] ?? null,
          wind: Math.round(j.daily.wind_speed_10m_max[i] ?? 0),
        }));
        if (cancelled) return;
        setPlace(p);
        setDays(weekDates.map((d) => all.find((x) => x.date === d) ?? null).filter(Boolean) as Day[]);
        try {
          localStorage.setItem(STORAGE_KEY, q);
        } catch {}
      } catch (e) {
        if (!cancelled) {
          setDays(null);
          setError(e instanceof Error ? e.message : "Weer ophalen mislukt.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, weekKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
        aria-expanded={open}
      >
        🌤️ Weer
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink/20 sm:bg-transparent" onClick={() => setOpen(false)} />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-line bg-paper shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-xl">Weersvoorspelling</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-2 py-1 text-ink/60 hover:bg-ink/5"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-line px-4 py-3">
          <label className="block text-xs text-ink/60">Plaats</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bijv. Amsterdam"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
          {place && !error && <p className="mt-1 text-xs text-ink/40">Weer voor {place.name}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && !days && <p className="text-sm text-ink/60">Weer laden...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {days && (
            <ul className="space-y-2">
              {days.map((d) => {
                const w = describe(d.code);
                const hint = terrasHint(d);
                const dt = new Date(`${d.date}T12:00:00`);
                return (
                  <li key={d.date} className="rounded-xl border border-line bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">
                          {DAYS[dt.getDay()]} {dt.getDate()}/{dt.getMonth() + 1}
                        </div>
                        <div className="text-xs text-ink/60">{w.label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl leading-none">{w.icon}</div>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">{d.tMax}°</span>
                          <span className="text-ink/40"> / {d.tMin}°</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-ink/60">
                      <span>💧 {d.rain.toFixed(1)} mm{d.rainChance !== null ? ` (${d.rainChance}%)` : ""}</span>
                      <span>💨 {d.wind} km/u</span>
                    </div>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${hint.tone}`}>
                      {hint.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="border-t border-line px-4 py-2 text-xs text-ink/40">
          Bron: Open-Meteo. Verwachtingen verder dan een paar dagen vooruit zijn minder betrouwbaar.
        </p>
      </aside>
    </>
  );
}
