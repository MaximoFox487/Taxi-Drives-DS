import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "T-Drive Beijing — Demo interactiva",
  description:
    "Análisis de trayectorias de taxis en Beijing (T-Drive, 500 taxis). Heatmaps por hora, trayectorias por taxi, clustering y predicción de tiempos de viaje.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-border bg-panel/70 backdrop-blur sticky top-0 z-[1000]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="text-accent">T-Drive</span> Beijing
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-text">Overview</Link>
              <Link href="/heatmap" className="hover:text-text">Heatmap por hora</Link>
              <Link href="/taxi" className="hover:text-text">Trayectoria de taxi</Link>
              <Link href="/clusters" className="hover:text-text">Clustering</Link>
              <Link href="/prediction" className="hover:text-text">Predicción ML</Link>
            </nav>
            <div className="ml-auto text-xs text-muted hidden md:block">
              500 taxis · 2-8 Feb 2008
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="max-w-7xl mx-auto px-4 py-8 text-xs text-muted">
          Dataset: Microsoft Research T-Drive · Demo construido sobre el notebook del curso Data Science & Algorithms (CS BIT).
        </footer>
      </body>
    </html>
  );
}
