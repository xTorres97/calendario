import { describe, expect, it } from "vitest";
import { toICS } from "../ics";

describe("toICS", () => {
  it("genera un VCALENDAR válido con recurrencia y escapes", () => {
    const ics = toICS([{
      id: "x", title: "Reunión, equipo; plan", allDay: false, categoryId: "w",
      start: "2026-10-05T13:00:00.000Z", end: "2026-10-05T14:00:00.000Z",
      recurrence: { freq: "weekly", interval: 2, until: "2026-12-01" },
    }], new Date("2026-10-01T00:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART:20261005T130000Z");
    expect(ics).toContain(String.raw`SUMMARY:Reunión\, equipo\; plan`);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261202");
    expect(ics.split("\r\n").at(-1)).toBe("END:VCALENDAR");
  });
});
