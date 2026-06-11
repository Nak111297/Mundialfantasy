"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { updateScoring, useLeague } from "@/lib/league";
import { DEFAULT_SCORING, ScoringConfig } from "@/lib/types";
import { useUser } from "@/lib/useUser";

const FIELDS: [keyof ScoringConfig, string][] = [
  ["goalFor", "Gol a favor"],
  ["goalAgainst", "Gol en contra"],
  ["cleanSheet", "Portería a cero"],
  ["win", "Victoria en fase de grupos"],
  ["draw", "Empate en fase de grupos"],
  ["advanceR32", "Clasificar a 32avos"],
  ["advanceR16", "Ganar en 32avos"],
  ["advanceQF", "Ganar en octavos"],
  ["advanceSF", "Ganar en cuartos"],
  ["advanceFinal", "Ganar la semifinal"],
  ["champion", "Campeón del mundo"],
  ["thirdPlace", "Ganar el 3er lugar"],
];

export default function SettingsPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const { league, error } = useLeague(params.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (league && !loaded) {
      setValues(
        Object.fromEntries(
          FIELDS.map(([k]) => [k, String(league.scoring[k] ?? 0)])
        )
      );
      setLoaded(true);
    }
  }, [league, loaded]);

  if (error) return <p className="text-center text-red-400">{error}</p>;
  if (!league || !loaded)
    return <p className="text-center text-white/50">Cargando…</p>;

  const isCommissioner = user?.uid === league.commissioner;
  const allValid = FIELDS.every(([k]) => /^-?\d+$/.test(values[k] ?? ""));

  function setDefaults() {
    setValues(
      Object.fromEntries(FIELDS.map(([k]) => [k, String(DEFAULT_SCORING[k])]))
    );
  }

  async function save() {
    if (!allValid || !isCommissioner) return;
    setBusy(true);
    setMsg("");
    try {
      const scoring = Object.fromEntries(
        FIELDS.map(([k]) => [k, parseInt(values[k], 10)])
      ) as unknown as ScoringConfig;
      await updateScoring(league!.id, user!.uid, scoring);
      setMsg("✅ Puntaje guardado. Los puntos de la liga se recalcularon.");
    } catch (e: any) {
      setMsg(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">⚙️ Ajustes de puntaje</h1>
        <Link href={`/liga/${league.id}`} className="btn-ghost text-sm">
          ← Liga
        </Link>
      </div>

      {!isCommissioner && (
        <p className="card text-sm text-white/60">
          Solo el comisionado ({league.members[league.commissioner]?.name})
          puede modificar el puntaje de la liga.
        </p>
      )}

      <div className="card grid gap-3 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <label key={k} className="flex items-center justify-between gap-3 text-sm">
            <span>{label}</span>
            <input
              className="input w-20 text-center font-mono"
              inputMode="numeric"
              value={values[k] ?? ""}
              disabled={!isCommissioner}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  [k]: e.target.value.replace(/[^\d-]/g, ""),
                }))
              }
            />
          </label>
        ))}
      </div>

      {isCommissioner && (
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={busy || !allValid} onClick={save}>
            Guardar puntaje
          </button>
          <button className="btn-ghost text-sm" disabled={busy} onClick={setDefaults}>
            Restaurar valores por defecto
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-white/70">{msg}</p>}

      <p className="card text-sm text-white/60">
        ⚠️ Los puntos se calculan siempre con el puntaje vigente: cualquier
        cambio recalcula <strong>retroactivamente</strong> toda la
        clasificación de la liga. Lo ideal es acordar las reglas antes del
        draft y no tocarlas después.
      </p>
    </div>
  );
}
