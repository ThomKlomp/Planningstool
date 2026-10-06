// Voorbeeldgegevens voor de rooster-voorbeelden op de landingspagina's
// (hero, kaartjes en demo). "horeca" is de standaard (restaurant: bediening en
// keuken). "cafe" is voor cafés, kroegen en bars: teams Bar en Zaal en
// avonddiensten die tot in de nacht doorlopen. De opmaak is overal gelijk,
// alleen deze gegevens verschillen.
export type Venue = "horeca" | "cafe";

export type VenueData = {
  /** Namen van de twee teams in de voorbeelden (eerste = blauw, tweede = oranje). */
  teamA: string;
  teamB: string;
  /** Functies die in de voorbeelden voorkomen. */
  chef: string;
  afwas: string;
  kok: string;
  /** Avonddienst en late dienst als [begin, eind]. */
  eve: [string, string];
  late: [string, string];
  /** Dienstsjablonen in de demo. */
  templates: { id: string; name: string; startTime: string; endTime: string }[];
};

export const VENUES: Record<Venue, VenueData> = {
  horeca: {
    teamA: "Bediening",
    teamB: "Keuken",
    chef: "Chef",
    afwas: "Afwas",
    kok: "Kok",
    eve: ["17:00", "23:00"],
    late: ["17:00", "23:00"],
    templates: [
      { id: "middag", name: "Middagshift", startTime: "12:00", endTime: "18:00" },
      { id: "avond", name: "Avondshift", startTime: "17:00", endTime: "23:00" },
    ],
  },
  cafe: {
    teamA: "Bar",
    teamB: "Zaal",
    chef: "Hoofd zaal",
    afwas: "Glazen",
    kok: "Terras",
    eve: ["17:00", "01:00"],
    late: ["20:00", "02:00"],
    templates: [
      { id: "middag", name: "Middagshift", startTime: "12:00", endTime: "18:00" },
      { id: "avond", name: "Avondshift", startTime: "17:00", endTime: "01:00" },
      { id: "nacht", name: "Nachtshift", startTime: "20:00", endTime: "02:00" },
    ],
  },
};

/** "17:00","23:00" → "17:00–23:00" */
export const range = ([a, b]: [string, string]) => `${a}–${b}`;
/** "17:00","01:00" → "17–01" (compact, zoals in de kaartjes) */
export const shortRange = ([a, b]: [string, string]) => `${Number(a.slice(0, 2))}–${b.slice(0, 2)}`;
