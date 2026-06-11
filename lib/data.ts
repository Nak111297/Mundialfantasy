import { MatchResult, Team } from "./types";

// Los 48 clasificados al Mundial 2026, según el sorteo del 5 de diciembre de 2025.
export const TEAMS: Team[] = [
  // Grupo A
  { id: "MEX", name: "México", flag: "🇲🇽", group: "A", pot: 1 },
  { id: "RSA", name: "Sudáfrica", flag: "🇿🇦", group: "A", pot: 4 },
  { id: "KOR", name: "Corea del Sur", flag: "🇰🇷", group: "A", pot: 3 },
  { id: "CZE", name: "Chequia", flag: "🇨🇿", group: "A", pot: 2 },
  // Grupo B
  { id: "CAN", name: "Canadá", flag: "🇨🇦", group: "B", pot: 1 },
  { id: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦", group: "B", pot: 4 },
  { id: "QAT", name: "Catar", flag: "🇶🇦", group: "B", pot: 3 },
  { id: "SUI", name: "Suiza", flag: "🇨🇭", group: "B", pot: 2 },
  // Grupo C
  { id: "BRA", name: "Brasil", flag: "🇧🇷", group: "C", pot: 1 },
  { id: "MAR", name: "Marruecos", flag: "🇲🇦", group: "C", pot: 2 },
  { id: "HAI", name: "Haití", flag: "🇭🇹", group: "C", pot: 4 },
  { id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", pot: 3 },
  // Grupo D
  { id: "USA", name: "Estados Unidos", flag: "🇺🇸", group: "D", pot: 1 },
  { id: "AUS", name: "Australia", flag: "🇦🇺", group: "D", pot: 2 },
  { id: "PAR", name: "Paraguay", flag: "🇵🇾", group: "D", pot: 3 },
  { id: "TUR", name: "Turquía", flag: "🇹🇷", group: "D", pot: 4 },
  // Grupo E
  { id: "GER", name: "Alemania", flag: "🇩🇪", group: "E", pot: 1 },
  { id: "CUW", name: "Curazao", flag: "🇨🇼", group: "E", pot: 4 },
  { id: "CIV", name: "Costa de Marfil", flag: "🇨🇮", group: "E", pot: 3 },
  { id: "ECU", name: "Ecuador", flag: "🇪🇨", group: "E", pot: 2 },
  // Grupo F
  { id: "NED", name: "Países Bajos", flag: "🇳🇱", group: "F", pot: 1 },
  { id: "JPN", name: "Japón", flag: "🇯🇵", group: "F", pot: 2 },
  { id: "SWE", name: "Suecia", flag: "🇸🇪", group: "F", pot: 4 },
  { id: "TUN", name: "Túnez", flag: "🇹🇳", group: "F", pot: 3 },
  // Grupo G
  { id: "BEL", name: "Bélgica", flag: "🇧🇪", group: "G", pot: 1 },
  { id: "EGY", name: "Egipto", flag: "🇪🇬", group: "G", pot: 3 },
  { id: "IRN", name: "Irán", flag: "🇮🇷", group: "G", pot: 2 },
  { id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", group: "G", pot: 4 },
  // Grupo H
  { id: "ESP", name: "España", flag: "🇪🇸", group: "H", pot: 1 },
  { id: "CPV", name: "Cabo Verde", flag: "🇨🇻", group: "H", pot: 4 },
  { id: "KSA", name: "Arabia Saudita", flag: "🇸🇦", group: "H", pot: 3 },
  { id: "URU", name: "Uruguay", flag: "🇺🇾", group: "H", pot: 2 },
  // Grupo I
  { id: "FRA", name: "Francia", flag: "🇫🇷", group: "I", pot: 1 },
  { id: "SEN", name: "Senegal", flag: "🇸🇳", group: "I", pot: 2 },
  { id: "IRQ", name: "Irak", flag: "🇮🇶", group: "I", pot: 4 },
  { id: "NOR", name: "Noruega", flag: "🇳🇴", group: "I", pot: 3 },
  // Grupo J
  { id: "ARG", name: "Argentina", flag: "🇦🇷", group: "J", pot: 1 },
  { id: "ALG", name: "Argelia", flag: "🇩🇿", group: "J", pot: 3 },
  { id: "AUT", name: "Austria", flag: "🇦🇹", group: "J", pot: 2 },
  { id: "JOR", name: "Jordania", flag: "🇯🇴", group: "J", pot: 4 },
  // Grupo K
  { id: "POR", name: "Portugal", flag: "🇵🇹", group: "K", pot: 1 },
  { id: "COD", name: "RD del Congo", flag: "🇨🇩", group: "K", pot: 4 },
  { id: "UZB", name: "Uzbekistán", flag: "🇺🇿", group: "K", pot: 3 },
  { id: "COL", name: "Colombia", flag: "🇨🇴", group: "K", pot: 2 },
  // Grupo L
  { id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", pot: 1 },
  { id: "CRO", name: "Croacia", flag: "🇭🇷", group: "L", pot: 2 },
  { id: "GHA", name: "Ghana", flag: "🇬🇭", group: "L", pot: 3 },
  { id: "PAN", name: "Panamá", flag: "🇵🇦", group: "L", pot: 4 },
];

export const GROUPS = "ABCDEFGHIJKL".split("");

export const TEAM_MAP: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);

export const STAGE_LABELS: Record<string, string> = {
  GROUP: "Fase de grupos",
  R32: "32avos de final",
  R16: "Octavos de final",
  QF: "Cuartos de final",
  SF: "Semifinal",
  F3: "Tercer lugar",
  FINAL: "Final",
};

// Calendario de fase de grupos: round-robin clásico de 3 jornadas por grupo.
// Los resultados se guardan en Firestore con el mismo id determinístico.
const MATCHDAY_PAIRS: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [3, 1],
  ],
  [
    [3, 0],
    [1, 2],
  ],
];

export function groupFixtures(): Omit<MatchResult, "scoreA" | "scoreB">[] {
  const fixtures: Omit<MatchResult, "scoreA" | "scoreB">[] = [];
  for (const g of GROUPS) {
    const teams = TEAMS.filter((t) => t.group === g);
    MATCHDAY_PAIRS.forEach((pairs, md) => {
      pairs.forEach(([a, b], i) => {
        fixtures.push({
          id: `G-${g}-${md + 1}-${i + 1}`,
          stage: "GROUP",
          group: g,
          matchday: md + 1,
          teamA: teams[a].id,
          teamB: teams[b].id,
        });
      });
    });
  }
  return fixtures;
}
