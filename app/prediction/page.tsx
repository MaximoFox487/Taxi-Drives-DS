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
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MODEL_METRICS = [
  { model: "Linear Regression", mae: 18.41, rmse: 24.11, r2: 0.1361 },
  { model: "Random Forest", mae: 17.6, rmse: 23.25, r2: 0.1966 },
  { model: "Gradient Boosting", mae: 17.36, rmse: 23.07, r2: 0.2093 },
];

const ABLATION = [
  { stage: "Solo distancia", r2: 0.0892 },
  { stage: "+ hora/día", r2: 0.1156 },
  { stage: "+ rush interact.", r2: 0.1321 },
  { stage: "+ cíclico", r2: 0.1458 },
  { stage: "+ origen lat/lon", r2: 0.1689 },
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
        <h1 className="text-xl font-semibold">Predicción de tiempo de viaje</h1>
        <p className="text-muted text-sm">
          Resultados entrenados en el notebook sobre {14953} viajes extraídos. A continuación puedes
          experimentar con un predictor interactivo calibrado al modelo Gradient Boosting ganador.
        </p>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Rendimiento de los modelos</div>
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
          <div className="card-title">Ablación — ganancia de R² por feature</div>
          <AblationChart data={ABLATION} />
          <p className="text-xs text-muted mt-2">
            La distancia explica el ~9% de la varianza; el feature engineering (cíclico, interacción
            rush, cluster) añade casi otro 10% para llegar al R² ≈ 0.21 final.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Predictor interactivo</div>
        <p className="text-xs text-muted mb-3">
          Haz click en el mapa para colocar el origen (verde) o destino (rojo). Ajusta la hora y el
          día de la semana para ver cómo cambia la predicción.
        </p>
        <div className="grid md:grid-cols-[2fr_1fr] gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <button
                className={`btn ${mode === "origin" ? "btn-primary" : ""}`}
                onClick={() => setMode("origin")}
              >
                📍 Colocar origen
              </button>
              <button
                className={`btn ${mode === "dest" ? "btn-primary" : ""}`}
                onClick={() => setMode("dest")}
              >
                🎯 Colocar destino
              </button>
              <button
                className="btn ml-auto"
                onClick={() => {
                  setOrigin(null);
                  setDest(null);
                }}
              >
                Limpiar
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
                <label className="text-xs text-muted">Hora de salida</label>
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
              <label className="text-xs text-muted block mb-1">Día de la semana</label>
              <select
                className="input w-full"
                value={dow}
                onChange={(e) => setDow(Number(e.target.value))}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                    {i === 5 || i === 6 ? " (fin de semana)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-panel2 border border-accent/50 rounded-xl p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted">Predicción</div>
              {result ? (
                <>
                  <div className="text-4xl font-semibold text-accent">
                    {result.dur.toFixed(1)}
                    <span className="text-base text-muted ml-1">min</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-bg/40 rounded-md p-2">
                      <div className="text-muted">Distancia</div>
                      <div className="font-mono">{result.dist.toFixed(2)} km</div>
                    </div>
                    <div className="bg-bg/40 rounded-md p-2">
                      <div className="text-muted">Velocidad est.</div>
                      <div className="font-mono">{result.speed.toFixed(1)} km/h</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted leading-snug">
                    Intervalo ±MAE (17.36 min): <span className="font-mono">{Math.max(1, result.dur - 17.36).toFixed(1)} – {(result.dur + 17.36).toFixed(1)} min</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted">Coloca origen y destino en el mapa.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Importancia de features (Random Forest)</div>
        <FeatureImportanceChart data={FEAT_IMP} />
        <p className="text-xs text-muted mt-2">
          La distancia domina con ~55% de la importancia; las variables temporales (hora, hora punta,
          interacción dist×rush) añaden contexto sobre la congestión.
        </p>
      </section>
    </div>
  );
}
