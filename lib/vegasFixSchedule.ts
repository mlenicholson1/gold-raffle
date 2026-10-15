// The live, in-person Las Vegas Gold Call raffle draw happens at four fixed moments
// across the show - not a simple "twice a day" pattern, since the first and
// last days only get one draw each. This scheduling info determines which
// draw a visitor's chips count toward - it has no bearing on token eligibility
// itself.
export const DRAW_SLOTS = [
  { date: new Date(2026, 9, 19, 15, 0), label: "3pm, Monday, October 19" },
  { date: new Date(2026, 9, 20, 10, 30), label: "10:30am, Tuesday, October 20" },
  { date: new Date(2026, 9, 20, 15, 0), label: "3pm, Tuesday, October 20" },
  { date: new Date(2026, 9, 21, 10, 30), label: "10:30am, Wednesday, October 21" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type DrawSlot = {
  /** Exact target draw date/time. */
  date: Date;
  /** e.g. "10:30am, Tuesday, October 20" */
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

// Display string for a visitor, e.g. "10:30am, Tuesday, October 20 (today)".
export function getNextVegasFixDraw(referenceTime: Date = new Date()): string {
  const slot = getDrawSlot(referenceTime);
  const now = new Date();
  const dayDiff = Math.round(
    (startOfDay(slot.date).getTime() - startOfDay(now).getTime()) / 86_400_000
  );
  const relative = dayDiff === 0 ? " (today)" : dayDiff === 1 ? " (tomorrow)" : "";
  return `${slot.label}${relative}`;
}
