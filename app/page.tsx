"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { firebaseConfigured } from "@/lib/firebase";
import { createLeague, joinLeague } from "@/lib/league";
import { getSavedName, saveName, useUser } from "@/lib/useUser";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [name, setName] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<4 | 6 | 8>(6);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setName(getSavedName()), []);

  const ready = !!user && !!name.trim();

  async function handleCreate() {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      saveName(name);
      const id = await createLeague(
        leagueName.trim() || `Liga de ${name.trim()}`,
        maxPlayers,
        user!.uid,
        name.trim()
      );
      router.push(`/liga/${id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!ready || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      saveName(name);
      const id = await joinLeague(code, user!.uid, name.trim());
      router.push(`/liga/${id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!firebaseConfigured) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <h1 className="text-xl font-bold">Falta configurar Firebase</h1>
        <p className="mt-2 text-white/70">
          Copia <code>.env.example</code> a <code>.env.local</code> y agrega las
          credenciales de tu proyecto Firebase (ver README).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          El fantasy del{" "}
          <span className="bg-wc-gradient bg-clip-text text-transparent">
            Mundial 2026
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-white/70">
          Arma tu liga con 4, 6 u 8 amigos, hagan un draft de las 48
          selecciones y sumen puntos con cada gol, victoria y fase superada.
          ¿Quién levanta la copa de tu grupo? 🏆
        </p>
      </section>

      <section className="mx-auto max-w-xl space-y-3">
        <label className="block text-sm font-semibold text-white/70">
          Tu nombre (visible para tu liga)
        </label>
        <input
          className="input"
          placeholder="Ej. Nico"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">🆕 Crear una liga</h2>
          <input
            className="input"
            placeholder="Nombre de la liga"
            value={leagueName}
            maxLength={40}
            onChange={(e) => setLeagueName(e.target.value)}
          />
          <div>
            <p className="mb-2 text-sm text-white/60">Jugadores</p>
            <div className="flex gap-2">
              {([4, 6, 8] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`btn flex-1 border ${
                    maxPlayers === n
                      ? "border-wc-gold bg-wc-gold/15 text-wc-gold"
                      : "border-white/15 hover:bg-white/10"
                  }`}
                >
                  {n}
                  <span className="text-xs font-normal text-white/50">
                    ({48 / n} eq.)
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary w-full"
            disabled={!ready || busy || loading}
            onClick={handleCreate}
          >
            Crear liga
          </button>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-bold">🔑 Unirse con código</h2>
          <p className="text-sm text-white/60">
            Pide el código de invitación al comisionado de tu liga.
          </p>
          <input
            className="input uppercase tracking-widest"
            placeholder="CÓDIGO"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            className="btn-ghost w-full"
            disabled={!ready || busy || loading || !code.trim()}
            onClick={handleJoin}
          >
            Unirme a la liga
          </button>
        </div>
      </section>

      {error && (
        <p className="text-center font-semibold text-red-400">{error}</p>
      )}

      <section className="grid gap-4 text-sm sm:grid-cols-3">
        {[
          ["🎲 Draft en serpiente", "Orden aleatorio que se invierte cada ronda: justo para todos."],
          ["📊 Puntos en vivo", "Goles, victorias, porterías a cero y bonos por avanzar de fase."],
          ["🔒 Ligas privadas", "Cada grupo juega aparte con su código: nadie se mezcla."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <p className="font-bold">{t}</p>
            <p className="mt-1 text-white/60">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
