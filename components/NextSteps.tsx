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
    <div className="mt-6 space-y-3 rounded-lg border border-[#EADFC0] bg-[#FBF3E1] p-4 text-left text-sm text-gray-600">
      <p className="font-semibold text-gray-900">
        {progress.complete
          ? `All ${progress.total} chips collected!`
          : `${progress.count} chip${progress.count === 1 ? "" : "s"} collected. ${remaining.length} more to go.`}
      </p>
      <p>
        Each chip gives you another chance to win a 1 oz gold coin. Collect all {progress.total}{" "}
        chips for {progress.total} chances to win.
      </p>
      {remaining.length > 0 && (
        <div>
          <p className="font-medium text-gray-900">Here&rsquo;s how to earn your remaining chips:</p>
          <ul className="mt-1 space-y-2">
            {remaining.map((station) => (
              <li key={station}>
                <span className="font-semibold text-gray-900">{STATION_LABELS[station]}</span>
                <br />
                {STATION_DESCRIPTORS[station]}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="font-medium text-gray-900">
        The live Las Vegas Gold Call draw takes place here at the booth at {nextDraw}.
      </p>
    </div>
  );
}
