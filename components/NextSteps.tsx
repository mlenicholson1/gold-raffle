import { STATIONS, STATION_DESCRIPTORS, type Progress } from "@/lib/visitor";
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
    <div className="mt-6 space-y-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-left text-sm text-slate-300">
      <p>
        <span className="font-semibold text-slate-100">The live Vegas Gold Call moment</span> takes
        place at the booth at 10:30am and 3pm today.
      </p>
      <p className="font-medium text-slate-100">
        You&rsquo;re entered into the Vegas Gold Call draw at {nextDraw}
        {remaining.length > 0
          ? " - collect your remaining chips before then to make them count toward it."
          : " with all your chips counted toward it."}
      </p>
      {remaining.length > 0 && (
        <div>
          <p className="font-medium text-slate-100">
            Fancy more entries? A few more chips are still up for grabs:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {remaining.map((station) => (
              <li key={station}>{STATION_DESCRIPTORS[station]}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
