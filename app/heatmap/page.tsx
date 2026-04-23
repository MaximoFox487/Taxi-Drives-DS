"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), { ssr: false });

function periodFor(h: number) {
  if (h < 6) return { key: "late_night", label: "Late Night" };
  if (h < 10) return { key: "morning_rush", label: "Morning Rush" };
  if (h < 16) return { key: "midday", label: "Midday" };
  if (h < 20) return { key: "evening_rush", label: "Evening Rush" };
  return { key: "night", label: "Night" };
}

export default function HeatmapPage() {
  const [hour, setHour] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [radius, setRadius] = useState(18);
  const [blur, setBlur] = useState(22);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setHour((h) => (h + 1) % 24), 1200);
    return () => clearInterval(id);
  }, [playing]);

  const period = useMemo(() => periodFor(hour), [hour]);

  return (
    <div className="space-y-4">
      <div className="flex items-end flex-wrap gap-4 justify-between">
        <div>
          <h1 className="text-xl font-semibold">Hourly density heatmap</h1>
          <p className="text-muted text-sm">
            GPS point density from the 500 taxis for the selected hour. Each slice aggregates all 7
            days of the dataset.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${playing ? "btn-primary" : ""}`}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "⏸ Pause" : "▶ Animate 24h"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end mb-4">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-sm text-muted">Hour</label>
              <div className="text-lg font-semibold">
                <span className="text-accent">{hour.toString().padStart(2, "0")}:00</span>
                <span className="text-muted text-sm ml-2">· {period.label}</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full accent-[#ffb020]"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1 font-mono">
              {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <label className="text-xs text-muted flex flex-col gap-1">
              Radius
              <input
                type="range"
                min={8}
                max={40}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-24 accent-[#60a5fa]"
              />
            </label>
            <label className="text-xs text-muted flex flex-col gap-1">
              Blur
              <input
                type="range"
                min={8}
                max={40}
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-24 accent-[#60a5fa]"
              />
            </label>
          </div>
        </div>

        <HeatmapMap hour={hour} radius={radius} blur={blur} />

        <div className="mt-3 flex items-center gap-4 text-xs text-muted flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: "#1e3a8a" }} /> Low
            <span className="w-3 h-3 rounded-sm" style={{ background: "#60a5fa" }} />
            <span className="w-3 h-3 rounded-sm" style={{ background: "#ffb020" }} />
            <span className="w-3 h-3 rounded-sm" style={{ background: "#f97316" }} />
            <span className="w-3 h-3 rounded-sm" style={{ background: "#ef4444" }} /> High
          </div>
          <span>Sample of ~3500 GPS points per hourly slice (stratified sampling, seed 42).</span>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-2">
        {[4, 8, 13, 18, 22].map((h) => (
          <button
            key={h}
            className={`btn text-left ${hour === h ? "btn-primary" : ""}`}
            onClick={() => setHour(h)}
          >
            <div className="text-xs text-muted">{periodFor(h).label}</div>
            <div className="text-sm font-semibold">{h.toString().padStart(2, "0")}:00</div>
          </button>
        ))}
      </div>
    </div>
  );
}
