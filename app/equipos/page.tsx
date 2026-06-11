import { PotChip } from "@/components/TeamBadge";
import { GROUPS, TEAMS } from "@/lib/data";

export const metadata = { title: "Equipos · Mundial Fantasy 2026" };

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Las 48 selecciones</h1>
      <p className="text-white/60">
        Sorteo oficial del 5 de diciembre de 2025. El bombo indica la fuerza
        relativa de cada selección: úsalo como guía para tu draft.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g} className="card p-4">
            <p className="mb-2 font-black text-white/40">Grupo {g}</p>
            <div className="space-y-1.5">
              {TEAMS.filter((t) => t.group === g).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{t.flag}</span>
                    {t.name}
                  </span>
                  <PotChip pot={t.pot} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
