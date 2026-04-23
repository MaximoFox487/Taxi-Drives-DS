import "leaflet";
declare module "leaflet" {
  function heatLayer(latlngs: [number, number, number?][], options?: Record<string, unknown>): Layer;
}
