"use client";

import { doc, setDoc, writeBatch } from "firebase/firestore";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GROUPS, STAGE_LABELS, TEAM_MAP, groupFixtures } from "@/lib/data";
import { db } from "@/lib/firebase";
import { useResults } from "@/lib/league";
import { eliminatedTeams, matchWinner } from "@/lib/bracket";
import { MatchResult } from "@/lib/types";
import { useUser } from "@/lib/useUser";

export default function ResultsPage() {
  const { user } = useUser();
  const results = useResults();
  const [tab, setTab] = useState<string>("A");
  const resultMap = useMemo(
    () => Object.fromEntries(results.map((r) => [r.id, r])),
    [results]
  );
  const eliminated = useMemo(() => eliminatedTeams(results), [results]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Resultados del torneo</h1>
      <p className="text-sm text-white/60">
        Los resultados son globales: al capturarlos aquí se actualizan los
        puntos de <strong>todas</strong> las ligas al instante.
      </p>

      <SyncPanel results={results} canEdit={!!user} />

      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setTab(g)}
            className={`btn px-3 py-1.5 text-sm ${
              tab === g ? "bg-wc-gold text-wc-dark" : "border border-white/15 hover:bg-white/10"
            }`}
          >
            {g}
          </button>
        ))}
        <button
          onClick={() => setTab("KO")}
          className={`btn px-3 py-1.5 text-sm ${
            tab === "KO" ? "bg-wc-gold text-wc-dark" : "border border-white/15 hover:bg-white/10"
          }`}
        >
          🏆 Eliminatorias
        </button>
      </div>

      {tab === "KO" ? (
        <KnockoutSummary results={results} eliminated={eliminated} />
      ) : (
        <div className="space-y-3">
          {groupFixtures()
            .filter((f) => f.group === tab)
            .map((f) => (
              <GroupMatchRow
                key={f.id}
                fixture={f}
                saved={resultMap[f.id]}
                canEdit={!!user}
                eliminated={eliminated}
              />
            ))}
        </div>
      )}
    </div>
  );
}

const KO_ORDER = ["R32", "R16", "QF", "SF", "F3", "FINAL"];

function TeamLabel({
  teamId,
  eliminated,
  flagFirst,
}: {
  teamId: string;
  eliminated: Set<string>;
  flagFirst?: boolean;
}) {
  const t = TEAM_MAP[teamId];
  const out = eliminated.has(teamId);
  return (
    <span
      className={out ? "text-white/35 line-through decoration-red-400/70" : ""}
      title={out ? "Eliminado" : undefined}
    >
      {flagFirst ? (
        <>
          {t?.flag} {t?.name}
        </>
      ) : (
        <>
          {t?.name} {t?.flag}
        </>
      )}
      {out && <span className="ml-1 no-underline">❌</span>}
    </span>
  );
}

