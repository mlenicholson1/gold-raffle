// The live, in-person Vegas Gold Call raffle draw happens twice a day at the booth.
// This scheduling info determines which draw a visitor's chips count toward - it has
// no bearing on token eligibility itself.
const DRAW_TIMES = [
  { hour: 10, minute: 30, label: "10:30am" },
  { hour: 15, minute: 0, label: "3pm" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type DrawSlot = {
  /** Exact target draw date/time. */
  date: Date;
  /** e.g. "10:30am, Monday 19 October" */
  label: string;
  /** Stable, sortable, groupable identifier for this slot. */
  key: string;
};

// Given a reference time (e.g. when a visitor collected their first chip), works out
// which draw slot that moment falls into.
export function getDrawSlot(referenceTime: Date = new Date()): DrawSlot {
  const referenceMinutes = referenceTime.getHours() * 60 + referenceTime.getMinutes();

  let drawDateBase = referenceTime;
  let chosen = DRAW_TIMES[0];
  let matched = false;

  for (const draw of DRAW_TIMES) {
    const drawMinutes = draw.hour * 60 + draw.minute;
    if (referenceMinutes < drawMinutes) {
      chosen = draw;
      matched = true;
      break;
    }
  }

  if (!matched) {
    // Past every draw slot for that day - roll to tomorrow's first draw.
    drawDateBase = new Date(
      referenceTime.getFullYear(),
      referenceTime.getMonth(),
      referenceTime.getDate() + 1
    );
    chosen = DRAW_TIMES[0];
  }

  const date = new Date(
    drawDateBase.getFullYear(),
    drawDateBase.getMonth(),
    drawDateBase.getDate(),
    chosen.hour,
    chosen.minute,
    0,
    0
  );

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return {
    date,
    label: `${chosen.label}, ${dateLabel}`,
    key: date.toISOString(),
  };
}

// Display string for a visitor, e.g. "10:30am, Monday 19 October (tomorrow)".
export function getNextVegasFixDraw(referenceTime: Date = new Date()): string {
  const slot = getDrawSlot(referenceTime);
  const now = new Date();
  const dayDiff = Math.round(
    (startOfDay(slot.date).getTime() - startOfDay(now).getTime()) / 86_400_000
  );
  const relative = dayDiff === 0 ? " (today)" : dayDiff === 1 ? " (tomorrow)" : "";
  return `${slot.label}${relative}`;
}
