export type Stats = {
  total_points: number;
  num_taxis: number;
  date_range: [string, string];
  bbox: { min_lon: number; max_lon: number; min_lat: number; max_lat: number };
  hourly: { hour: number; count: number }[];
  daily: { date: string; count: number }[];
  periods: { period: string; count: number }[];
};

export type TaxiMeta = {
  id: number;
  points: number;
  first: string;
  last: string;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export const PERIOD_LABELS: Record<string, string> = {
  late_night: "Madrugada (0–6h)",
  morning_rush: "Hora punta AM (6–10h)",
  midday: "Mediodía (10–16h)",
  evening_rush: "Hora punta PM (16–20h)",
  night: "Noche (20–24h)",
};

export const BEIJING_CENTER: [number, number] = [39.9042, 116.4074];
