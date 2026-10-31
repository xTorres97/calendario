import { describe, expect, it } from "vitest";
import { layoutDay } from "../layout";
import type { Occurrence } from "../types";

const day = new Date(2026, 9, 5);
const occ = (id: string, h1: number, m1: number, h2: number, m2: number): Occurrence => ({
  key: id, index: 0,
  event: { id, title: id, start: "", end: "", allDay: false, categoryId: "work" },
  start: new Date(2026, 9, 5, h1, m1), end: new Date(2026, 9, 5, h2, m2),
});

describe("layoutDay", () => {
  it("un evento solo ocupa todo el ancho", () => {
    const [p] = layoutDay([occ("a", 9, 0, 10, 0)], day);
    expect(p).toMatchObject({ column: 0, columns: 1, top: 540, height: 60 });
  });

  it("dos eventos solapados se reparten en dos columnas", () => {
    const out = layoutDay([occ("a", 9, 0, 10, 0), occ("b", 9, 30, 10, 30)], day);
    expect(out.map(p => [p.occurrence.key, p.column, p.columns])).toEqual([["a", 0, 2], ["b", 1, 2]]);
  });

  it("reutiliza columnas libres dentro del mismo grupo", () => {
    const out = layoutDay([occ("a", 9, 0, 11, 0), occ("b", 9, 0, 9, 30), occ("c", 9, 45, 10, 15)], day);
    const c = out.find(p => p.occurrence.key === "c")!;
    expect(c.column).toBe(1);
    expect(c.columns).toBe(2);
  });

  it("eventos que no se tocan forman grupos separados", () => {
    const out = layoutDay([occ("a", 9, 0, 10, 0), occ("b", 10, 0, 11, 0)], day);
    expect(out.every(p => p.columns === 1)).toBe(true);
  });

  it("recorta eventos que cruzan la medianoche", () => {
    const o = occ("a", 23, 0, 23, 0);
    o.end = new Date(2026, 9, 6, 2, 0);
    const [p] = layoutDay([o], day);
    expect(p.top + p.height).toBe(24 * 60);
  });
});
