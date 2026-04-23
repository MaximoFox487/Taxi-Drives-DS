"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "#8a94b8", fontSize: 11 };

export function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const withFlag = data.map((d) => ({
    ...d,
    rush: (d.hour >= 6 && d.hour < 10) || (d.hour >= 16 && d.hour < 20),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={withFlag}>
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis dataKey="hour" tick={AXIS} />
        <YAxis tick={AXIS} width={60} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
          labelFormatter={(h) => `Hour ${h}:00`}
          formatter={(v: number) => [v.toLocaleString(), "GPS records"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {withFlag.map((d, i) => (
            <Cell key={i} fill={d.rush ? "#ffb020" : "#60a5fa"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const NAMES: Record<string, string> = {
    "2008-02-02": "Sat 2",
    "2008-02-03": "Sun 3",
    "2008-02-04": "Mon 4",
    "2008-02-05": "Tue 5",
    "2008-02-06": "Wed 6",
    "2008-02-07": "Thu 7",
    "2008-02-08": "Fri 8",
  };
  const enriched = data.map((d) => ({
    ...d,
    label: NAMES[d.date] ?? d.date,
    weekend: d.date === "2008-02-02" || d.date === "2008-02-03",
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={enriched}>
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={AXIS} />
        <YAxis tick={AXIS} width={60} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
          formatter={(v: number) => [v.toLocaleString(), "Records"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {enriched.map((d, i) => (
            <Cell key={i} fill={d.weekend ? "#f97316" : "#22c55e"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PeriodChart({ data }: { data: { period: string; count: number; label: string }[] }) {
  const COLORS = ["#334155", "#60a5fa", "#a78bfa", "#ffb020", "#f472b6"];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis type="number" tick={AXIS} />
        <YAxis type="category" dataKey="label" tick={AXIS} width={150} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
          formatter={(v: number) => [v.toLocaleString(), "Records"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ModelMetricsChart({
  data,
}: {
  data: { model: string; mae: number; rmse: number; r2: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis dataKey="model" tick={AXIS} />
        <YAxis tick={AXIS} width={50} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
        />
        <Legend wrapperStyle={{ color: "#8a94b8", fontSize: 12 }} />
        <Bar dataKey="mae" fill="#60a5fa" name="MAE (min)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="rmse" fill="#ffb020" name="RMSE (min)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AblationChart({
  data,
}: {
  data: { stage: string; r2: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis dataKey="stage" tick={{ ...AXIS, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={80} />
        <YAxis tick={AXIS} width={50} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
        />
        <Line type="monotone" dataKey="r2" stroke="#ffb020" strokeWidth={2} dot={{ r: 4, fill: "#ffb020" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportanceChart({
  data,
}: {
  data: { feature: string; importance: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid stroke="#2a3459" strokeDasharray="3 3" />
        <XAxis type="number" tick={AXIS} />
        <YAxis type="category" dataKey="feature" tick={{ ...AXIS, fontSize: 11 }} width={130} />
        <Tooltip
          contentStyle={{ background: "#12182b", border: "1px solid #2a3459", color: "#e6ebff" }}
          formatter={(v: number) => [(v * 100).toFixed(1) + "%", "Importance"]}
        />
        <Bar dataKey="importance" fill="#a78bfa" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
