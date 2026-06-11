import { NextResponse } from "next/server";
import { TEAM_MAP, TEAMS } from "@/lib/data";
import { Stage } from "@/lib/types";

// Sincronización con football-data.org (plan gratuito incluye el Mundial).
// La ruta solo normaliza los datos; la escritura a Firestore la hace el
// cliente con su sesión, así no se necesita firebase-admin en el servidor.

const STAGE_MAP: Record<string, Stage> = {
  GROUP_STAGE: "GROUP",
  LAST_32: "R32",
  ROUND_OF_32: "R32",
  LAST_16: "R16",
  ROUND_OF_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  THIRD_PLACE: "F3",
  PLAY_OFF_FOR_THIRD_PLACE: "F3",
  FINAL: "FINAL",
};

// football-data suele usar códigos FIFA en `tla`, pero los nombres sirven de
// respaldo por si alguno difiere.
const NAME_ALIASES: Record<string, string> = {
  netherlands: "NED",
  "south korea": "KOR",
  "korea republic": "KOR",
  "saudi arabia": "KSA",
  "ivory coast": "CIV",
  "côte d'ivoire": "CIV",
  czechia: "CZE",
  "czech republic": "CZE",
  switzerland: "SUI",
  "cape verde": "CPV",
  "cabo verde": "CPV",
  "dr congo": "COD",
  "congo dr": "COD",
  "bosnia and herzegovina": "BIH",
  "new zealand": "NZL",
  "united states": "USA",
  usa: "USA",
  "south africa": "RSA",
  turkey: "TUR",
  türkiye: "TUR",
  curacao: "CUW",
  curaçao: "CUW",
  iran: "IRN",
};

const NAME_TO_ID: Record<string, string> = {
  ...Object.fromEntries(TEAMS.map((t) => [t.name.toLowerCase(), t.id])),
  ...NAME_ALIASES,
};

function resolveTeam(team: { tla?: string; name?: string }): string | null {
  if (team.tla && TEAM_MAP[team.tla]) return team.tla;
  if (team.name) {
    const id = NAME_TO_ID[team.name.toLowerCase()];
    if (id) return id;
  }
  return null;
}

export async function GET() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Falta FOOTBALL_DATA_API_KEY en el servidor. Consigue una gratis en football-data.org y agrégala como variable de entorno.",
      },
      { status: 501 }
    );
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": key }, cache: "no-store" }
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `football-data.org respondió ${res.status}.` },
      { status: 502 }
    );
  }
  const data = await res.json();

  const matches: any[] = [];
  const unmapped = new Set<string>();

  for (const m of data.matches ?? []) {
    if (m.status !== "FINISHED") continue;
    const stage = STAGE_MAP[m.stage];
    if (!stage) continue;

    const teamA = resolveTeam(m.homeTeam ?? {});
    const teamB = resolveTeam(m.awayTeam ?? {});
    if (!teamA) unmapped.add(m.homeTeam?.name ?? "?");
    if (!teamB) unmapped.add(m.awayTeam?.name ?? "?");
    if (!teamA || !teamB) continue;

    const s = m.score ?? {};
    let scoreA = s.fullTime?.home ?? null;
    let scoreB = s.fullTime?.away ?? null;
    let penWinner: string | null = null;

    // Con prórroga/penales, fullTime puede incluir los penales: usamos
    // tiempo regular + prórroga para que los goles cuenten bien.
    if (s.duration && s.duration !== "REGULAR") {
      const reg = s.regularTime ?? s.fullTime ?? {};
      const et = s.extraTime ?? {};
      scoreA = (reg.home ?? 0) + (et.home ?? 0);
      scoreB = (reg.away ?? 0) + (et.away ?? 0);
      if (s.duration === "PENALTY_SHOOTOUT") {
        penWinner = s.winner === "HOME_TEAM" ? teamA : teamB;
      }
    }
    if (scoreA == null || scoreB == null) continue;

    matches.push({
      stage,
      group: m.group ? m.group.replace("GROUP_", "") : null,
      matchday: m.matchday ?? null,
      teamA,
      teamB,
      scoreA,
      scoreB,
      penWinner,
    });
  }

  return NextResponse.json({ matches, unmapped: Array.from(unmapped) });
}
