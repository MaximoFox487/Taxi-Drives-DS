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
            <h1 className="text-2xl font-semibold">Mobility analysis with T-Drive</h1>
            <p className="text-muted mt-1 max-w-2xl">
              500 taxis · Feb 2-8, 2008 · Beijing. Exploration of temporal and spatial patterns,
              hotspot detection with K-Means and DBSCAN, and travel time prediction with regression
              models.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/heatmap" className="btn btn-primary">Open interactive heatmap →</Link>
            <Link href="/taxi" className="btn">Explore a taxi trajectory</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="GPS records (cleaned)" value={stats.total_points.toLocaleString()} />
        <Kpi label="Taxis analyzed" value={stats.num_taxis.toString()} />
        <Kpi label="Peak hour" value={`${peakHour.hour}:00`} sub={`${peakHour.count.toLocaleString()} records`} />
        <Kpi label="Weekday / Weekend ratio" value={`${(totalWeekday / totalWeekend).toFixed(2)}×`} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Distribution by hour of day</div>
          <HourlyChart data={stats.hourly} />
          <p className="text-xs text-muted mt-2">
            Orange bars mark rush hours (6-10h and 16-20h). The bimodal pattern reflects commuting
            trips to and from work.
          </p>
        </div>
        <div className="card">
          <div className="card-title">Distribution by day of week</div>
          <DailyChart data={stats.daily} />
          <p className="text-xs text-muted mt-2">
            Weekdays concentrate significantly more activity than the weekend.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Distribution by time period</div>
          <PeriodChart data={periodData} />
        </div>
        <div className="card">
          <div className="card-title">Applied cleaning pipeline</div>
          <ul className="text-sm text-muted space-y-2 list-disc pl-5">
            <li>Beijing bounding box filter (115.5–117.5°E, 39.4–41.0°N).</li>
            <li>Implicit speed filter (Haversine) {`>`} 200 km/h between consecutive points.</li>
            <li>3σ outlier detection on lon/lat.</li>
            <li>Retained <span className="text-text">{stats.total_points.toLocaleString()}</span> records from <span className="text-text">{stats.num_taxis}</span> taxis.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/clusters" className="btn">View clustering →</Link>
            <Link href="/prediction" className="btn">View ML prediction →</Link>
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
