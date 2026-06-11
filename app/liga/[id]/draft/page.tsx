"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PotChip } from "@/components/TeamBadge";
import { GROUPS, TEAMS, TEAM_MAP } from "@/lib/data";
import { makePick, pickerAt, useLeague } from "@/lib/league";
import { useUser } from "@/lib/useUser";

export default function DraftPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const { league, error } = useLeague(params.id);
  const [pickError, setPickError] = useState("");
  const [busy, setBusy] = useState(false);

  const pickedBy = useMemo(() => {
    const map: Record<string, string> = {};
    league?.picks.forEach((p) => (map[p.teamId] = p.uid));
    return map;
  }, [league?.picks]);

  if (error) return <p className="text-center text-red-400">{error}</p>;
  if (!league) return <p className="text-center text-white/50">Cargando…</p>;

  if (league.status === "lobby")
    return (
      <p className="text-center text-white/60">
        El draft aún no comienza.{" "}
        <Link href={`/liga/${league.id}`} className="text-wc-gold underline">
          Volver a la liga
        </Link>
      </p>
    );

  const N = league.draftOrder.length;
  const drafting = league.status === "drafting";
  const currentUid = drafting ? pickerAt(league, league.currentPick) : null;
  const myTurn = drafting && currentUid === user?.uid;
  const round = Math.floor(league.currentPick / N) + 1;
  const totalRounds = TEAMS.length / N;

  async function pick(teamId: string) {
    if (!myTurn || busy) return;
    setBusy(true);
    setPickError("");
    try {
      await makePick(league!.id, user!.uid, teamId);
    } catch (e: any) {
      setPickError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Draft · {league.name}</h1>
        <Link href={`/liga/${league.id}`} className="btn-ghost text-sm">
          ← Liga
        </Link>
      </div>

      {drafting ? (
        <div
          className={`card text-center ${
            myTurn ? "border-wc-gold shadow-glow" : ""
          }`}
        >
          <p className="text-sm text-white/50">
            Ronda {round} de {totalRounds} · Pick{" "}
            {league.currentPick + 1} de {TEAMS.length}
          </p>
          <p className="mt-1 text-2xl font-black">
            {myTurn ? (
              <span className="text-wc-gold">¡Es tu turno! Elige un equipo 👇</span>
            ) : (
              <>Elige: {league.members[currentUid!]?.name}</>
            )}
          </p>
          {pickError && <p className="mt-2 text-red-400">{pickError}</p>}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-2xl font-black text-wc-gold">✅ ¡Draft completado!</p>
          <Link href={`/liga/${league.id}`} className="btn-primary mt-3">
            Ver clasificación
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {league.draftOrder.map((uid, i) => (
          <span
            key={uid}
            className={`chip px-3 py-1 ${
              uid === currentUid
                ? "bg-wc-gold/20 text-wc-gold"
                : "bg-white/10 text-white/70"
            }`}
          >
            {i + 1}. {league.members[uid]?.name} (
            {league.picks.filter((p) => p.uid === uid).length})
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g} className="card p-4">
            <p className="mb-2 font-black text-white/40">Grupo {g}</p>
            <div className="space-y-1.5">
              {TEAMS.filter((t) => t.group === g).map((t) => {
                const owner = pickedBy[t.id];
                return (
                  <button
                    key={t.id}
                    disabled={!myTurn || !!owner || busy}
                    onClick={() => pick(t.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      owner
                        ? "bg-white/5 opacity-50"
                        : myTurn
                        ? "bg-white/10 hover:bg-wc-gold/20 hover:text-wc-gold"
                        : "bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{t.flag}</span>
                      {t.name}
                    </span>
                    {owner ? (
                      <span className="text-xs text-white/50">
                        {league.members[owner]?.name}
                      </span>
                    ) : (
                      <PotChip pot={t.pot} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {league.picks.length > 0 && (
        <div className="card">
          <p className="mb-2 font-bold">Historial de picks</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[...league.picks].reverse().map((p) => (
              <span key={p.teamId} className="chip bg-white/10">
                #{p.pickNo + 1} {TEAM_MAP[p.teamId]?.flag}{" "}
                {TEAM_MAP[p.teamId]?.name} → {league.members[p.uid]?.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
