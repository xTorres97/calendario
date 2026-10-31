export type ViewMode = "month" | "week" | "day";
export type Locale = "es" | "en";
export type Frequency = "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: Frequency;
  /** Cada cuántas unidades se repite (1 = todas las semanas, 2 = cada dos…) */
  interval: number;
  /** Fecha (yyyy-MM-dd) a partir de la cual deja de repetirse, inclusive */
  until?: string;
}

export interface Category {
  id: string;
  name: string;
  /** Clave de color de la paleta (ver lib/colors.ts) */
  color: ColorKey;
}

export type ColorKey = "cobalt" | "teal" | "amber" | "rose" | "violet" | "slate";

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 (exclusivo). En eventos de todo el día es el inicio del día siguiente */
  end: string;
  allDay: boolean;
  categoryId: string;
  location?: string;
  description?: string;
  recurrence?: Recurrence;
}

/** Una ocurrencia concreta de un evento (los recurrentes generan varias). */
export interface Occurrence {
  key: string;
  event: CalendarEvent;
  start: Date;
  end: Date;
  /** Índice de la repetición (0 = la original) */
  index: number;
}
