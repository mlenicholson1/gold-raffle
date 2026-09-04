import { STATIONS, STATION_LABELS, type Progress } from "@/lib/visitor";

export default function ProgressTracker({ progress }: { progress: Progress }) {
  return (
    <div className="w-full">
      <div className="flex justify-center gap-3">
        {STATIONS.map((station) => {
          const collected = progress.stations[station];
          return (
            <div
              key={station}
              className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold ${
                collected
                  ? "border-yellow-500 bg-yellow-400 text-yellow-950"
                  : "border-slate-700 bg-slate-800 text-slate-700"
              }`}
              aria-label={`${STATION_LABELS[station]}: ${collected ? "collected" : "not collected"}`}
            >
              {collected ? "★" : ""}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-slate-400">
        {progress.count} of {progress.total} tokens collected
      </p>
    </div>
  );
}
