import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, firebaseConfigured } from "./firebase";
import { DEFAULT_SCORING, League, MatchResult } from "./types";
import { TEAMS } from "./data";

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createLeague(
  name: string,
  maxPlayers: 4 | 6 | 8,
  uid: string,
  displayName: string
): Promise<string> {
  const ref = doc(collection(db, "leagues"));
  const league: League = {
    id: ref.id,
    name,
    code: randomCode(),
    commissioner: uid,
    maxPlayers,
    status: "lobby",
    members: { [uid]: { uid, name: displayName, joinedAt: Date.now() } },
    draftOrder: [],
    picks: [],
    currentPick: 0,
    scoring: DEFAULT_SCORING,
    createdAt: Date.now(),
  };
  await setDoc(ref, league);
  return ref.id;
}

export async function joinLeague(
  code: string,
  uid: string,
  displayName: string
): Promise<string> {
  const q = query(
    collection(db, "leagues"),
    where("code", "==", code.toUpperCase().trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No existe una liga con ese código.");
  const ref = snap.docs[0].ref;

  await runTransaction(db, async (tx) => {
    const docSnap = await tx.get(ref);
    const league = docSnap.data() as League;
    if (league.members[uid]) return; // ya es miembro
    if (Object.keys(league.members).length >= league.maxPlayers)
      throw new Error("La liga ya está llena.");
    if (league.status !== "lobby")
      throw new Error("El draft de esta liga ya comenzó.");
    tx.update(ref, {
      [`members.${uid}`]: { uid, name: displayName, joinedAt: Date.now() },
    });
  });
  return ref.id;
}

export async function startDraft(leagueId: string, uid: string) {
  const ref = doc(db, "leagues", leagueId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const league = snap.data() as League;
    if (league.commissioner !== uid)
      throw new Error("Solo el comisionado puede iniciar el draft.");
    const uids = Object.keys(league.members);
    if (uids.length < 2) throw new Error("Se necesitan al menos 2 jugadores.");
    if (TEAMS.length % uids.length !== 0)
      throw new Error(
        `Con ${uids.length} jugadores los 48 equipos no se reparten parejo. Usa 4, 6 u 8.`
      );
    // orden aleatorio (Fisher-Yates)
    for (let i = uids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uids[i], uids[j]] = [uids[j], uids[i]];
    }
    tx.update(ref, { status: "drafting", draftOrder: uids, currentPick: 0 });
  });
}

/** uid al que le toca elegir en el pick global n (draft tipo serpiente). */
export function pickerAt(league: League, n: number): string {
  const N = league.draftOrder.length;
  const round = Math.floor(n / N);
  const idx = n % N;
  return league.draftOrder[round % 2 === 0 ? idx : N - 1 - idx];
}

export async function makePick(leagueId: string, uid: string, teamId: string) {
  const ref = doc(db, "leagues", leagueId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const league = snap.data() as League;
    if (league.status !== "drafting") throw new Error("El draft no está activo.");
    if (pickerAt(league, league.currentPick) !== uid)
      throw new Error("No es tu turno.");
    if (league.picks.some((p) => p.teamId === teamId))
      throw new Error("Ese equipo ya fue elegido.");
    const picks = [
      ...league.picks,
      { teamId, uid, pickNo: league.currentPick },
    ];
    const done = picks.length === TEAMS.length;
    tx.update(ref, {
      picks,
      currentPick: league.currentPick + 1,
      ...(done ? { status: "active" } : {}),
    });
  });
}

export function useLeague(leagueId: string) {
  const [league, setLeague] = useState<League | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsub = onSnapshot(
      doc(db, "leagues", leagueId),
      (snap) =>
        snap.exists()
          ? setLeague(snap.data() as League)
          : setError("Liga no encontrada."),
      (e) => setError(e.message)
    );
    return unsub;
  }, [leagueId]);
  return { league, error };
}

/** Resultados globales del torneo (compartidos por todas las ligas). */
export function useResults() {
  const [results, setResults] = useState<MatchResult[]>([]);
  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsub = onSnapshot(collection(db, "results"), (snap) => {
      setResults(snap.docs.map((d) => d.data() as MatchResult));
    });
    return unsub;
  }, []);
  return results;
}
