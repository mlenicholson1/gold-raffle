export const STATIONS = ["register", "purchase", "goldbar", "vegasfix"] as const;
export type Station = (typeof STATIONS)[number];

export const STATION_LABELS: Record<Station, string> = {
  register: "Registration",
  purchase: "Chip Collection",
  goldbar: "Gold Bar Photo",
  vegasfix: "Vegas Gold Call",
};

export const STATION_DESCRIPTORS: Record<Station, string> = {
  register: "Pick up a protein bar from the gold vault to up your chip count even further.",
  purchase: "Pop over to the Chip Collection screen to check out Gold as a Service.",
  goldbar: "Head over to the gold bar, pick it up for a photo moment, and collect your next chip.",
  vegasfix: "Head to the Vegas Gold Call screen to learn about the gold market.",
};

export type Progress = {
  count: number;
  total: number;
  stations: Record<Station, boolean>;
  complete: boolean;
};

export function buildProgress(collectedStations: string[]): Progress {
  const collected = new Set(collectedStations);
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
