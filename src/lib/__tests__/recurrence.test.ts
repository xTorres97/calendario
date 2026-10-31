import { describe, expect, it } from "vitest";
import { expandEvents } from "../recurrence";
import type { CalendarEvent } from "../types";

const ev = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1", title: "Test", allDay: false, categoryId: "work",
  start: "2026-10-05T09:00:00.000Z", end: "2026-10-05T10:00:00.000Z", ...over,
});
const range = (a: string, b: string) => [new Date(a), new Date(b)] as const;

describe("expandEvents", () => {
  it("incluye un evento simple que cruza el rango", () => {
    const [s, e] = range("2026-10-05T00:00:00Z", "2026-10-06T00:00:00Z");
    expect(expandEvents([ev()], s, e)).toHaveLength(1);
  });

  it("excluye eventos que terminan justo cuando empieza el rango", () => {
    const [s, e] = range("2026-10-05T10:00:00Z", "2026-10-06T00:00:00Z");
    expect(expandEvents([ev()], s, e)).toHaveLength(0);
  });

  it("expande series semanales solo dentro del rango", () => {
    const [s, e] = range("2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z");
    const out = expandEvents([ev({ recurrence: { freq: "weekly", interval: 1 } })], s, e);
    expect(out.map(o => o.start.toISOString().slice(0, 10))).toEqual(["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
    expect(new Set(out.map(o => o.key)).size).toBe(out.length);
  });

  it("respeta el intervalo y la fecha 'hasta'", () => {
    const [s, e] = range("2026-10-01T00:00:00Z", "2026-12-31T00:00:00Z");
    const out = expandEvents([ev({ recurrence: { freq: "weekly", interval: 2, until: "2026-11-02" } })], s, e);
    expect(out.map(o => o.start.toISOString().slice(0, 10))).toEqual(["2026-10-05", "2026-10-19", "2026-11-02"]);
  });

  it("no acumula desfases en series mensuales que empiezan el 31", () => {
    const [s, e] = range("2026-01-01T00:00:00Z", "2026-06-01T00:00:00Z");
    const out = expandEvents([ev({ start: "2026-01-31T12:00:00Z", end: "2026-01-31T13:00:00Z", recurrence: { freq: "monthly", interval: 1 } })], s, e);
    expect(out.map(o => o.start.toISOString().slice(0, 10))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
  });

  it("encuentra ocurrencias de series diarias muy antiguas sin recorrerlas todas", () => {
    const [s, e] = range("2030-01-01T00:00:00Z", "2030-01-03T00:00:00Z");
    const out = expandEvents([ev({ start: "2020-01-01T09:00:00Z", end: "2020-01-01T10:00:00Z", recurrence: { freq: "daily", interval: 1 } })], s, e);
    expect(out).toHaveLength(2);
  });

  it("incluye eventos que empiezan antes del rango y terminan dentro", () => {
    const [s, e] = range("2026-10-05T09:30:00Z", "2026-10-06T00:00:00Z");
    expect(expandEvents([ev()], s, e)).toHaveLength(1);
  });
});
