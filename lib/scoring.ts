import { MatchResult, ScoringConfig, TeamPointsBreakdown } from "./types";

function emptyBreakdown(): TeamPointsBreakdown {
  return {
    matchPoints: 0,
    goalPoints: 0,
    cleanSheetPoints: 0,
    advancePoints: 0,
    total: 0,
    played: 0,
  };
}

function winnerOf(r: MatchResult): string | null {
  if (r.scoreA == null || r.scoreB == null) return null;
  if (r.scoreA > r.scoreB) return r.teamA;
  if (r.scoreB > r.scoreA) return r.teamB;
  return r.penWinner ?? null;
}

/**
 * Calcula los puntos de cada selección a partir de los resultados cargados.
 *
 * - Fase de grupos: puntos por victoria/empate, goles a favor (+), goles en
 *   contra (-) y portería a cero.
 * - Eliminatorias: solo goles y portería a cero (los penales no cuentan como
 *   goles); el premio grande viene de los bonos por avanzar.
 * - Los bonos por avanzar se infieren de la presencia del equipo en partidos
 *   de rondas posteriores: jugar 32avos implica haber superado el grupo, etc.
 */
export function computeTeamPoints(
  results: MatchResult[],
  cfg: ScoringConfig
): Record<string, TeamPointsBreakdown> {
  const pts: Record<string, TeamPointsBreakdown> = {};
  const get = (id: string) => (pts[id] ??= emptyBreakdown());

  const appeared: Record<string, Set<string>> = {};
  const mark = (team: string, stage: string) =>
    (appeared[team] ??= new Set()).add(stage);

  for (const r of results) {
    if (r.scoreA == null || r.scoreB == null) continue;
    const a = get(r.teamA);
    const b = get(r.teamB);
    a.played++;
    b.played++;

    a.goalPoints += r.scoreA * cfg.goalFor + r.scoreB * cfg.goalAgainst;
    b.goalPoints += r.scoreB * cfg.goalFor + r.scoreA * cfg.goalAgainst;
    if (r.scoreB === 0) a.cleanSheetPoints += cfg.cleanSheet;
    if (r.scoreA === 0) b.cleanSheetPoints += cfg.cleanSheet;

    if (r.stage === "GROUP") {
      if (r.scoreA > r.scoreB) a.matchPoints += cfg.win;
      else if (r.scoreB > r.scoreA) b.matchPoints += cfg.win;
      else {
        a.matchPoints += cfg.draw;
        b.matchPoints += cfg.draw;
      }
    } else {
      mark(r.teamA, r.stage);
      mark(r.teamB, r.stage);
      const w = winnerOf(r);
      if (w) mark(w, `WIN_${r.stage}`);
    }
  }

  const stageBonus: [string, keyof ScoringConfig][] = [
    ["R32", "advanceR32"],
    ["R16", "advanceR16"],
    ["QF", "advanceQF"],
    ["SF", "advanceSF"],
    ["FINAL", "advanceFinal"],
    ["WIN_FINAL", "champion"],
    ["WIN_F3", "thirdPlace"],
  ];
  for (const [team, stages] of Object.entries(appeared)) {
    const t = get(team);
    for (const [stage, key] of stageBonus) {
      if (stages.has(stage)) t.advancePoints += cfg[key];
    }
  }

  for (const t of Object.values(pts)) {
    t.total =
      t.matchPoints + t.goalPoints + t.cleanSheetPoints + t.advancePoints;
  }
  return pts;
}
