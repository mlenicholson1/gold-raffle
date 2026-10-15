import type { Progress } from "@/lib/visitor";

export default function ProgressTracker({ progress }: { progress: Progress }) {
  return (
    <div className="w-full">
      <div className="flex justify-center gap-3">
        {Array.from({ length: progress.total }, (_, i) => {
          // Fills left to right by how many chips have been collected so
          // far, not by which specific station each one came from - so the
          // first chip collected always lights up box 1, regardless of
          // which activation a visitor happens to visit first.
          const collected = i < progress.count;
          return (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold ${
                collected
                  ? "border-[#D8AB4C] bg-[#D8AB4C] text-white"
                  : "border-gray-200 bg-[#FBF3E1] text-transparent"
              }`}
              aria-label={`Chip ${i + 1}: ${collected ? "collected" : "not collected"}`}
            >
              {collected ? "★" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
