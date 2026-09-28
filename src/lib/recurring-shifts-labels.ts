// Dagnamen voor terugkerende diensten. Bewust apart van recurring-shifts.ts:
// dat bestand importeert de database en mag niet in browsercode terechtkomen.
const DAY_NAMES = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

/** Weekdag (0 = zondag ... 6 = zaterdag, zoals Date.getDay()) als woord. */
export const dayName = (weekday: number) => DAY_NAMES[weekday] ?? "";

/** "zaterdagen" */
export const dayNamePlural = (weekday: number) => `${dayName(weekday)}en`;
