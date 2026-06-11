import { TEAM_MAP } from "@/lib/data";

export function TeamBadge({
  teamId,
  size = "md",
}: {
  teamId: string;
  size?: "sm" | "md";
}) {
  const t = TEAM_MAP[teamId];
  if (!t) return <span>{teamId}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={size === "sm" ? "text-base" : "text-xl"}>{t.flag}</span>
      <span className={size === "sm" ? "text-sm" : ""}>{t.name}</span>
    </span>
  );
}

const POT_COLORS: Record<number, string> = {
  1: "bg-wc-gold/20 text-wc-gold",
  2: "bg-wc-blue/30 text-blue-300",
  3: "bg-wc-green/30 text-emerald-300",
  4: "bg-wc-red/25 text-red-300",
};

export function PotChip({ pot }: { pot: number }) {
  return <span className={`chip ${POT_COLORS[pot]}`}>Bombo {pot}</span>;
}