function KnockoutSummary({
  results,
  eliminated,
}: {
  results: MatchResult[];
  eliminated: Set<string>;
}) {
  const ko = results
    .filter((r) => r.stage !== "GROUP" && r.scoreA != null)
    .sort(
      (a, b) => KO_ORDER.indexOf(a.stage) - KO_ORDER.indexOf(b.stage)
    );

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-bold">Las eliminatorias se llenan en el bracket</p>
          <p className="text-white/50">
            Eliges los clasificados en 32avos y los ganadores avanzan solos.
          </p>
        </div>
        <Link href="/bracket" className="btn-primary text-sm">
          🏆 Abrir bracket
        </Link>
      </div>

      {ko.length > 0 && (
        <div className="space-y-2">
          {ko.map((r) => {
            const w = matchWinner(r);
            return (
              <div
                key={r.id}
                className="card flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="chip bg-white/10">{STAGE_LABELS[r.stage]}</span>
                <span>
                  <TeamLabel teamId={r.teamA} eliminated={eliminated} flagFirst />
                  <span className="mx-1 font-mono font-bold text-wc-gold">
                    {r.scoreA}-{r.scoreB}
                  </span>
                  <TeamLabel teamId={r.teamB} eliminated={eliminated} />
                  {r.penWinner && (
                    <span className="ml-2 text-white/50">
                      (pen: {TEAM_MAP[r.penWinner]?.name})
                    </span>
                  )}
                  {w && (
                    <span className="ml-2 text-xs text-wc-gold">
                      avanza {TEAM_MAP[w]?.flag}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const pairKey = (stage: string, a: string, b: string) =>
  `${stage}|${[a, b].sort().join("-")}`;

function SyncPanel({
  results,
  canEdit,
}: {
  results: MatchResult[];
  canEdit: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function sync() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      // Reutiliza el id del fixture de grupos o de un resultado ya capturado
      // para el mismo cruce, así la sincronización nunca duplica partidos.
      const idByPair = new Map<string, string>();
      groupFixtures().forEach((f) =>
        idByPair.set(pairKey("GROUP", f.teamA, f.teamB), f.id)
      );
      results.forEach((r) =>
        idByPair.set(pairKey(r.stage, r.teamA, r.teamB), r.id)
      );

      const batch = writeBatch(db);
      let n = 0;
      for (const m of data.matches as Omit<MatchResult, "id">[]) {
        // Las eliminatorias se capturan en el bracket; el sync solo trae la
        // fase de grupos para no chocar con los partidos del cuadro.
        if (m.stage !== "GROUP") continue;
        const id = idByPair.get(pairKey(m.stage, m.teamA, m.teamB));
        if (!id) continue; // sin fixture conocido para ese cruce de grupo
        batch.set(doc(db, "results", id), { ...m, id });
        n++;
      }
      await batch.commit();
      const extra = data.unmapped?.length
        ? ` · Sin mapear: ${data.unmapped.join(", ")}`
        : "";
      setMsg(`✅ ${n} partidos sincronizados${extra}`);
    } catch (e: any) {
      setMsg(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="text-sm">
        <p className="font-bold">Sincronización automática (fase de grupos)</p>
        <p className="text-white/50">
          Trae los marcadores de grupos desde football-data.org. La captura
          manual sigue disponible y las eliminatorias se llenan en el bracket.
        </p>
      </div>
      <button className="btn-primary text-sm" disabled={!canEdit || busy} onClick={sync}>
        {busy ? "Sincronizando…" : "🔄 Sincronizar resultados"}
      </button>
      {msg && <p className="w-full text-sm text-white/70">{msg}</p>}
    </div>
  );
}

function GroupMatchRow({
  fixture,
  saved,
  canEdit,
  eliminated,
}: {
  fixture: Omit<MatchResult, "scoreA" | "scoreB">;
  saved?: MatchResult;
  canEdit: boolean;
  eliminated: Set<string>;
}) {
  const [a, setA] = useState<string>(saved?.scoreA?.toString() ?? "");
  const [b, setB] = useState<string>(saved?.scoreB?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const dirty =
    a !== (saved?.scoreA?.toString() ?? "") || b !== (saved?.scoreB?.toString() ?? "");

  async function save() {
    if (a === "" || b === "") return;
    setBusy(true);
    const result: MatchResult = {
      ...fixture,
      scoreA: parseInt(a, 10),
      scoreB: parseInt(b, 10),
    };
    await setDoc(doc(db, "results", fixture.id), result);
    setBusy(false);
  }

  return (
    <div className="card flex flex-wrap items-center gap-3 py-3">
      <span className="text-xs text-white/40">J{fixture.matchday}</span>
      <span className="flex-1 text-right text-sm">
        <TeamLabel teamId={fixture.teamA} eliminated={eliminated} />
      </span>
      <input
        className="input w-14 text-center"
        inputMode="numeric"
        value={a}
        onChange={(e) => setA(e.target.value.replace(/\D/g, ""))}
        disabled={!canEdit}
      />
      <span className="text-white/40">-</span>
      <input
        className="input w-14 text-center"
        inputMode="numeric"
        value={b}
        onChange={(e) => setB(e.target.value.replace(/\D/g, ""))}
        disabled={!canEdit}
      />
      <span className="flex-1 text-sm">
        <TeamLabel teamId={fixture.teamB} eliminated={eliminated} flagFirst />
      </span>
      <button
        className="btn-primary px-3 py-1.5 text-sm"
        disabled={!canEdit || busy || !dirty || a === "" || b === ""}
        onClick={save}
      >
        {saved ? "Actualizar" : "Guardar"}
      </button>
    </div>
  );
}

