"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { kmeans } from "@/lib/kmeans";

const ClusterMap = dynamic(() => import("@/components/ClusterMap"), { ssr: false });

function periodFilter(h: number, period: string) {
  switch (period) {
    case "morning_rush": return h >= 6 && h < 10;
    case "midday": return h >= 10 && h < 16;
    case "evening_rush": return h >= 16 && h < 20;
    case "night": return h >= 20;
    case "late_night": return h < 6;
    default: return true;
  }
}

const PERIODS = [
  { v: "all", label: "Todo el día" },
  { v: "morning_rush", label: "Hora punta AM (6–10h)" },
  { v: "midday", label: "Mediodía (10–16h)" },
  { v: "evening_rush", label: "Hora punta PM (16–20h)" },
  { v: "night", label: "Noche (20–24h)" },
  { v: "late_night", label: "Madrugada (0–6h)" },
];

export default function ClustersPage() {
  const [sample, setSample] = useState<[number, number, number][]>([]);
  const [k, setK] = useState(8);
  const [period, setPeriod] = useState("all");
  const [ts, setTs] = useState(0);

  useEffect(() => {
    fetch("/data/sample_points.json")
      .then((r) => r.json())
      .then((d: [number, number, number][]) => setSample(d));
  }, []);

  const filtered = useMemo(
    () => sample.filter(([, , h]) => periodFilter(h, period)),
    [sample, period]
  );

  const { labels, centroids, iterations, inertia, ms } = useMemo(() => {
    if (!filtered.length) return { labels: [], centroids: [] as [number, number][], iterations: 0, inertia: 0, ms: 0 };
    const t0 = performance.now();
    const r = kmeans(filtered.map(([lon, lat]) => [lon, lat]), k, { seed: 42 });
    return { ...r, ms: performance.now() - t0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, k, ts]);

  const clusterSizes = useMemo(() => {
    const counts = new Array(k).fill(0);
    labels.forEach((l) => counts[l]++);
    return counts;
  }, [labels, k]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Clustering de hotspots (K-Means)</h1>
        <p className="text-muted text-sm">
          K-Means ejecutado en el navegador sobre una muestra de {sample.length.toLocaleString()} puntos GPS.
          Los puntos se estandarizan (equivalente a <code>StandardScaler</code>) y se inicializan con k-means++.
          Observa cómo los centroides se desplazan al cambiar el período del día (dinámica de la demanda).
        </p>
      </div>

      <div className="card">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-muted">Número de clusters K</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={3}
                max={12}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-[#ffb020]"
              />
              <span className="font-mono text-lg text-accent w-6 text-right">{k}</span>
            </div>
            <div className="text-[11px] text-muted">Óptimo del notebook: K=8</div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Período</label>
            <select
              className="input w-full"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted space-y-1">
            <div>Puntos: <span className="text-text font-mono">{filtered.length}</span></div>
            <div>Iteraciones: <span className="text-text font-mono">{iterations}</span></div>
            <div>Inercia (SSE): <span className="text-text font-mono">{inertia.toFixed(2)}</span></div>
            <div>Tiempo: <span className="text-text font-mono">{ms.toFixed(1)} ms</span></div>
          </div>
          <button className="btn btn-primary" onClick={() => setTs(Date.now())}>
            ↻ Recalcular (nueva semilla)
          </button>
        </div>
      </div>

      <ClusterMap points={filtered} labels={labels} centroids={centroids} />

      <div className="card">
        <div className="card-title">Tamaño de cada cluster</div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {clusterSizes.map((n, i) => (
            <div key={i} className="bg-panel2 border border-border rounded-md p-2 text-center">
              <div className="text-[10px] text-muted">C{i}</div>
              <div
                className="w-full h-1 rounded-full my-1"
                style={{
                  background: [
                    "#ffb020", "#60a5fa", "#a78bfa", "#f472b6", "#22c55e",
                    "#f97316", "#06b6d4", "#eab308", "#ef4444", "#14b8a6",
                  ][i % 10],
                }}
              />
              <div className="text-sm font-mono">{n}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">
          Migración temporal observada en el notebook: los centroides se desplazan ~1.2 km entre períodos consecutivos,
          con un pico de ~1.8 km entre la hora punta AM y el mediodía (demanda desplazándose de zonas residenciales a
          comerciales).
        </p>
      </div>
    </div>
  );
}
