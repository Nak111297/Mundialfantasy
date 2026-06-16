"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { TEAM_MAP } from "@/lib/data";
import { startDraft, useLeague, useResults } from "@/lib/league";
import { computeTeamPoints } from "@/lib/scoring";
import { DEFAULT_SCORING, TeamPointsBreakdown } from "@/lib/types";
import { useUser } from "@/lib/useUser";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaguePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const { league, error } = useLeague(params.id);
  const results = useResults();
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const teamPoints = useMemo(
    () => computeTeamPoints(results, league?.scoring ?? DEFAULT_SCORING),
    [results, league?.scoring]
  );

  const standings = useMemo(() => {
    if (!league) return [];
    return Object.values(league.members)
      .map((m) => {
        const teams = league.picks
          .filter((p) => p.uid === m.uid)
          .map((p) => ({
            teamId: p.teamId,
            points: teamPoints[p.teamId]?.total ?? 0,
          }))
          .sort((a, b) => b.points - a.points);
        return {
          ...m,
          teams,
          total: teams.reduce((s, t) => s + t.points, 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [league, teamPoints]);

  if (error) return <p className="text-center text-red-400">{error}</p>;
  if (!league) return <p className="text-center text-white/50">Cargando…</p>;

  const isCommissioner = user?.uid === league.commissioner;
  const memberCount = Object.keys(league.members).length;
  const canStart = [4, 6, 8].includes(memberCount);

  async function copyCode() {
    await navigator.clipboard.writeText(league!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{league.name}</h1>
          <p className="text-sm text-white/50">
            {memberCount}/{league.maxPlayers} jugadores ·{" "}
            {league.status === "lobby"
              ? "Esperando draft"
              : league.status === "drafting"
              ? "¡Draft en curso!"
              : "Torneo en juego"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={copyCode}>
            Código: <span className="font-mono tracking-widest text-wc-gold">{league.code}</span>
            {copied ? " ✓" : " 📋"}
          </button>
          <Link href={`/liga/${league.id}/reglas`} className="btn-ghost text-sm">
            Reglas
          </Link>
          {isCommissioner && (
            <Link href={`/liga/${league.id}/ajustes`} className="btn-ghost text-sm">
              ⚙️
            </Link>
          )}
        </div>
      </div>

      {league.status === "lobby" && (
        <div className="card space-y-4 text-center">
          <h2 className="text-xl font-bold">Sala de espera</h2>
          <p className="text-white/60">
            Comparte el código <span className="font-mono text-wc-gold">{league.code}</span>{" "}
            con tus amigos. El draft puede iniciar con 4, 6 u 8 jugadores.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.values(league.members).map((m) => (
              <span key={m.uid} className="chip bg-white/10 px-3 py-1 text-sm">
                {m.name}
                {m.uid === league.commissioner && " 👑"}
              </span>
            ))}
            {Array.from({ length: league.maxPlayers - memberCount }).map((_, i) => (
              <span key={i} className="chip border border-dashed border-white/20 px-3 py-1 text-sm text-white/30">
                libre
              </span>
            ))}
          </div>
          {isCommissioner && (
            <button
              className="btn-primary"
              disabled={!canStart}
              onClick={() =>
                startDraft(league.id, user!.uid).catch((e) => setActionError(e.message))
              }
            >
              {canStart
                ? `Iniciar draft (${48 / memberCount} equipos por jugador)`
                : "Se necesitan 4, 6 u 8 jugadores"}
            </button>
          )}
          {actionError && <p className="text-red-400">{actionError}</p>}
        </div>
      )}

      {league.status === "drafting" && (
        <div className="card flex flex-col items-center gap-3 bg-wc-gradient/20 text-center">
          <h2 className="text-xl font-bold">🎲 ¡El draft está en curso!</h2>
          <Link href={`/liga/${league.id}/draft`} className="btn-primary">
            Ir a la sala de draft
          </Link>
        </div>
      )}

      {league.status === "active" && (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">🏆 Clasificación</h2>
              <button
                className={`btn px-3 py-1.5 text-sm ${
                  compact
                    ? "bg-wc-gold text-wc-dark"
                    : "border border-white/15 hover:bg-white/10"
                }`}
                onClick={() => setCompact((c) => !c)}
              >
                {compact ? "↩︎ Vista detallada" : "📸 Modo captura"}
              </button>
            </div>

            {compact ? (
              <CompactStandings
                leagueName={league.name}
                standings={standings}
                meUid={user?.uid}
              />
            ) : (
              <div className="space-y-3">
                {standings.map((s, i) => (
                  <div key={s.uid} className="card">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">
                        <span className="mr-2">{MEDALS[i] ?? `${i + 1}.`}</span>
                        {s.name}
                        {s.uid === user?.uid && (
                          <span className="ml-2 text-xs text-wc-gold">(tú)</span>
                        )}
                      </p>
                      <p className="text-2xl font-black text-wc-gold">{s.total}</p>
                    </div>
                    <div className="mt-3 grid gap-1 sm:grid-cols-2">
                      {s.teams.map((t) => {
                        const bd = teamPoints[t.teamId];
                        const open = expanded === t.teamId;
                        return (
                          <div key={t.teamId} className="sm:col-span-1">
                            <button
                              onClick={() =>
                                setExpanded(open ? null : t.teamId)
                              }
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition ${
                                open
                                  ? "bg-wc-gold/15"
                                  : "bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="text-white/30">
                                  {open ? "▾" : "▸"}
                                </span>
                                <TeamBadge teamId={t.teamId} size="sm" />
                              </span>
                              <span
                                className={`font-bold ${
                                  t.points < 0 ? "text-red-400" : ""
                                }`}
                              >
                                {t.points}
                              </span>
                            </button>
                            {open && bd && <Breakdown bd={bd} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">📋 Últimos resultados</h2>
            {results.filter((r) => r.scoreA != null).length === 0 ? (
              <p className="text-white/50">
                Aún no hay resultados capturados.{" "}
                <Link href="/resultados" className="text-wc-gold underline">
                  Capturar resultados
                </Link>
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {results
                  .filter((r) => r.scoreA != null)
                  .slice(-8)
                  .reverse()
                  .map((r) => (
                    <div key={r.id} className="card flex items-center justify-between py-3 text-sm">
                      <span>
                        {TEAM_MAP[r.teamA]?.flag} {TEAM_MAP[r.teamA]?.name}
                      </span>
                      <span className="font-mono font-bold text-wc-gold">
                        {r.scoreA} - {r.scoreB}
                      </span>
                      <span>
                        {TEAM_MAP[r.teamB]?.name} {TEAM_MAP[r.teamB]?.flag}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Breakdown({ bd }: { bd: TeamPointsBreakdown }) {
  const rows: [string, number][] = [
    ["🏟️ Resultados (grupos)", bd.matchPoints],
    ["⚽ Goles (a favor − contra)", bd.goalPoints],
    ["🧤 Porterías a cero", bd.cleanSheetPoints],
    ["🚀 Bonos por avanzar", bd.advancePoints],
  ];
  return (
    <div className="mt-1 rounded-lg bg-wc-dark/60 px-3 py-2 text-xs">
      <p className="mb-1 text-white/40">
        {bd.played} {bd.played === 1 ? "partido jugado" : "partidos jugados"}
      </p>
      {rows.map(([label, v]) => (
        <div key={label} className="flex items-center justify-between py-0.5">
          <span className="text-white/70">{label}</span>
          <span
            className={`font-mono font-bold ${
              v < 0 ? "text-red-400" : v > 0 ? "text-wc-gold" : "text-white/40"
            }`}
          >
            {v > 0 ? `+${v}` : v}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1">
        <span className="font-bold">Total</span>
        <span
          className={`font-mono font-black ${
            bd.total < 0 ? "text-red-400" : "text-wc-gold"
          }`}
        >
          {bd.total}
        </span>
      </div>
    </div>
  );
}

type StandingRow = {
  uid: string;
  name: string;
  total: number;
  teams: { teamId: string; points: number }[];
};

function CompactStandings({
  leagueName,
  standings,
  meUid,
}: {
  leagueName: string;
  standings: StandingRow[];
  meUid?: string;
}) {
  return (
    <div className="card bg-wc-navy/80 p-4">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <p className="font-black tracking-tight">{leagueName}</p>
        <p className="text-xs font-bold text-white/50">
          MundialFantasy&apos;26
        </p>
      </div>
      <table className="w-full">
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.uid}
              className={`border-b border-white/5 last:border-0 ${
                s.uid === meUid ? "text-wc-gold" : ""
              }`}
            >
              <td className="w-8 py-2 text-center text-lg">
                {MEDALS[i] ?? (
                  <span className="text-sm font-bold text-white/40">
                    {i + 1}
                  </span>
                )}
              </td>
              <td className="py-2 font-bold">
                {s.name}
                <span className="ml-2 text-xs font-normal text-white/40">
                  {s.teams.length} eq.
                </span>
              </td>
              <td className="py-2 text-right text-xl font-black">{s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
