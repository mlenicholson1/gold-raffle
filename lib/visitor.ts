export const STATIONS = ["vault", "purchase", "goldbar", "vegasfix"] as const;
export type Station = (typeof STATIONS)[number];

export const STATION_LABELS: Record<Station, string> = {
  vault: "Gold Bar Vault",
  purchase: "Gold Unlocked",
  goldbar: "Gold Bar Display",
  vegasfix: "Las Vegas Gold Call",
};

export const STATION_DESCRIPTORS: Record<Station, string> = {
  vault: "Head to the gold vault and grab a protein bar to keep you fuelled while you explore.",
  purchase: "Check out the Gold Unlocked demo to see digital gold in action.",
  goldbar: "Head over to the gold bar display, pick it up for a photo moment, and collect your next chip.",
  vegasfix: "Head to the Las Vegas Gold Call screen to learn about the physical and digital gold market.",
};

export type Progress = {
  count: number;
  total: number;
  stations: Record<Station, boolean>;
  complete: boolean;
};

export function buildProgress(collectedStations: string[]): Progress {
  // Filters out any station not in the current STATIONS list (e.g. a
  // legacy "register" token from before it stopped being chip-tracked),
  // so stale rows can never inflate the count.
  const collected = new Set(
    collectedStations.filter((station): station is Station =>
      (STATIONS as readonly string[]).includes(station)
    )
  );
  const stations = Object.fromEntries(
    STATIONS.map((station) => [station, collected.has(station)])
  ) as Record<Station, boolean>;

  return {
    count: collected.size,
    total: STATIONS.length,
    stations,
    complete: collected.size >= STATIONS.length,
  };
}

export function generateCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
