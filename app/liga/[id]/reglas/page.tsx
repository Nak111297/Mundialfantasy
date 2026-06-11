"use client";

import Link from "next/link";
import { useLeague } from "@/lib/league";
import { DEFAULT_SCORING } from "@/lib/types";

export default function RulesPage({ params }: { params: { id: string } }) {
  const { league } = useLeague(params.id);
  const s = league?.scoring ?? DEFAULT_SCORING;

  const rows: [string, string, number][] = [
    ["⚽ Goles", "Gol a favor (todas las fases)", s.goalFor],
    ["", "Gol en contra (todas las fases)", s.goalAgainst],
    ["🧤 Defensa", "Portería a cero (todas las fases)", s.cleanSheet],
    ["🏟️ Fase de grupos", "Victoria", s.win],
    ["", "Empate", s.draw],
    ["🚀 Avance", "Clasificar a 32avos de final", s.advanceR32],
    ["", "Ganar en 32avos (pasar a octavos)", s.advanceR16],
    ["", "Ganar en octavos (pasar a cuartos)", s.advanceQF],
    ["", "Ganar en cuartos (pasar a semis)", s.advanceSF],
    ["", "Ganar la semifinal (llegar a la final)", s.advanceFinal],
    ["🏆 Títulos", "Campeón del mundo", s.champion],
    ["", "Ganar el partido por el 3er lugar", s.thirdPlace],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">📜 Sistema de puntos</h1>
        <div className="flex gap-2">
          <Link href={`/liga/${params.id}/ajustes`} className="btn-ghost text-sm">
            ⚙️ Personalizar
          </Link>
          <Link href={`/liga/${params.id}`} className="btn-ghost text-sm">
            ← Liga
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([cat, label, pts], i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="w-36 px-4 py-2.5 font-bold text-white/50">{cat}</td>
                <td className="px-4 py-2.5">{label}</td>
                <td
                  className={`px-4 py-2.5 text-right font-mono text-base font-black ${
                    pts < 0 ? "text-red-400" : "text-wc-gold"
                  }`}
                >
                  {pts > 0 ? `+${pts}` : pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3 text-sm text-white/70">
        <p className="font-bold text-white">Notas de diseño del puntaje</p>
        <p>
          <strong>En eliminatorias no hay puntos por victoria/empate:</strong>{" "}
          el premio está en los bonos por avanzar, que crecen ronda a ronda.
          Así, un equipo que llega lejos vale mucho, pero sin duplicar puntos.
        </p>
        <p>
          <strong>Penales:</strong> ganar en penales otorga el bono de avance,
          pero los penales de la tanda no cuentan como goles. El partido con
          empate en 120&apos; no reparte puntos de victoria.
        </p>
        <p>
          <strong>Los goles en contra restan:</strong> esto hace que los
          equipos chicos no sean puntos gratis para nadie y premia elegir
          defensas sólidas en las últimas rondas del draft.
        </p>
        <p>
          <strong>Valor esperado:</strong> el campeón suma ~48 pts solo en
          bonos de avance (5+4+6+8+10+15), comparable a una gran fase de
          grupos. Una cenicienta que avanza a 32avos con un par de empates ya
          aporta ~8–10 pts: todos los picks importan.
        </p>
      </div>
    </div>
  );
}
