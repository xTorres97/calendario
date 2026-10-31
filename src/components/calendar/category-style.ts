import type { CSSProperties } from "react";
import { CATEGORY_COLORS } from "@/lib/colors";
import type { Category } from "@/lib/types";

/** Variables CSS de color de una categoría para usar con clases de Tailwind. */
export function categoryVars(category?: Category): CSSProperties {
  const c = CATEGORY_COLORS[category?.color ?? "slate"];
  return {
    "--c-solid": c.solid,
    "--c-soft": c.soft,
    "--c-soft-d": c.softDark,
    "--c-ink": c.ink,
    "--c-ink-d": c.inkDark,
  } as CSSProperties;
}

export const chipColorClasses =
  "bg-[var(--c-soft)] text-[var(--c-ink)] dark:bg-[var(--c-soft-d)] dark:text-[var(--c-ink-d)]";
