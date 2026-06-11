export type Stage = "GROUP" | "R32" | "R16" | "QF" | "SF" | "F3" | "FINAL";

export interface Team {
  id: string; // código FIFA de 3 letras
  name: string;
  flag: string;
  group: string; // A..L
  pot: 1 | 2 | 3 | 4; // bombo del sorteo, como guía de fuerza para el draft
}

export interface MatchResult {
  id: string;
  stage: Stage;
  group?: string;
  matchday?: number;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  // ganador en penales (solo eliminatorias con empate)
  penWinner?: string | null;
}

export interface ScoringConfig {
  win: number;
  draw: number;
  goalFor: number;
  goalAgainst: number;
  cleanSheet: number;
  advanceR32: number; // clasificar a 32avos (superar grupos)
  advanceR16: number; // ganar en 32avos
  advanceQF: number; // ganar en 16avos
  advanceSF: number; // ganar en cuartos
  advanceFinal: number; // ganar en semis (llegar a la final)
  champion: number; // ganar la final
  thirdPlace: number; // ganar el partido por el 3er lugar
}

export const DEFAULT_SCORING: ScoringConfig = {
  win: 3,
  draw: 1,
  goalFor: 1,
  goalAgainst: -1,
  cleanSheet: 2,
  advanceR32: 5,
  advanceR16: 4,
  advanceQF: 6,
  advanceSF: 8,
  advanceFinal: 10,
  champion: 15,
  thirdPlace: 4,
};

export type LeagueStatus = "lobby" | "drafting" | "active";

export interface LeagueMember {
  uid: string;
  name: string;
  joinedAt: number;
}

export interface Pick {
  teamId: string;
  uid: string;
  pickNo: number; // índice global del pick (0..47)
}

export interface League {
  id: string;
  name: string;
  code: string; // código de invitación
  commissioner: string; // uid del creador
  maxPlayers: 4 | 6 | 8;
  status: LeagueStatus;
  members: Record<string, LeagueMember>;
  draftOrder: string[]; // uids en orden de la primera ronda
  picks: Pick[];
  currentPick: number;
  scoring: ScoringConfig;
  createdAt: number;
}

export interface TeamPointsBreakdown {
  matchPoints: number; // victorias/empates fase de grupos
  goalPoints: number; // goles a favor/en contra
  cleanSheetPoints: number;
  advancePoints: number; // bonos por avanzar de fase
  total: number;
  played: number;
}
