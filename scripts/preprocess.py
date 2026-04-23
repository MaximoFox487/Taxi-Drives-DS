"""
Regenera los archivos estáticos de ../public/data/ a partir de los 500
primeros archivos de taxi del dataset T-Drive.

Reproduce el mismo pipeline de limpieza que el notebook:
    1) Bounding box de Beijing (115.5-117.5 E, 39.4-41.0 N)
    2) Filtro por velocidad implícita > 200 km/h (Haversine) entre puntos
    3) Filtro 3-sigma sobre lon/lat

Salida:
    public/data/stats.json
    public/data/taxi_list.json
    public/data/sample_points.json
    public/data/heatmap/hour_HH.json   (24 archivos)
    public/data/trajectories/taxi_ID.json

Uso:
    python scripts/preprocess.py --src "../taxi_log_2008_by_id" --out "public/data"
"""
import argparse
import json
import math
import os
import random
from pathlib import Path
from collections import defaultdict
from datetime import datetime

BBOX = (115.5, 117.5, 39.4, 41.0)
N_TAXIS = 500
SEED = 42


def haversine_km(lon1, lat1, lon2, lat2):
    R = 6371.0
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def load_and_clean(src: Path):
    rows = []
    for i in range(1, N_TAXIS + 1):
        f = src / f"{i}.txt"
        if not f.exists():
            continue
        with open(f, "r", encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                parts = line.strip().split(",")
                if len(parts) < 4:
                    continue
                try:
                    tid = int(parts[0])
                    ts = parts[1]
                    lon = float(parts[2])
                    lat = float(parts[3])
                except ValueError:
                    continue
                if not (BBOX[0] <= lon <= BBOX[1] and BBOX[2] <= lat <= BBOX[3]):
                    continue
                rows.append((tid, ts, lon, lat))
    print(f"Tras bbox: {len(rows):,}")

    # Speed-based outliers
    rows.sort(key=lambda r: (r[0], r[1]))
    clean = []
    prev_id, prev_t, prev_lon, prev_lat = None, None, None, None
    for tid, ts, lon, lat in rows:
        t = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
        if tid == prev_id and prev_t is not None:
            dt = (t - prev_t).total_seconds() / 3600
            if dt > 0:
                d = haversine_km(prev_lon, prev_lat, lon, lat)
                if d / dt > 200:
                    prev_id, prev_t, prev_lon, prev_lat = tid, t, lon, lat
                    continue
        clean.append((tid, ts, lon, lat))
        prev_id, prev_t, prev_lon, prev_lat = tid, t, lon, lat
    print(f"Tras filtro velocidad: {len(clean):,}")

    # 3-sigma
    n = len(clean)
    s_lon = sum(r[2] for r in clean)
    s_lat = sum(r[3] for r in clean)
    m_lon, m_lat = s_lon / n, s_lat / n
    v_lon = sum((r[2] - m_lon) ** 2 for r in clean) / n
    v_lat = sum((r[3] - m_lat) ** 2 for r in clean) / n
    sd_lon, sd_lat = math.sqrt(v_lon), math.sqrt(v_lat)
    final = [
        r for r in clean
        if abs(r[2] - m_lon) <= 3 * sd_lon and abs(r[3] - m_lat) <= 3 * sd_lat
    ]
    print(f"Tras 3-sigma: {len(final):,}")
    return final


def write_outputs(rows, out: Path):
    (out / "heatmap").mkdir(parents=True, exist_ok=True)
    (out / "trajectories").mkdir(parents=True, exist_ok=True)

    # stats
    hourly = defaultdict(int)
    daily = defaultdict(int)
    periods = defaultdict(int)
    by_taxi = defaultdict(list)
    per_hour = defaultdict(list)

    def period_of(h):
        if h < 6: return "late_night"
        if h < 10: return "morning_rush"
        if h < 16: return "midday"
        if h < 20: return "evening_rush"
        return "night"

    for tid, ts, lon, lat in rows:
        h = int(ts[11:13])
        d = ts[:10]
        hourly[h] += 1
        daily[d] += 1
        periods[period_of(h)] += 1
        by_taxi[tid].append((ts, lon, lat))
        per_hour[h].append((lon, lat))

    lons = [r[2] for r in rows]
    lats = [r[3] for r in rows]

    stats = {
        "total_points": len(rows),
        "num_taxis": len(by_taxi),
        "date_range": [min(daily), max(daily)],
        "bbox": {
            "min_lon": round(min(lons), 5), "max_lon": round(max(lons), 5),
            "min_lat": round(min(lats), 5), "max_lat": round(max(lats), 5),
        },
        "hourly": [{"hour": h, "count": hourly[h]} for h in range(24)],
        "daily": [{"date": d, "count": daily[d]} for d in sorted(daily)],
        "periods": [{"period": k, "count": v} for k, v in periods.items()],
    }
    (out / "stats.json").write_text(json.dumps(stats), encoding="utf-8")

    # Heatmap por hora (muestreado)
    rng = random.Random(SEED)
    for h in range(24):
        pts = per_hour[h]
        if len(pts) > 3500:
            pts = rng.sample(pts, 3500)
        (out / "heatmap" / f"hour_{h:02d}.json").write_text(
            json.dumps([[round(lon, 5), round(lat, 5)] for lon, lat in pts]),
            encoding="utf-8",
        )

    # Trajectories
    taxi_list = []
    for tid in sorted(by_taxi):
        pts = by_taxi[tid]
        taxi_list.append({
            "id": tid,
            "points": len(pts),
            "first": pts[0][0],
            "last": pts[-1][0],
            "minLon": round(min(p[1] for p in pts), 5),
            "maxLon": round(max(p[1] for p in pts), 5),
            "minLat": round(min(p[2] for p in pts), 5),
            "maxLat": round(max(p[2] for p in pts), 5),
        })
        (out / "trajectories" / f"taxi_{tid}.json").write_text(
            json.dumps([[ts, round(lon, 5), round(lat, 5)] for ts, lon, lat in pts]),
            encoding="utf-8",
        )
    (out / "taxi_list.json").write_text(json.dumps(taxi_list), encoding="utf-8")

    # Muestra para clustering (lon, lat, hour)
    sample = []
    rng2 = random.Random(SEED)
    for tid, ts, lon, lat in rows:
        if rng2.random() < 2500 / len(rows):
            sample.append([round(lon, 5), round(lat, 5), int(ts[11:13])])
    (out / "sample_points.json").write_text(json.dumps(sample), encoding="utf-8")

    print(f"OK. {len(by_taxi)} taxis, {len(rows):,} puntos en {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="../taxi_log_2008_by_id")
    ap.add_argument("--out", default="public/data")
    args = ap.parse_args()

    src = Path(args.src).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    rows = load_and_clean(src)
    write_outputs(rows, out)


if __name__ == "__main__":
    main()
