import { addDays, format, parseISO } from "date-fns";
import type { CalendarEvent } from "./types";

const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => `\\${m}`);
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Exporta eventos en formato iCalendar (RFC 5545) para Google Calendar, Outlook o Apple. */
export function toICS(events: CalendarEvent[], now = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Calendario//ES", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    const start = parseISO(e.start);
    const end = parseISO(e.end);
    lines.push("BEGIN:VEVENT", `UID:${e.id}@calendario`, `DTSTAMP:${utc(now)}`);
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${format(start, "yyyyMMdd")}`, `DTEND;VALUE=DATE:${format(end, "yyyyMMdd")}`);
    } else {
      lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(end)}`);
    }
    lines.push(`SUMMARY:${escape(e.title)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    if (e.recurrence) {
      const { freq, interval, until } = e.recurrence;
      let rule = `RRULE:FREQ=${freq.toUpperCase()};INTERVAL=${Math.max(1, interval)}`;
      if (until) rule += `;UNTIL=${format(addDays(parseISO(until), 1), "yyyyMMdd")}`;
      lines.push(rule);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
