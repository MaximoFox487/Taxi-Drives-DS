"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { TaxiMeta } from "@/lib/data";

const TaxiMap = dynamic(() => import("@/components/TaxiMap"), { ssr: false });

const DATES = [
  { v: "all", label: "Semana completa" },
  { v: "2008-02-02", label: "Sáb 02 feb" },
  { v: "2008-02-03", label: "Dom 03 feb" },
  { v: "2008-02-04", label: "Lun 04 feb" },
  { v: "2008-02-05", label: "Mar 05 feb" },
  { v: "2008-02-06", label: "Mié 06 feb" },
  { v: "2008-02-07", label: "Jue 07 feb" },
  { v: "2008-02-08", label: "Vie 08 feb" },
];

export default function TaxiPage() {
  const [taxis, setTaxis] = useState<TaxiMeta[]>([]);
  const [taxiId, setTaxiId] = useState<number | null>(null);
  const [date, setDate] = useState("all");
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/data/taxi_list.json")
      .then((r) => r.json())
      .then((data: TaxiMeta[]) => {
        setTaxis(data);
        if (data.length) setTaxiId(data[0].id);
      });
  }, []);

  const filtered = useMemo(() => {
    const n = Number(q);
    if (q && !Number.isNaN(n)) return taxis.filter((t) => String(t.id).startsWith(q));
    return taxis;
  }, [taxis, q]);

  const selected = taxis.find((t) => t.id === taxiId) || null;
  const topActive = useMemo(() => [...taxis].sort((a, b) => b.points - a.points).slice(0, 8), [taxis]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Trayectoria de un taxi</h1>
        <p className="text-muted text-sm">
          Selecciona cualquiera de los {taxis.length} taxis limpios del dataset y filtra por día y
          franja horaria. Cada color representa un viaje distinto (segmentos separados por más de 5
          minutos de inactividad).
        </p>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        <aside className="card space-y-3 max-h-[620px] overflow-hidden flex flex-col">
          <div className="card-title">Selector de taxi</div>
          <input
            className="input"
            placeholder="Buscar por ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="overflow-y-auto flex-1 border border-border rounded-md bg-bg/40">
            {filtered.slice(0, 200).map((t) => (
              <button
                key={t.id}
                onClick={() => setTaxiId(t.id)}
                className={`w-full px-3 py-2 text-left text-sm border-b border-border/60 hover:bg-panel2 flex justify-between items-center ${
                  t.id === taxiId ? "bg-panel2 text-accent" : ""
                }`}
              >
                <span>Taxi #{t.id}</span>
                <span className="text-xs text-muted">{t.points} pts</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-muted p-3">Sin resultados.</div>}
            {filtered.length > 200 && (
              <div className="text-xs text-muted p-3">Mostrando 200 de {filtered.length}.</div>
            )}
          </div>
          <div>
            <div className="card-title !mb-1">Taxis más activos</div>
            <div className="flex flex-wrap gap-1">
              {topActive.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTaxiId(t.id)}
                  className={`text-xs px-2 py-1 rounded-md border border-border hover:bg-panel2 ${
                    t.id === taxiId ? "bg-accent text-bg border-accent" : "bg-panel2"
                  }`}
                >
                  #{t.id}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="card">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs text-muted block mb-1">Día</label>
                <select
                  className="input w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                >
                  {DATES.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-xs text-muted">Rango horario</label>
                  <div className="text-sm font-mono text-accent">
                    {hourRange[0].toString().padStart(2, "0")}:00 – {hourRange[1].toString().padStart(2, "0")}:59
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={hourRange[0]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setHourRange(([, b]) => [Math.min(v, b), b]);
                    }}
                    className="w-full accent-[#60a5fa]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={hourRange[1]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setHourRange(([a]) => [a, Math.max(a, v)]);
                    }}
                    className="w-full accent-[#ffb020]"
                  />
                </div>
              </div>
            </div>

            {selected && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <Meta label="Taxi" value={`#${selected.id}`} />
                <Meta label="Puntos totales" value={selected.points.toLocaleString()} />
                <Meta label="Primer registro" value={selected.first} />
                <Meta label="Último registro" value={selected.last} />
              </div>
            )}
          </div>

          <TaxiMap taxiId={taxiId} dateFilter={date} hourRange={hourRange} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel2 border border-border rounded-md px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-text font-mono text-xs mt-0.5">{value}</div>
    </div>
  );
}
