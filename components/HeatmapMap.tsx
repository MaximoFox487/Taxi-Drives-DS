"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { BEIJING_CENTER } from "@/lib/data";

type HeatLayer = L.Layer & { setLatLngs: (pts: [number, number, number][]) => void };

function HeatLayerInner({ points, radius, blur }: { points: [number, number, number][]; radius: number; blur: number }) {
  const map = useMap();
  const layerRef = useRef<HeatLayer | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      // @ts-expect-error leaflet.heat augments L but not typings
      layerRef.current = L.heatLayer(points, {
        radius,
        blur,
        maxZoom: 17,
        minOpacity: 0.25,
        gradient: {
          0.2: "#1e3a8a",
          0.4: "#60a5fa",
          0.6: "#ffb020",
          0.8: "#f97316",
          1.0: "#ef4444",
        },
      }).addTo(map);
    } else {
      layerRef.current.setLatLngs(points);
      // @ts-expect-error options setter not typed
      layerRef.current.setOptions?.({ radius, blur });
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, radius, blur]);

  return null;
}

export default function HeatmapMap({
  hour,
  radius,
  blur,
}: {
  hour: number;
  radius: number;
  blur: number;
}) {
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const H = hour.toString().padStart(2, "0");
    fetch(`/data/heatmap/hour_${H}.json`)
      .then((r) => r.json())
      .then((data: [number, number][]) => {
        if (cancelled) return;
        // Leaflet expects [lat, lng, intensity]; data stored as [lon, lat]
        setPoints(data.map(([lon, lat]) => [lat, lon, 0.6]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hour]);

  return (
    <div className="relative h-[560px] rounded-xl overflow-hidden border border-border">
      {loading && (
        <div className="absolute top-3 right-3 z-[500] bg-panel/80 border border-border rounded-md px-3 py-1 text-xs text-muted backdrop-blur">
          Cargando hora {hour}:00…
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
        <HeatLayerInner points={points} radius={radius} blur={blur} />
      </MapContainer>
    </div>
  );
}
