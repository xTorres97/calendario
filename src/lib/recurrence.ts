import { addDays, addMonths, addWeeks, differenceInMilliseconds, endOfDay, isAfter, isBefore, parseISO } from "date-fns";
import type { CalendarEvent, Occurrence } from "./types";

const MAX_OCCURRENCES = 1000;

function step(date: Date, freq: NonNullable<CalendarEvent["recurrence"]>["freq"], n: number) {
  if (freq === "daily") return addDays(date, n);
  if (freq === "weekly") return addWeeks(date, n);
  return addMonths(date, n);
}

/**
 * Devuelve las ocurrencias de los eventos que se cruzan con [rangeStart, rangeEnd).
 * Los eventos recurrentes se expanden sin generar las repeticiones fuera del rango.
 */
export function expandEvents(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): Occurrence[] {
  const out: Occurrence[] = [];

  for (const event of events) {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const duration = differenceInMilliseconds(end, start);
    const overlaps = (s: Date, e: Date) => isBefore(s, rangeEnd) && isAfter(e, rangeStart);

    if (!event.recurrence) {
      if (overlaps(start, end)) out.push({ key: event.id, event, start, end, index: 0 });
      continue;
    }

    const { freq, interval, until } = event.recurrence;
    const every = Math.max(1, interval);
    const untilDate = until ? endOfDay(parseISO(until)) : null;

    // Saltar directo cerca del rango en series diarias/semanales largas
    let i = 0;
    if (freq !== "monthly" && isBefore(start, rangeStart)) {
      const unitMs = (freq === "daily" ? 1 : 7) * 86_400_000 * every;
      i = Math.max(0, Math.floor((rangeStart.getTime() - duration - start.getTime()) / unitMs) - 1);
    }

    for (let count = 0; count < MAX_OCCURRENCES; count++, i++) {
      // Siempre se calcula desde el inicio original para evitar acumular desfases (31 → 28 → 28…)
      const s = step(start, freq, i * every);
      if (untilDate && isAfter(s, untilDate)) break;
      if (!isBefore(s, rangeEnd)) break;
      const e = new Date(s.getTime() + duration);
      if (overlaps(s, e)) out.push({ key: `${event.id}:${i}`, event, start: s, end: e, index: i });
    }
  }

  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
}
