"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { BEIJING_CENTER } from "@/lib/data";

const CLUSTER_COLORS = [
  "#ffb020", "#60a5fa", "#a78bfa", "#f472b6", "#22c55e",
  "#f97316", "#06b6d4", "#eab308", "#ef4444", "#14b8a6",
];

export default function ClusterMap({
  points,
  labels,
  centroids,
}: {
  points: [number, number, number][]; // [lon, lat, hour]
  labels: number[];
  centroids: [number, number][]; // [lon, lat]
}) {
  return (
    <div className="h-[560px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={BEIJING_CENTER}
        zoom={11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map(([lon, lat], i) => (
          <CircleMarker
            key={i}
            center={[lat, lon]}
            radius={2.5}
            pathOptions={{
              color: CLUSTER_COLORS[labels[i] % CLUSTER_COLORS.length],
              fillColor: CLUSTER_COLORS[labels[i] % CLUSTER_COLORS.length],
              fillOpacity: 0.65,
              weight: 0,
            }}
          />
        ))}
        {centroids.map(([lon, lat], i) => (
          <CircleMarker
            key={`c-${i}`}
            center={[lat, lon]}
            radius={10}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
              fillOpacity: 0.95,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]} className="!bg-panel !text-text !border-border">
              C{i}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
