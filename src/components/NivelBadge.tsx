import { cn } from "@/lib/utils";
import { TrendingDown, Minus, TrendingUp } from "lucide-react";

export type Nivel = "bajo" | "medio" | "alto";

export function nivelDePorcentaje(p: number): Nivel {
  if (p < 40) return "bajo";
  if (p <= 70) return "medio";
  return "alto";
}

const STYLES: Record<Nivel, { cls: string; label: string; Icon: typeof TrendingUp }> = {
  bajo: {
    cls: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40",
    label: "Bajo",
    Icon: TrendingDown,
  },
  medio: {
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
    label: "Medio",
    Icon: Minus,
  },
  alto: {
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
    label: "Alto",
    Icon: TrendingUp,
  },
};

export function NivelBadge({
  nivel,
  porcentaje,
  className,
}: {
  nivel: Nivel;
  porcentaje?: number;
  className?: string;
}) {
  const s = STYLES[nivel];
  const Icon = s.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        s.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
      {porcentaje != null && <span className="font-mono normal-case">· {porcentaje}%</span>}
    </span>
  );
}

export const NIVEL_BAR_COLOR: Record<Nivel, string> = {
  alto: "bg-emerald-500",
  medio: "bg-amber-500",
  bajo: "bg-red-500",
};

export const NIVEL_CARD_STYLE: Record<Nivel, string> = {
  alto: "border-emerald-500/40 bg-emerald-500/5",
  medio: "border-border bg-card",
  bajo: "border-red-500/40 bg-red-500/5",
};
