# T-Drive Beijing — Demo interactiva

Demo web sobre el notebook `TDrive_Project USAR ESTE.ipynb`. Usa los mismos 500 primeros
taxis (numéricos) del dataset T-Drive (Microsoft Research, 2-8 febrero 2008, Beijing) y
reproduce el pipeline de limpieza del notebook: bounding box → filtro por velocidad Haversine
> 200 km/h → 3-sigma sobre lon/lat. Resultan ~741 k puntos GPS de 493 taxis.

## Páginas

- **Overview** — KPIs, distribución por hora / día / período, cumpliendo el EDA del notebook.
- **Heatmap por hora** — slider 0-23h con animación automática; se redibuja el heatmap de
  densidad con los ~3500 puntos muestreados de esa franja (`public/data/heatmap/hour_HH.json`).
- **Trayectoria de taxi** — selector sobre los 493 taxis, filtro por día y rango horario;
  separa viajes por huecos temporales > 5 min (misma heurística que `extract_trips` en el
  notebook).
- **Clustering** — K-Means ejecutado **en el navegador** (k-means++, StandardScaler interno)
  sobre 2500 puntos; slider K=3..12 y filtro por período para visualizar la migración de
  centroides que observa el notebook.
- **Predicción ML** — métricas reales del notebook (Linear / RF / GB), gráfico de ablación e
  importancia de features. Incluye un predictor interactivo: click en el mapa para fijar
  origen y destino, elige hora y día, y obtén el tiempo estimado con intervalo ±MAE.

## Ejecutar en local

```bash
cd demo
npm install
npm run dev
# http://localhost:3000
```

## Desplegar en Vercel

1. `cd demo && git init && git add . && git commit -m "init"`
2. Crea un repo nuevo en GitHub y haz push.
3. En vercel.com → **New Project** → importa el repo.
4. Framework preset: **Next.js** (auto-detectado). No hay variables de entorno.
5. Deploy.

> Todos los datos están en `public/data/` como archivos estáticos, por lo que funcionan sin
> backend. El tamaño total es ~34 MB (32 MB de trayectorias que se cargan on-demand). Vercel
> sirve sin problemas ese volumen en el plan Hobby.

## Regenerar los datos

Los JSONs de `public/data/` ya están comiteados. Para regenerarlos a partir de los archivos
`.txt` originales:

```bash
cd demo
python scripts/preprocess.py --src "../taxi_log_2008_by_id" --out "public/data"
```

El script no depende de sklearn ni numpy; replica en Python puro el mismo pipeline que usa el
notebook para los 500 primeros taxis.

## Estructura

```
demo/
  app/
    page.tsx              # dashboard
    heatmap/page.tsx      # heatmap interactivo
    taxi/page.tsx         # trayectoria por taxi
    clusters/page.tsx     # K-Means en el navegador
    prediction/page.tsx   # resultados ML + predictor
  components/
    Charts.tsx            # recharts
    HeatmapMap.tsx        # leaflet + leaflet.heat
    TaxiMap.tsx           # leaflet polylines
    ClusterMap.tsx
    PredictorMap.tsx
  lib/
    data.ts               # tipos y helpers
    kmeans.ts             # K-Means k-means++ en TypeScript
    predictor.ts          # surrogate calibrado al Gradient Boosting
  public/data/
    stats.json
    taxi_list.json
    sample_points.json
    heatmap/hour_HH.json  # 24 archivos
    trajectories/taxi_*.json
  scripts/preprocess.py   # regenera public/data/
```

## Notas

- El predictor de la página ML es un **modelo surrogate** calibrado a las métricas del notebook
  (MAE 17.36 min, velocidad base ~18 km/h, penalizaciones por hora punta y densidad de centro).
  No es el sklearn entrenado exportado — preserva las relaciones cualitativas del Gradient
  Boosting para que el slider sea interactivo e interpretable en el cliente.
- El heatmap usa la librería `leaflet.heat` y muestrea puntos por franja horaria para mantener
  el volumen razonable sin perder la forma de la densidad.
- Tiles de mapa: CARTO dark basemap (sin API key).
