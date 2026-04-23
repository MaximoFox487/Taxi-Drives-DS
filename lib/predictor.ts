// Lightweight surrogate predictor calibrated to the notebook's Gradient Boosting results
// (MAE 17.36 min, mean trip duration ~39.8 min, mean distance ~6.2 km).
// Not the real sklearn model, but preserves the same qualitative relationships
// so the demo's "predictor" is a transparent, interactive approximation.

export type PredictInput = {
  distance_km: number;     // Haversine distance between pickup and dropoff
  start_hour: number;      // 0-23
  day_of_week: number;     // 0=Mon ... 6=Sun
  origin_lon: number;
  origin_lat: number;
  dest_lon: number;
  dest_lat: number;
};

const IS_WEEKEND = (d: number) => d === 5 || d === 6;
const IS_RUSH = (h: number) => (h >= 6 && h < 10) || (h >= 16 && h < 20);

// Urban-center boost: trips closer to CBD are slower per km
function centerDensity(lon: number, lat: number) {
  const cx = 116.4074, cy = 39.9042;
  const d = Math.sqrt((lon - cx) ** 2 + (lat - cy) ** 2);
  // ~1 at center, ~0 at 0.3° away
  return Math.max(0, 1 - d / 0.3);
}

export function predictDuration(x: PredictInput) {
  const d = Math.max(0.1, x.distance_km);
  const rush = IS_RUSH(x.start_hour);
  const weekend = IS_WEEKEND(x.day_of_week);

  // Base speed (km/h) with congestion modifiers
  let speed = 18;
  if (rush) speed -= 5;
  if (weekend) speed += 3;
  if (x.start_hour >= 0 && x.start_hour < 6) speed += 6; // madrugada
  if (x.start_hour >= 22) speed += 3;

  // Center density reduces speed (more congestion downtown)
  const cOrigin = centerDensity(x.origin_lon, x.origin_lat);
  const cDest = centerDensity(x.dest_lon, x.dest_lat);
  speed -= (cOrigin + cDest) * 2.5;

  speed = Math.max(5, speed);

  let duration = (d / speed) * 60; // minutes

  // Fixed overhead (pickup + dropoff maneuvering)
  duration += 2.0;

  // Small additive rush-hour penalty that grows with distance
  if (rush) duration += 0.6 * d;

  return duration;
}

// Haversine distance in km
export function haversine(lon1: number, lat1: number, lon2: number, lat2: number) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
