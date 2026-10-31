"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useCalendar } from "@/store/calendar";
import { DATE_LOCALES, DICTS } from "./i18n";
import { expandEvents } from "./recurrence";
import type { ViewMode } from "./types";

export const WEEK_STARTS_ON = 1 as const;

export function useDict() {
  const locale = useCalendar(s => s.locale);
  return { t: DICTS[locale], locale, dateLocale: DATE_LOCALES[locale] };
}

/** Días visibles para la vista actual. */
export function visibleDays(view: ViewMode, cursor: Date): Date[] {
  if (view === "day") return [startOfDay(cursor)];
  if (view === "week") {
    const s = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: s, end: addDays(s, 6) });
  }
  const s = startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
  const e = endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start: s, end: e });
}

/** Ocurrencias visibles (filtradas por categoría) entre dos fechas. */
export function useOccurrences(from: Date, to: Date) {
  const events = useCalendar(s => s.events);
  const hidden = useCalendar(s => s.hiddenCategories);
  return useMemo(
    () => expandEvents(events.filter(e => !hidden.includes(e.categoryId)), from, to),
    [events, hidden, from, to]
  );
}

export function useCursor() {
  const cursor = useCalendar(s => s.cursor);
  return useMemo(() => parseISO(cursor), [cursor]);
}

/** Hora actual que se actualiza cada minuto (para la línea de "ahora"). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
