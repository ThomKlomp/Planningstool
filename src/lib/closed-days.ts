/**
 * Bepaalt of een dag gesloten is: ofwel omdat hij als losse datum is
 * aangemerkt (bv. een feestdag), ofwel omdat de weekdag structureel dicht
 * is (bv. elke maandag).
 */
export function isDateClosed(
  date: Date,
  closedWeekdays: number[],
  closedDateStrings: string[]
): boolean {
  return closedWeekdays.includes(date.getDay()) || closedDateStrings.includes(date.toDateString());
}
