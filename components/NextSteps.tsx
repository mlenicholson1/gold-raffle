import { STATIONS, STATION_LABELS, STATION_DESCRIPTORS, type Progress } from "@/lib/visitor";
import { DRAW_SLOTS, getDrawSlot } from "@/lib/vegasFixSchedule";

export default function NextSteps({
  progress,
  registeredAt,
}: {
  progress: Progress;
  registeredAt: string;
}) {
  const remaining = STATIONS.filter((station) => !progress.stations[station]);
  // Locked to the draw slot active when the visitor collected their first chip,
  // not recalculated against "now" every time this renders. Entries carry
  // forward into every draw from that point on, not just the next one.
  const entrySlot = getDrawSlot(new Date(registeredAt));
  const upcomingDraws = DRAW_SLOTS.filter((slot) => slot.date.getTime() >= entrySlot.date.getTime());

  return (
    <div className="mt-6 space-y-2 rounded-lg border border-[#EADFC0] bg-[#FBF3E1] p-4 text-left text-base text-gray-600">
      <p className="font-semibold text-gray-900">
        {progress.complete
          ? `All ${progress.total} chips collected!`
          : `${progress.count} of ${progress.total} chips collected - each is a chance to win a 1oz gold coin.`}
      </p>
      {remaining.length > 0 && (
        <ul className="space-y-1">
          {remaining.map((station) => (
            <li key={station}>
              <span className="font-semibold text-gray-900">{STATION_LABELS[station]}:</span>{" "}
              {STATION_DESCRIPTORS[station]}
            </li>
          ))}
        </ul>
      )}
      <div>
        <p className="font-medium text-gray-900">
          {upcomingDraws.length > 1
            ? "You're entered in every remaining draw:"
            : "You're entered in the final draw:"}
        </p>
        <ul className="mt-1 space-y-0.5">
          {upcomingDraws.map((slot) => (
            <li key={slot.date.toISOString()}>{slot.label}</li>
          ))}
        </ul>
      </div>
      <p className="text-gray-600">
        Please come back to the Lounge 5 minutes before each one to see if you&rsquo;ve won!
      </p>
    </div>
  );
}
