// Simple K-Means over 2D points (lon, lat). Standardizes internally to match the
// notebook's StandardScaler. Returns labels, centroids (geographic), and inertia.

export type KMeansResult = {
  labels: number[];
  centroids: [number, number][]; // in original (lon, lat) coords
  inertia: number;
  iterations: number;
};

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function kmeans(
  points: [number, number][],
  k: number,
  { maxIter = 100, seed = 42, tol = 1e-6 } = {}
): KMeansResult {
  const n = points.length;
  if (n === 0 || k <= 0) {
    return { labels: [], centroids: [], inertia: 0, iterations: 0 };
  }
  // Standardize
  let mx = 0, my = 0;
  for (const [x, y] of points) { mx += x; my += y; }
  mx /= n; my /= n;
  let sx = 0, sy = 0;
  for (const [x, y] of points) { sx += (x - mx) ** 2; sy += (y - my) ** 2; }
  sx = Math.sqrt(sx / n) || 1;
  sy = Math.sqrt(sy / n) || 1;
  const scaled = points.map(([x, y]) => [(x - mx) / sx, (y - my) / sy] as [number, number]);

  // k-means++ init
  const rng = seededRand(seed);
  const centroids: [number, number][] = [];
  centroids.push(scaled[Math.floor(rng() * n)]);
  for (let i = 1; i < k; i++) {
    const dists = scaled.map((p) => {
      let best = Infinity;
      for (const c of centroids) {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
        if (d < best) best = d;
      }
      return best;
    });
    const total = dists.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let idx = 0;
    for (let j = 0; j < n; j++) {
      r -= dists[j];
      if (r <= 0) { idx = j; break; }
    }
    centroids.push(scaled[idx]);
  }

  const labels = new Array<number>(n).fill(0);
  let inertia = 0;
  let iter = 0;
  for (; iter < maxIter; iter++) {
    // Assign
    inertia = 0;
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const dx = scaled[i][0] - centroids[c][0];
        const dy = scaled[i][1] - centroids[c][1];
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = c; }
      }
      labels[i] = best;
      inertia += bd;
    }
    // Update
    const sum = Array.from({ length: k }, () => [0, 0, 0]); // sx, sy, count
    for (let i = 0; i < n; i++) {
      const l = labels[i];
      sum[l][0] += scaled[i][0];
      sum[l][1] += scaled[i][1];
      sum[l][2]++;
    }
    let shift = 0;
    for (let c = 0; c < k; c++) {
      if (sum[c][2] === 0) continue;
      const nx = sum[c][0] / sum[c][2];
      const ny = sum[c][1] / sum[c][2];
      shift += (nx - centroids[c][0]) ** 2 + (ny - centroids[c][1]) ** 2;
      centroids[c] = [nx, ny];
    }
    if (shift < tol) break;
  }
  // Unscale centroids
  const geo = centroids.map(([x, y]) => [x * sx + mx, y * sy + my] as [number, number]);
  return { labels, centroids: geo, inertia, iterations: iter + 1 };
}
