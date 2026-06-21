import { GROUPS, TEAMS } from "./data";
import { MatchResult, Stage } from "./types";

// Estructura del cuadro de eliminatorias. Cada "slot" es un partido con un id
// determinístico por posición (KO-R32-0 …). Los partidos de R16 en adelante se
// alimentan del ganador (o perdedor, para el 3er lugar) de partidos previos,
// así los equipos avanzan solos sin volver a elegirlos a mano.
export interface BracketSlot {
  id: string;
  stage: Stage;
  index: number;
  feedA?: { id: string; take: "W" | "L" };
  feedB?: { id: string; take: "W" | "L" };
}

function build(): BracketSlot[] {
  const slots: BracketSlot[] = [];
  for (let i = 0; i < 16; i++)
    slots.push({ id: `KO-R32-${i}`, stage: "R32", index: i });
  for (let i = 0; i < 8; i++)
    slots.push({
      id: `KO-R16-${i}`,
      stage: "R16",
      index: i,
      feedA: { id: `KO-R32-${2 * i}`, take: "W" },
      feedB: { id: `KO-R32-${2 * i + 1}`, take: "W" },
    });
  for (let i = 0; i < 4; i++)
    slots.push({
      id: `KO-QF-${i}`,
      stage: "QF",
      index: i,
      feedA: { id: `KO-R16-${2 * i}`, take: "W" },
      feedB: { id: `KO-R16-${2 * i + 1}`, take: "W" },
    });
  for (let i = 0; i < 2; i++)
    slots.push({
      id: `KO-SF-${i}`,
      stage: "SF",
      index: i,
      feedA: { id: `KO-QF-${2 * i}`, take: "W" },
      feedB: { id: `KO-QF-${2 * i + 1}`, take: "W" },
    });
  slots.push({
    id: "KO-FINAL-0",
    stage: "FINAL",
    index: 0,
    feedA: { id: "KO-SF-0", take: "W" },
    feedB: { id: "KO-SF-1", take: "W" },
  });
  slots.push({
    id: "KO-F3-0",
    stage: "F3",
    index: 0,
    feedA: { id: "KO-SF-0", take: "L" },
    feedB: { id: "KO-SF-1", take: "L" },
  });
  return slots;
}

export const BRACKET = build();
export const BRACKET_BY_ID: Record<string, BracketSlot> = Object.fromEntries(
  BRACKET.map((s) => [s.id, s])
);
export const BRACKET_ROUNDS: { stage: Stage; slots: BracketSlot[] }[] = (
  ["R32", "R16", "QF", "SF", "FINAL"] as Stage[]
).map((stage) => ({ stage, slots: BRACKET.filter((s) => s.stage === stage) }));

export function matchWinner(r?: MatchResult | null): string | null {
  if (!r || r.scoreA == null || r.scoreB == null) return null;
  if (r.scoreA > r.scoreB) return r.teamA;
  if (r.scoreB > r.scoreA) return r.teamB;
  return r.penWinner ?? null;
}

export function matchLoser(r?: MatchResult | null): string | null {
  const w = matchWinner(r);
  if (!r || !w) return null;
  return w === r.teamA ? r.teamB : r.teamA;
}

/** Equipos que ocupan cada slot, resolviendo los feeders de rondas previas. */
export function slotTeams(
  slot: BracketSlot,
  byId: Record<string, MatchResult>
): { teamA: string | null; teamB: string | null } {
  const self = byId[slot.id];
  const resolve = (
    feed: BracketSlot["feedA"],
    stored: string | null | undefined
  ) => {
    if (!feed) return stored ?? null; // 32avos: equipo elegido a mano
    const fr = byId[feed.id];
    return feed.take === "W" ? matchWinner(fr) : matchLoser(fr);
  };
  return {
    teamA: resolve(slot.feedA, self?.teamA),
    teamB: resolve(slot.feedB, self?.teamB),
  };
}

export interface StandingRow {
  teamId: string;
  played: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
}

/** Tabla de cada grupo calculada desde los resultados de fase de grupos. */
export function groupStandings(
  results: MatchResult[]
): Record<string, StandingRow[]> {
  const byTeam: Record<string, StandingRow> = {};
  TEAMS.forEach((t) => {
    byTeam[t.id] = { teamId: t.id, played: 0, pts: 0, gf: 0, ga: 0, gd: 0 };
  });
  for (const r of results) {
    if (r.stage !== "GROUP" || r.scoreA == null || r.scoreB == null) continue;
    const a = byTeam[r.teamA];
    const b = byTeam[r.teamB];
    if (!a || !b) continue;
    a.played++;
    b.played++;
    a.gf += r.scoreA;
    a.ga += r.scoreB;
    b.gf += r.scoreB;
    b.ga += r.scoreA;
    if (r.scoreA > r.scoreB) a.pts += 3;
    else if (r.scoreB > r.scoreA) b.pts += 3;
    else {
      a.pts++;
      b.pts++;
    }
  }
  Object.values(byTeam).forEach((r) => (r.gd = r.gf - r.ga));
  const out: Record<string, StandingRow[]> = {};
  for (const g of GROUPS) {
    out[g] = TEAMS.filter((t) => t.group === g)
      .map((t) => byTeam[t.id])
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
  }
  return out;
}

/**
 * Conjunto de selecciones ya eliminadas, deducido de los resultados:
 *  - Perdió un partido de eliminatoria (en eliminación directa, queda fuera).
 *  - Terminó última (4°) de su grupo ya completo: nunca clasifica.
 *  - Si los 32avos ya están completos, cualquiera que no esté entre los 32.
 */
export function eliminatedTeams(results: MatchResult[]): Set<string> {
  const byId: Record<string, MatchResult> = {};
  results.forEach((r) => (byId[r.id] = r));
  const out = new Set<string>();

  for (const r of results) {
    if (r.stage === "GROUP") continue;
    const loser = matchLoser(r);
    if (loser) out.add(loser);
  }

  const standings = groupStandings(results);
  for (const g of GROUPS) {
    const rows = standings[g];
    if (rows.every((r) => r.played >= 3)) out.add(rows[3].teamId);
  }

  const r32 = new Set<string>();
  let filled = 0;
  for (let i = 0; i < 16; i++) {
    const { teamA, teamB } = slotTeams(BRACKET_BY_ID[`KO-R32-${i}`], byId);
    if (teamA && teamB) {
      r32.add(teamA);
      r32.add(teamB);
      filled++;
    }
  }
  if (filled === 16) {
    for (const t of TEAMS) if (!r32.has(t.id)) out.add(t.id);
  }

  return out;
}
