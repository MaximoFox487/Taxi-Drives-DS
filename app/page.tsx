import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { HourlyChart, DailyChart, PeriodChart } from "@/components/Charts";
import { Stats, PERIOD_LABELS } from "@/lib/data";

async function loadStats(): Promise<Stats> {
  const p = path.join(process.cwd(), "public", "data", "stats.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

export default async function HomePage() {
  const stats = await loadStats();

  const periodOrder = ["late_night", "morning_rush", "midday", "evening_rush", "night"];
  const periodData = periodOrder
    .map((k) => {
      const p = stats.periods.find((x) => x.period === k);
      return p ? { ...p, label: PERIOD_LABELS[k] } : null;
    })
    .filter(Boolean) as { period: string; count: number; label: string }[];

  const peakHour = [...stats.hourly].sort((a, b) => b.count - a.count)[0];
  const totalWeekday = stats.daily
    .filter((d) => !["2008-02-02", "2008-02-03"].includes(d.date))
    .reduce((s, d) => s + d.count, 0);
  const totalWeekend = stats.daily
    .filter((d) => ["2008-02-02", "2008-02-03"].includes(d.date))
    .reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-br from-panel to-panel2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Análisis de movilidad con T-Drive</h1>
            <p className="text-muted mt-1 max-w-2xl">
              500 taxis · 2-8 febrero 2008 · Beijing. Exploración de patrones temporales y espaciales,
              detección de hotspots con K-Means y DBSCAN, y predicción del tiempo de viaje con modelos
              de regresión.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/heatmap" className="btn btn-primary">Abrir heatmap interactivo →</Link>
            <Link href="/taxi" className="btn">Explorar trayectoria de un taxi</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Registros GPS (limpios)" value={stats.total_points.toLocaleString()} />
        <Kpi label="Taxis analizados" value={stats.num_taxis.toString()} />
        <Kpi label="Hora pico" value={`${peakHour.hour}:00`} sub={`${peakHour.count.toLocaleString()} registros`} />
        <Kpi label="Ratio laboral/fin de sem." value={`${(totalWeekday / totalWeekend).toFixed(2)}×`} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Distribución por hora del día</div>
          <HourlyChart data={stats.hourly} />
          <p className="text-xs text-muted mt-2">
            Las barras naranjas marcan horas punta (6-10h y 16-20h). El patrón bimodal refleja los
            desplazamientos de ida y vuelta al trabajo.
          </p>
        </div>
        <div className="card">
          <div className="card-title">Distribución por día de la semana</div>
          <DailyChart data={stats.daily} />
          <p className="text-xs text-muted mt-2">
            Los días laborables concentran significativamente más actividad que el fin de semana.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Distribución por período del día</div>
          <PeriodChart data={periodData} />
        </div>
        <div className="card">
          <div className="card-title">Pipeline de limpieza aplicado</div>
          <ul className="text-sm text-muted space-y-2 list-disc pl-5">
            <li>Filtro por bounding box de Beijing (115.5–117.5°E, 39.4–41.0°N).</li>
            <li>Filtro por velocidad implícita (Haversine) {`>`} 200 km/h entre puntos consecutivos.</li>
            <li>Detección de outliers a 3σ sobre lon/lat.</li>
            <li>Se retienen <span className="text-text">{stats.total_points.toLocaleString()}</span> registros de <span className="text-text">{stats.num_taxis}</span> taxis.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/clusters" className="btn">Ver clustering →</Link>
            <Link href="/prediction" className="btn">Ver predicción ML →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className="kpi">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
