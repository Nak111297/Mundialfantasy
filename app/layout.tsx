import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mundial Fantasy 2026",
  description:
    "Fantasy por draft de selecciones para el Mundial 2026: elige tus equipos, suma puntos y gana la liga.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-wc-dark/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-wc-gradient text-lg shadow-glow">
                ⚽
              </span>
              <span className="text-lg font-black tracking-tight">
                Mundial<span className="text-wc-gold">Fantasy</span>
                <span className="ml-1 text-xs font-bold text-white/50">’26</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/equipos" className="btn-ghost px-3 py-1.5">
                Equipos
              </Link>
              <Link href="/resultados" className="btn-ghost px-3 py-1.5">
                Resultados
              </Link>
            </nav>
          </div>
          <div className="h-1 bg-wc-gradient" />
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-white/40">
          Canadá · México · Estados Unidos — Mundial 2026 · 48 selecciones, 12
          grupos
        </footer>
      </body>
    </html>
  );
}
