// The live, in-person Las Vegas Gold Call raffle draw happens at four fixed moments
// across the show - not a simple "twice a day" pattern, since the first and
// last days only get one draw each. This scheduling info determines which
// draw a visitor's chips count toward - it has no bearing on token eligibility
// itself.
//
// These are built with Date.UTC at the exact UTC-equivalent of each time as
// stated in PDT in the Official Rules (UTC-7 during daylight saving, which is
// in effect across the whole show). Using `new Date(year, month, day, hour)`
// instead would construct the date in the SERVER's local timezone - Vercel's
// Node runtime defaults to UTC, so "15:00" would silently mean 3pm UTC (8am
// PDT) rather than 3pm PDT, shifting every visitor's draw-slot cutoff about
// seven hours earlier than intended and misclassifying most same-day entries
// into the following slot.
export const DRAW_SLOTS = [
  { date: new Date(Date.UTC(2026, 9, 19, 22, 0)), label: "3pm, Mon 19 October" },
  { date: new Date(Date.UTC(2026, 9, 20, 17, 30)), label: "10:30am, Tues 20 October" },
  { date: new Date(Date.UTC(2026, 9, 20, 22, 0)), label: "3pm, Tues 20 October" },
  { date: new Date(Date.UTC(2026, 9, 21, 17, 30)), label: "10:30am, Weds 21 October" },
];

export type DrawSlot = {
  /** Exact target draw date/time. */
  date: Date;
  /** e.g. "10:30am, Tues 20 October" */
  label: string;
  /** Stable, sortable, groupable identifier for this slot. */
  key: string;
};

// Registering this close to a draw (or after it's already started) leaves no
// realistic time to collect chips before it runs, so those sign-ups roll
// forward to the next draw instead of the one that's about to happen.
const CUTOFF_MS = 5 * 60 * 1000;

// Given a reference time (e.g. when a visitor collected their first chip),
// works out which of the four fixed draw slots that moment counts toward -
// whichever one comes next, as long as it's more than 5 minutes away. Past
// the final slot (plus its cutoff), everything counts toward it.
export function getDrawSlot(referenceTime: Date = new Date()): DrawSlot {
  const upcoming = DRAW_SLOTS.find(
    (slot) => slot.date.getTime() - referenceTime.getTime() > CUTOFF_MS
  );
  const chosen = upcoming ?? DRAW_SLOTS[DRAW_SLOTS.length - 1];

  return {
    date: chosen.date,
    label: chosen.label,
    key: chosen.date.toISOString(),
  };
}
