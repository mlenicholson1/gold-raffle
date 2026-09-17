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
                  ? "border-[#a6822b] bg-[#a6822b] text-white"
                  : "border-gray-200 bg-[#FBF3E1] text-transparent"
              }`}
              aria-label={`${STATION_LABELS[station]}: ${collected ? "collected" : "not collected"}`}
            >
              {collected ? "★" : ""}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-gray-500">
        {progress.count} of {progress.total} tokens collected
      </p>
    </div>
  );
}
