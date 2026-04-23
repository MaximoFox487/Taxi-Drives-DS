"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { haversine, predictDuration } from "@/lib/predictor";
import {
  AblationChart,
  FeatureImportanceChart,
  ModelMetricsChart,
} from "@/components/Charts";

const PredictorMap = dynamic(() => import("@/components/PredictorMap"), { ssr: false });

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MODEL_METRICS = [
  { model: "Linear Regression", mae: 18.41, rmse: 24.11, r2: 0.1361 },
  { model: "Random Forest", mae: 17.6, rmse: 23.25, r2: 0.1966 },
  { model: "Gradient Boosting", mae: 17.36, rmse: 23.07, r2: 0.2093 },
];

const ABLATION = [
  { stage: "Distance only", r2: 0.0892 },
  { stage: "+ hour/day", r2: 0.1156 },
  { stage: "+ rush interact.", r2: 0.1321 },
  { stage: "+ cyclic", r2: 0.1458 },
  { stage: "+ origin lat/lon", r2: 0.1689 },
  { stage: "+ cluster id", r2: 0.1847 },
];

const FEAT_IMP = [
  { feature: "distance_km", importance: 0.55 },
  { feature: "start_hour", importance: 0.12 },
  { feature: "is_rush_hour", importance: 0.08 },
  { feature: "day_of_week", importance: 0.07 },
  { feature: "dist_x_rush", importance: 0.06 },
  { feature: "origin_lon", importance: 0.04 },
  { feature: "origin_lat", importance: 0.03 },
  { feature: "hour_sin", importance: 0.02 },
  { feature: "hour_cos", importance: 0.02 },
  { feature: "pickup_cluster", importance: 0.01 },
].reverse();

export default function PredictionPage() {
  const [origin, setOrigin] = useState<[number, number] | null>([116.3974, 39.9093]); // Tiananmen
  const [dest, setDest] = useState<[number, number] | null>([116.4846, 39.9929]); // Wangjing area
  const [mode, setMode] = useState<"origin" | "dest">("origin");
  const [hour, setHour] = useState(8);
  const [dow, setDow] = useState(0);

  const result = useMemo(() => {
    if (!origin || !dest) return null;
    const dist = haversine(origin[0], origin[1], dest[0], dest[1]);
    const dur = predictDuration({
      distance_km: dist,
      start_hour: hour,
      day_of_week: dow,
      origin_lon: origin[0],
      origin_lat: origin[1],
      dest_lon: dest[0],
      dest_lat: dest[1],
    });
    return { dist, dur, speed: (dist / dur) * 60 };
  }, [origin, dest, hour, dow]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Travel time prediction</h1>
        <p className="text-muted text-sm">
          Results trained in the notebook over {14953} extracted trips. Below you can experiment
          with an interactive predictor calibrated to the winning Gradient Boosting model.
        </p>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Model performance</div>
          <ModelMetricsChart data={MODEL_METRICS} />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            {MODEL_METRICS.map((m) => (
              <div key={m.model} className="bg-panel2 border border-border rounded-md py-2">
                <div className="text-muted">{m.model}</div>
                <div className="text-accent font-mono text-sm">R² {m.r2.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Ablation — R² gain per feature group</div>
          <AblationChart data={ABLATION} />
          <p className="text-xs text-muted mt-2">
            Distance alone explains ~9% of the variance; feature engineering (cyclic encoding, rush
            interaction, cluster id) adds another ~10% to reach the final R² ≈ 0.21.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Interactive predictor</div>
        <p className="text-xs text-muted mb-3">
          Click on the map to place the origin (green) or destination (red). Adjust the hour and day
          of the week to see how the prediction changes.
        </p>
        <div className="grid md:grid-cols-[2fr_1fr] gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <button
                className={`btn ${mode === "origin" ? "btn-primary" : ""}`}
                onClick={() => setMode("origin")}
              >
                📍 Place origin
              </button>
              <button
                className={`btn ${mode === "dest" ? "btn-primary" : ""}`}
                onClick={() => setMode("dest")}
              >
                🎯 Place destination
              </button>
              <button
                className="btn ml-auto"
                onClick={() => {
                  setOrigin(null);
                  setDest(null);
                }}
              >
                Clear
              </button>
            </div>
            <PredictorMap
              origin={origin}
              dest={dest}
              setOrigin={setOrigin}
              setDest={setDest}
              mode={mode}
            />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-muted">Departure hour</label>
                <span className="font-mono text-accent">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full accent-[#ffb020]"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Day of week</label>
              <select
                className="input w-full"
                value={dow}
                onChange={(e) => setDow(Number(e.target.value))}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                    {i === 5 || i === 6 ? " (weekend)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-panel2 border border-accent/50 rounded-xl p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted">Prediction</div>
              {result ? (
                <>
                  <div className="text-4xl font-semibold text-accent">
                    {result.dur.toFixed(1)}
                    <span className="text-base text-muted ml-1">min</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-bg/40 rounded-md p-2">
                      <div className="text-muted">Distance</div>
                      <div className="font-mono">{result.dist.toFixed(2)} km</div>
                    </div>
                    <div className="bg-bg/40 rounded-md p-2">
                      <div className="text-muted">Est. speed</div>
                      <div className="font-mono">{result.speed.toFixed(1)} km/h</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted leading-snug">
                    Interval ±MAE (17.36 min): <span className="font-mono">{Math.max(1, result.dur - 17.36).toFixed(1)} – {(result.dur + 17.36).toFixed(1)} min</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted">Place origin and destination on the map.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Feature importance (Random Forest)</div>
        <FeatureImportanceChart data={FEAT_IMP} />
        <p className="text-xs text-muted mt-2">
          Distance dominates with ~55% of the importance; temporal variables (hour, rush-hour flag,
          distance×rush interaction) add context about congestion.
        </p>
      </section>
    </div>
  );
}
