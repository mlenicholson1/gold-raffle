import { STATIONS, STATION_LABELS, STATION_DESCRIPTORS, type Progress } from "@/lib/visitor";
import { getNextVegasFixDraw } from "@/lib/vegasFixSchedule";

export default function NextSteps({
  progress,
  registeredAt,
}: {
  progress: Progress;
  registeredAt: string;
}) {
  const remaining = STATIONS.filter((station) => !progress.stations[station]);
  // Locked to the draw slot active when the visitor collected their first chip,
  // not recalculated against "now" every time this renders.
  const nextDraw = getNextVegasFixDraw(new Date(registeredAt));

  return (
    <div className="mt-6 space-y-2 rounded-lg border border-[#EADFC0] bg-[#FBF3E1] p-4 text-left text-sm text-gray-600">
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
      <p className="font-medium text-gray-900">Draw at {nextDraw}.</p>
    </div>
  );
}
