// The live, in-person Vegas Gold Call raffle draw happens twice a day at the booth.
// This is display-only scheduling info - it has no bearing on token eligibility.
const DRAW_TIMES = [
  { hour: 10, minute: 30, label: "10:30am" },
  { hour: 15, minute: 0, label: "3pm" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Given a reference time (e.g. when a visitor collected their first chip), works out
// which draw slot that moment falls into and returns a display string like
// "10:30am, Monday 19 October (tomorrow)".
export function getNextVegasFixDraw(referenceTime: Date = new Date()): string {
  const referenceMinutes = referenceTime.getHours() * 60 + referenceTime.getMinutes();

  let drawDate = referenceTime;
  let label: string = DRAW_TIMES[0].label;
  let matched = false;

  for (const draw of DRAW_TIMES) {
    const drawMinutes = draw.hour * 60 + draw.minute;
    if (referenceMinutes < drawMinutes) {
      label = draw.label;
      matched = true;
      break;
    }
  }

  if (!matched) {
    // Past every draw slot for that day - roll to tomorrow's first draw.
    drawDate = new Date(
      referenceTime.getFullYear(),
      referenceTime.getMonth(),
      referenceTime.getDate() + 1
    );
    label = DRAW_TIMES[0].label;
  }

  const dateLabel = drawDate.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const now = new Date();
  const dayDiff = Math.round(
    (startOfDay(drawDate).getTime() - startOfDay(now).getTime()) / 86_400_000
  );

  const relative = dayDiff === 0 ? " (today)" : dayDiff === 1 ? " (tomorrow)" : "";

  return `${label}, ${dateLabel}${relative}`;
}
