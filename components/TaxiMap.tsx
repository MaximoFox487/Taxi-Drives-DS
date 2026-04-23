"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import { BEIJING_CENTER } from "@/lib/data";
import L from "leaflet";

type RawPoint = [string, number, number]; // [timestamp, lon, lat]

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [30, 30] });
  }, [map, points]);
  return null;
}

export default function TaxiMap({
  taxiId,
  dateFilter,
  hourRange,
}: {
  taxiId: number | null;
  dateFilter: string; // "all" or specific date
  hourRange: [number, number];
}) {
  const [raw, setRaw] = useState<RawPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taxiId == null) {
      setRaw([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/data/trajectories/taxi_${taxiId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrado");
        return r.json();
      })
      .then((data: RawPoint[]) => {
        if (cancelled) return;
        setRaw(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taxiId]);

  const filtered = useMemo(() => {
    return raw.filter(([ts]) => {
      const date = ts.slice(0, 10);
      const hour = Number(ts.slice(11, 13));
      if (dateFilter !== "all" && date !== dateFilter) return false;
      if (hour < hourRange[0] || hour > hourRange[1]) return false;
      return true;
    });
  }, [raw, dateFilter, hourRange]);

  const latlngs = useMemo<[number, number][]>(
    () => filtered.map(([, lon, lat]) => [lat, lon]),
    [filtered]
  );

  const segments = useMemo(() => {
    // Break the polyline whenever two consecutive points are >5 min apart: new "trip"
    const segs: [number, number][][] = [];
    let cur: [number, number][] = [];
    let prevT = 0;
    for (let i = 0; i < filtered.length; i++) {
      const [ts, lon, lat] = filtered[i];
      const t = new Date(ts.replace(" ", "T") + "Z").getTime();
      if (cur.length && t - prevT > 5 * 60 * 1000) {
        if (cur.length > 1) segs.push(cur);
        cur = [];
      }
      cur.push([lat, lon]);
      prevT = t;
    }
    if (cur.length > 1) segs.push(cur);
    return segs;
  }, [filtered]);

  const segColors = ["#ffb020", "#60a5fa", "#a78bfa", "#f472b6", "#22c55e", "#f97316"];

  return (
    <div className="relative h-[560px] rounded-xl overflow-hidden border border-border">
      {loading && (
        <div className="absolute top-3 right-3 z-[500] bg-panel/80 border border-border rounded-md px-3 py-1 text-xs text-muted backdrop-blur">
          Cargando taxi #{taxiId}…
        </div>
      )}
      {error && (
        <div className="absolute top-3 right-3 z-[500] bg-red-900/70 border border-red-500 rounded-md px-3 py-1 text-xs text-text">
          Error: {error}
        </div>
      )}
      {!loading && taxiId != null && filtered.length === 0 && !error && (
        <div className="absolute top-3 right-3 z-[500] bg-panel/80 border border-border rounded-md px-3 py-1 text-xs text-muted backdrop-blur">
          Sin puntos para los filtros seleccionados.
        </div>
      )}
      <MapContainer
        center={BEIJING_CENTER}
        zoom={11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Tiles <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {segments.map((seg, i) => (
          <Polyline
            key={i}
            positions={seg}
            pathOptions={{ color: segColors[i % segColors.length], weight: 3, opacity: 0.85 }}
          />
        ))}
        {latlngs.length > 0 && (
          <>
            <CircleMarker
              center={latlngs[0]}
              radius={7}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1 }}
            />
            <CircleMarker
              center={latlngs[latlngs.length - 1]}
              radius={7}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 }}
            />
          </>
        )}
        <FitBounds points={latlngs} />
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[500] bg-panel/90 border border-border rounded-md px-3 py-2 text-xs backdrop-blur space-y-1">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Punto inicial</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Punto final</div>
        <div className="text-muted pt-1">{segments.length} viajes · {filtered.length} puntos GPS</div>
      </div>
    </div>
  );
}
