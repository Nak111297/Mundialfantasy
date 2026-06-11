"use client";

import { deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { useMemo, useState } from "react";
import { GROUPS, STAGE_LABELS, TEAMS, TEAM_MAP, groupFixtures } from "@/lib/data";
import { db } from "@/lib/firebase";
import { useResults } from "@/lib/league";
import { MatchResult, Stage } from "@/lib/types";
import { useUser } from "@/lib/useUser";

const KO_STAGES: Stage[] = ["R32", "R16", "QF", "SF", "F3", "FINAL"];

export default function ResultsPage() {
  const { user } = useUser();
  const results = useResults();
  const [tab, setTab] = useState<string>("A");
  const resultMap = useMemo(
    () => Object.fromEntries(results.map((r) => [r.id, r])),
    [results]
  );

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
        <KnockoutEditor results={results} canEdit={!!user} />
      ) : (
        <div className="space-y-3">
          {groupFixtures()
            .filter((f) => f.group === tab)
            .map((f) => (
              <GroupMatchRow key={f.id} fixture={f} saved={resultMap[f.id]} canEdit={!!user} />
            ))}
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
        const id =
          idByPair.get(pairKey(m.stage, m.teamA, m.teamB)) ??
          `KO-${m.stage}-${m.teamA}-${m.teamB}`;
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
        <p className="font-bold">Sincronización automática</p>
        <p className="text-white/50">
          Trae los marcadores oficiales desde football-data.org (la captura
          manual sigue disponible como respaldo).
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
}: {
  fixture: Omit<MatchResult, "scoreA" | "scoreB">;
  saved?: MatchResult;
  canEdit: boolean;
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
        {TEAM_MAP[fixture.teamA]?.name} {TEAM_MAP[fixture.teamA]?.flag}
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
        {TEAM_MAP[fixture.teamB]?.flag} {TEAM_MAP[fixture.teamB]?.name}
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

function KnockoutEditor({
  results,
  canEdit,
}: {
  results: MatchResult[];
  canEdit: boolean;
}) {
  const [stage, setStage] = useState<Stage>("R32");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [penWinner, setPenWinner] = useState("");
  const [busy, setBusy] = useState(false);

  const koResults = results
    .filter((r) => r.stage !== "GROUP")
    .sort((x, y) => KO_STAGES.indexOf(x.stage) - KO_STAGES.indexOf(y.stage));

  const isDraw = scoreA !== "" && scoreA === scoreB;
  const valid =
    teamA && teamB && teamA !== teamB && scoreA !== "" && scoreB !== "" &&
    (!isDraw || penWinner);

  async function save() {
    if (!valid) return;
    setBusy(true);
    const id = `KO-${stage}-${teamA}-${teamB}`;
    const result: MatchResult = {
      id,
      stage,
      teamA,
      teamB,
      scoreA: parseInt(scoreA, 10),
      scoreB: parseInt(scoreB, 10),
      penWinner: isDraw ? penWinner : null,
    };
    await setDoc(doc(db, "results", id), result);
    setTeamA("");
    setTeamB("");
    setScoreA("");
    setScoreB("");
    setPenWinner("");
    setBusy(false);
  }

  const teamOptions = [...TEAMS].sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <p className="font-bold">Agregar partido de eliminatoria</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {KO_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <div />
          <select className="input" value={teamA} onChange={(e) => setTeamA(e.target.value)}>
            <option value="">— Equipo local —</option>
            {teamOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <select className="input" value={teamB} onChange={(e) => setTeamB(e.target.value)}>
            <option value="">— Equipo visitante —</option>
            {teamOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Goles local (con prórroga)"
            inputMode="numeric"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value.replace(/\D/g, ""))}
          />
          <input
            className="input"
            placeholder="Goles visitante (con prórroga)"
            inputMode="numeric"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {isDraw && (
          <select className="input" value={penWinner} onChange={(e) => setPenWinner(e.target.value)}>
            <option value="">— ¿Quién ganó en penales? —</option>
            {[teamA, teamB].filter(Boolean).map((id) => (
              <option key={id} value={id}>
                {TEAM_MAP[id]?.flag} {TEAM_MAP[id]?.name}
              </option>
            ))}
          </select>
        )}
        <button className="btn-primary" disabled={!canEdit || !valid || busy} onClick={save}>
          Guardar partido
        </button>
      </div>

      {koResults.length > 0 && (
        <div className="space-y-2">
          {koResults.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="chip bg-white/10">{STAGE_LABELS[r.stage]}</span>
              <span>
                {TEAM_MAP[r.teamA]?.flag} {TEAM_MAP[r.teamA]?.name}{" "}
                <span className="mx-1 font-mono font-bold text-wc-gold">
                  {r.scoreA}-{r.scoreB}
                </span>{" "}
                {TEAM_MAP[r.teamB]?.name} {TEAM_MAP[r.teamB]?.flag}
                {r.penWinner && (
                  <span className="ml-2 text-white/50">
                    (pen: {TEAM_MAP[r.penWinner]?.name})
                  </span>
                )}
              </span>
              <button
                className="btn-ghost px-2 py-1 text-xs text-red-400"
                disabled={!canEdit}
                onClick={() => deleteDoc(doc(db, "results", r.id))}
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
