import type { Occurrence } from "./types";

export interface PositionedOccurrence {
  occurrence: Occurrence;
  /** Columna asignada dentro del grupo de solapes */
  column: number;
  /** Total de columnas del grupo */
  columns: number;
  /** Minutos desde el inicio del día visible (recortado al día) */
  top: number;
  height: number;
}

/**
 * Reparte en columnas los eventos que se solapan dentro de un mismo día,
 * igual que Google Calendar: cada grupo conectado de solapes comparte el ancho.
 */
export function layoutDay(occurrences: Occurrence[], dayStart: Date, minHeight = 15): PositionedOccurrence[] {
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + 24 * 60 * 60_000;

  const items = occurrences
    .map(o => {
      const s = Math.max(o.start.getTime(), dayStartMs);
      const e = Math.min(o.end.getTime(), dayEndMs);
      const top = (s - dayStartMs) / 60_000;
      return { occurrence: o, top, height: Math.max(minHeight, (e - s) / 60_000) };
    })
    .sort((a, b) => a.top - b.top || b.height - a.height);

  const result: PositionedOccurrence[] = [];
  let group: { item: (typeof items)[number]; column: number }[] = [];
  let groupEnd = -1;
  let columnEnds: number[] = [];

  const flush = () => {
    const columns = columnEnds.length;
    for (const g of group) result.push({ ...g.item, column: g.column, columns });
    group = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.top >= groupEnd && group.length) flush();
    let column = columnEnds.findIndex(end => end <= item.top);
    if (column === -1) { column = columnEnds.length; columnEnds.push(0); }
    columnEnds[column] = item.top + item.height;
    group.push({ item, column });
    groupEnd = Math.max(groupEnd, item.top + item.height);
  }
  if (group.length) flush();

  return result;
}
