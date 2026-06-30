"use client";

import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  BRACKET_BY_ID,
  BRACKET_ROUNDS,
  BracketSlot,
  matchWinner,
  slotTeams,
} from "@/lib/bracket";
import { STAGE_LABELS, TEAMS, TEAM_MAP } from "@/lib/data";
import { db } from "@/lib/firebase";
import { useResults } from "@/lib/league";
import { MatchResult } from "@/lib/types";
import { useUser } from "@/lib/useUser";

const TEAMS_SORTED = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

export default function BracketPage() {
  const { user } = useUser();
  const results = useResults();
  const canEdit = !!user;

  const byId = useMemo(() => {
    const m: Record<string, MatchResult> = {};
    results.forEach((r) => (m[r.id] = r));
    return m;
  }, [results]);

  // Equipos ya colocados en algún partido de 32avos (para no repetirlos).
  const r32Used = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < 16; i++) {
      const r = byId[`KO-R32-${i}`];
      if (r?.teamA) s.add(r.teamA);
      if (r?.teamB) s.add(r.teamB);
    }
    return s;
  }, [byId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">🏆 Bracket de eliminatorias</h1>
          <p className="text-sm text-white/60">
            Elige a los clasificados en la primera ronda y carga los marcadores;
            el ganador avanza solo y la siguiente ronda se llena con su nombre.
            Cada llave se puede ajustar a mano si hiciera falta.
          </p>
        </div>
        <span className="text-3xl">🏆</span>
      </div>

      {!canEdit && (
        <p className="card text-sm text-white/60">
          Cargando sesión… si no aparece, recarga la página. Los marcadores son
          globales para todas las ligas.
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {BRACKET_ROUNDS.map((round) => (
          <div key={round.stage} className="min-w-[280px] flex-1 space-y-3">
            <h2 className="sticky top-0 text-center text-sm font-black uppercase tracking-wide text-wc-gold">
              {STAGE_LABELS[round.stage]}
            </h2>
            <div
              className="flex flex-col justify-around gap-3"
              style={{ minHeight: round.stage === "R32" ? undefined : "100%" }}
            >
              {round.slots.map((slot) => (
                <MatchCard
                  key={slot.id}
                  slot={slot}
                  byId={byId}
                  r32Used={r32Used}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ThirdPlaceCard byId={byId} canEdit={canEdit} />
    </div>
  );
}

async function persist(
  slot: BracketSlot,
  teamA: string,
  teamB: string,
  scoreA: number | null,
  scoreB: number | null,
  penWinner: string | null
) {
  const result: MatchResult = {
    id: slot.id,
    stage: slot.stage,
    teamA,
    teamB,
    scoreA,
    scoreB,
    penWinner: penWinner ?? null,
  };
  await setDoc(doc(db, "results", slot.id), result);
}

function MatchCard({
  slot,
  byId,
  r32Used,
  canEdit,
}: {
  slot: BracketSlot;
  byId: Record<string, MatchResult>;
  r32Used: Set<string>;
  canEdit: boolean;
}) {
  const isR32 = slot.stage === "R32";
  const saved = byId[slot.id];
  const resolved = slotTeams(slot, byId);

  // Equipo por defecto de cada lado: el guardado manualmente o, si no hay, el
  // ganador que avanza de la ronda previa (autocarga). Así las rondas
  // posteriores se llenan solas y el nombre siempre se ve, pero se pueden
  // ajustar a mano si hiciera falta.
  const defA = saved?.teamA || resolved.teamA || "";
  const defB = saved?.teamB || resolved.teamB || "";

  const [selA, setSelA] = useState(defA);
  const [selB, setSelB] = useState(defB);
  const [sa, setSa] = useState(saved?.scoreA?.toString() ?? "");
  const [sb, setSb] = useState(saved?.scoreB?.toString() ?? "");
  const [pen, setPen] = useState(saved?.penWinner ?? "");
  const [busy, setBusy] = useState(false);

  // Mantén el formulario en sync si cambia el resultado guardado o el ganador
  // que viene de la ronda anterior (autocarga al definirse el partido previo).
  useEffect(() => {
    setSelA(saved?.teamA || resolved.teamA || "");
    setSelB(saved?.teamB || resolved.teamB || "");
    setSa(saved?.scoreA?.toString() ?? "");
    setSb(saved?.scoreB?.toString() ?? "");
    setPen(saved?.penWinner ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saved?.teamA,
    saved?.teamB,
    resolved.teamA,
    resolved.teamB,
    saved?.scoreA,
    saved?.scoreB,
    saved?.penWinner,
  ]);

  const teamA = selA;
  const teamB = selB;
  const ready = !!teamA && !!teamB;
  const tie = sa !== "" && sb !== "" && sa === sb;
  const scoresEmpty = sa === "" && sb === "";
  const scoresFilled = sa !== "" && sb !== "";
  const validScores = scoresEmpty || scoresFilled;
  const validPen = !tie || pen === teamA || pen === teamB;
  // Se puede guardar con un solo equipo, para ir armando el cuadro. El marcador
  // solo se habilita cuando los dos rivales están definidos.
  const hasTeam = !!teamA || !!teamB;
  const canSave = hasTeam && validScores && validPen;

  const winner = matchWinner(saved);

  async function save() {
    if (!canSave) return;
    setBusy(true);
    try {
      await persist(
        slot,
        teamA,
        teamB,
        sa === "" ? null : parseInt(sa, 10),
        sb === "" ? null : parseInt(sb, 10),
        tie ? pen : null
      );
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    try {
      await deleteDoc(doc(db, "results", slot.id));
    } finally {
      setBusy(false);
    }
  }

  // Selector de equipo a todo el ancho, en su propia fila para que el nombre
  // del país se vea completo. En 32avos no se pueden repetir equipos; en
  // rondas posteriores se ofrecen todos (el valor por defecto ya viene puesto).
  const selectEl = (side: "A" | "B") => {
    const cur = side === "A" ? selA : selB;
    const options = TEAMS_SORTED.filter(
      (t) => !isR32 || !r32Used.has(t.id) || t.id === cur
    );
    return (
      <select
        className="input w-full px-2 py-2 text-sm text-wc-sand"
        value={cur}
        disabled={!canEdit}
        onChange={(e) =>
          side === "A" ? setSelA(e.target.value) : setSelB(e.target.value)
        }
      >
        <option value="" className="bg-wc-navy text-wc-sand">
          — por definir —
        </option>
        {options.map((t) => (
          <option key={t.id} value={t.id} className="bg-wc-navy text-wc-sand">
            {t.flag} {t.name}
          </option>
        ))}
      </select>
    );
  };

  const scoreBox = (score: string, setScore: (v: string) => void) => (
    <input
      className="input w-12 px-1 py-1.5 text-center text-sm"
      inputMode="numeric"
      placeholder="–"
      value={score}
      disabled={!canEdit || !ready}
      onChange={(e) => setScore(e.target.value.replace(/\D/g, ""))}
    />
  );

  return (
    <div className="card space-y-2 p-2.5">
      {selectEl("A")}
      {selectEl("B")}
      <div className="flex items-center justify-center gap-2">
        {scoreBox(sa, setSa)}
        <span className="text-white/40">–</span>
        {scoreBox(sb, setSb)}
      </div>
      {winner && (
        <p className="text-center text-xs text-wc-gold">
          ✅ Avanza {TEAM_MAP[winner]?.flag} {TEAM_MAP[winner]?.name}
        </p>
      )}
      {tie && (
        <select
          className="input px-2 py-1 text-xs"
          value={pen}
          disabled={!canEdit}
          onChange={(e) => setPen(e.target.value)}
        >
          <option value="">— ganó en penales —</option>
          {[teamA, teamB].filter(Boolean).map((id) => (
            <option key={id} value={id}>
              🥅 {TEAM_MAP[id]?.name}
            </option>
          ))}
        </select>
      )}
      {canEdit && (
        <div className="flex gap-1.5">
          <button
            className="btn-primary flex-1 px-2 py-1 text-xs"
            disabled={!canSave || busy}
            onClick={save}
          >
            Guardar
          </button>
          {saved && (
            <button
              className="btn-ghost px-2 py-1 text-xs text-red-400"
              disabled={busy}
              onClick={clear}
              title="Limpiar partido"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ThirdPlaceCard({
  byId,
  canEdit,
}: {
  byId: Record<string, MatchResult>;
  canEdit: boolean;
}) {
  const slot = BRACKET_BY_ID["KO-F3-0"];
  return (
    <div className="mx-auto max-w-sm">
      <h2 className="mb-2 text-center text-sm font-black uppercase tracking-wide text-wc-gold">
        🥉 {STAGE_LABELS.F3}
      </h2>
      <MatchCard slot={slot} byId={byId} r32Used={new Set()} canEdit={canEdit} />
    </div>
  );
}
