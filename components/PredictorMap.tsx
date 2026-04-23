"use client";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { BEIJING_CENTER } from "@/lib/data";

// Fix default marker icons (Next.js bundles break the asset paths)
const greenIcon = new L.DivIcon({
  className: "",
  html: '<div style="background:#22c55e;width:16px;height:16px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const redIcon = new L.DivIcon({
  className: "",
  html: '<div style="background:#ef4444;width:16px;height:16px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PredictorMap({
  origin,
  dest,
  setOrigin,
  setDest,
  mode,
}: {
  origin: [number, number] | null;
  dest: [number, number] | null;
  setOrigin: (p: [number, number]) => void;
  setDest: (p: [number, number]) => void;
  mode: "origin" | "dest";
}) {
  const handleClick = (lat: number, lon: number) => {
    if (mode === "origin") setOrigin([lon, lat]);
    else setDest([lon, lat]);
  };

  return (
    <div className="h-[460px] rounded-xl overflow-hidden border border-border">
      <MapContainer center={BEIJING_CENTER} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onClick={handleClick} />
        {origin && <Marker position={[origin[1], origin[0]]} icon={greenIcon} />}
        {dest && <Marker position={[dest[1], dest[0]]} icon={redIcon} />}
        {origin && dest && (
          <Polyline
            positions={[
              [origin[1], origin[0]],
              [dest[1], dest[0]],
            ]}
            pathOptions={{ color: "#ffb020", weight: 3, dashArray: "6 6" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
