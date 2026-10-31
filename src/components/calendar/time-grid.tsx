"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DndContext, PointerSensor, TouchSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addDays, addMinutes, format, isSameDay, isToday, startOfDay } from "date-fns";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useCursor, useDict, useNow, useOccurrences, visibleDays } from "@/lib/hooks";
import { layoutDay, type PositionedOccurrence } from "@/lib/layout";
import type { Occurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { categoryVars, chipColorClasses } from "./category-style";

const HOUR = 52; // px por hora
const PX = HOUR / 60; // px por minuto
const SNAP = 15; // minutos
const DAY_MS = 86_400_000;

const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const clampMin = (min: number) => Math.max(0, Math.min(24 * 60, min));

/** Ancho de cada columna de día, para traducir el arrastre horizontal en días. */
const GridMetrics = createContext({ colW: 0, multiDay: false });

export function TimeGrid({ view }: { view: "week" | "day" }) {
  const cursor = useCursor();
  const { t, dateLocale } = useDict();
  const days = useMemo(() => visibleDays(view, cursor), [view, cursor]);
  const from = days[0];
  const to = useMemo(() => addDays(days[days.length - 1], 1), [days]);
  const occurrences = useOccurrences(from, to);
  const shiftEvent = useCalendar(s => s.shiftEvent);
  const setCursor = useCalendar(s => s.setCursor);
  const setView = useCalendar(s => s.setView);

  const scrollRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const [colW, setColW] = useState(0);

  useLayoutEffect(() => {
    const el = colsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setColW(el.clientWidth / days.length));
    ro.observe(el);
    return () => ro.disconnect();
  }, [days.length]);

  // Al abrir, mostrar desde las 7:30 (o una hora antes de ahora si es más tarde)
  useEffect(() => {
    const now = new Date();
    const minutes = Math.max(7.5 * 60, Math.min(now.getHours() * 60 - 60, 17 * 60));
    scrollRef.current?.scrollTo({ top: minutes * PX });
  }, [view]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );

  const allDay = occurrences.filter(o => o.event.allDay || o.end.getTime() - o.start.getTime() >= DAY_MS);
  const timed = occurrences.filter(o => !allDay.includes(o));

  function onDragEnd(e: DragEndEvent) {
    const occ = e.active.data.current?.occurrence as Occurrence | undefined;
    const kind = e.active.data.current?.kind as "timed" | "allday" | undefined;
    if (!occ) return;
    const dayShift = days.length > 1 && colW ? Math.round(e.delta.x / colW) : 0;
    const minutes = kind === "timed" ? snap(e.delta.y / PX) : 0;
    const delta = dayShift * DAY_MS + minutes * 60_000;
    if (!delta) return;
    shiftEvent(occ.event.id, delta);
    toast(occ.event.recurrence ? t.toasts.movedSeries : t.toasts.moved);
  }

  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <GridMetrics.Provider value={{ colW, multiDay: days.length > 1 }}>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex h-full min-h-0 flex-col">
          {/* Encabezado de días */}
          <div className="flex overflow-y-hidden border-b border-line [scrollbar-gutter:stable]">
            <div className="w-14 shrink-0" />
            <div className="grid flex-1" style={cols}>
              {days.map(d => (
                <button
                  key={d.toISOString()}
                  onClick={() => { setCursor(d); setView("day"); }}
                  className="flex flex-col items-start gap-0.5 px-2 py-2 text-left hover:bg-surface-2/60"
                  aria-label={format(d, "EEEE d MMMM", { locale: dateLocale })}
                >
                  <span className="text-xs font-medium capitalize text-muted">{format(d, "EEE", { locale: dateLocale })}</span>
                  <span className={cn("flex size-8 items-center justify-center rounded-full font-display text-lg leading-none tabular-nums",
                    isToday(d) ? "bg-accent font-semibold text-accent-ink" : "text-ink")}>
                    {format(d, "d")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Fila de todo el día */}
          {allDay.length > 0 && (
            <div className="flex overflow-y-hidden border-b border-line [scrollbar-gutter:stable]">
              <div className="flex w-14 shrink-0 items-start justify-end px-1.5 pt-1.5 text-[10px] leading-tight text-muted">{t.allDay}</div>
              <div className="grid flex-1 gap-y-0.5 py-1" style={cols}>
                {days.map(d => (
                  <div key={d.toISOString()} className="flex min-w-0 flex-col gap-0.5 px-0.5">
                    {allDay
                      .filter(o => o.start < addDays(d, 1) && o.end > d)
                      .map(o => <AllDayChip key={`${o.key}@${d.toISOString()}`} occurrence={o} day={d} />)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cuadrícula de horas */}
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            <div className="relative flex" style={{ height: 24 * HOUR }}>
              <SkyGutter />
              <div ref={colsRef} className="relative grid flex-1" style={cols}>
                {days.map(d => (
                  <DayColumn key={d.toISOString()} day={d} occurrences={timed.filter(o => o.start < addDays(d, 1) && o.end > d)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    </GridMetrics.Provider>
  );
}

/** Columna de horas cuyo fondo sigue el color del cielo a lo largo del día. */
function SkyGutter() {
  const { dateLocale, locale } = useDict();
  const labels = useMemo(
    () => Array.from({ length: 23 }, (_, i) => format(new Date(2000, 0, 1, i + 1), locale === "es" ? "H:mm" : "h a", { locale: dateLocale })),
    [dateLocale, locale]
  );
  return (
    <div
      aria-hidden
      className="relative w-14 shrink-0 border-r border-line"
      style={{
        background:
          "linear-gradient(to bottom, var(--sky-night) 0%, var(--sky-night) 19%, var(--sky-dawn) 26%, var(--sky-morning) 33%, var(--sky-noon) 50%, var(--sky-morning) 68%, var(--sky-dusk) 78%, var(--sky-night) 88%, var(--sky-night) 100%)",
      }}
    >
      {labels.map((label, i) => {
        const hour = i + 1;
        const night = hour < 6 || hour >= 21;
        return (
          <span
            key={hour}
            className={cn("absolute right-1.5 -translate-y-1/2 text-[10.5px] font-medium tabular-nums", night ? "text-white/75" : "text-ink/70")}
            style={{ top: hour * HOUR }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function DayColumn({ day, occurrences }: { day: Date; occurrences: Occurrence[] }) {
  const dayStart = useMemo(() => startOfDay(day), [day]);
  const positioned = useMemo(() => layoutDay(occurrences, dayStart), [occurrences, dayStart]);
  const openCreate = useUI(s => s.openCreate);
  const { t } = useDict();
  const now = useNow();
  const [ghost, setGhost] = useState<{ a: number; b: number } | null>(null);
  const anchor = useRef<number | null>(null);

  const minuteAt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return clampMin(Math.floor((e.clientY - rect.top) / PX / SNAP) * SNAP);
  };

  // Crear un evento haciendo clic o arrastrando sobre el espacio libre
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = minuteAt(e);
    anchor.current = m;
    setGhost({ a: m, b: m + SNAP });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (anchor.current === null) return;
    const m = clampMin(snap((e.clientY - e.currentTarget.getBoundingClientRect().top) / PX));
    const a = Math.min(anchor.current, m);
    const b = Math.max(anchor.current + SNAP, m);
    setGhost({ a, b });
  };
  const onPointerUp = () => {
    if (anchor.current === null || !ghost) return;
    anchor.current = null;
    const dragged = ghost.b - ghost.a > SNAP;
    const start = addMinutes(dayStart, ghost.a);
    const end = addMinutes(dayStart, dragged ? ghost.b : Math.min(ghost.a + 60, 24 * 60));
    setGhost(null);
    openCreate({ start: start.toISOString(), end: end.toISOString(), allDay: false });
  };

  const showNow = isSameDay(now, day);
  const nowTop = (now.getHours() * 60 + now.getMinutes()) * PX;

  return (
    <div
      className="relative border-r border-line last:border-r-0"
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0, var(--line) 1px, transparent 1px, transparent ${HOUR}px)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { anchor.current = null; setGhost(null); }}
      aria-label={occurrences.length === 0 ? t.emptyDay : undefined}
    >
      {positioned.map(p => <TimedEvent key={p.occurrence.key} p={p} />)}

      {ghost && (
        <div
          className="pointer-events-none absolute inset-x-1 rounded-md border-2 border-dashed border-accent bg-accent-soft/70"
          style={{ top: ghost.a * PX, height: Math.max(SNAP, ghost.b - ghost.a) * PX }}
        />
      )}

      {showNow && (
        <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }} aria-hidden>
          <div className="absolute -left-1 -top-[5px] size-2.5 rounded-full bg-now" />
          <div className="h-0.5 bg-now" />
        </div>
      )}
    </div>
  );
}

function TimedEvent({ p }: { p: PositionedOccurrence }) {
  const { occurrence: o } = p;
  const { colW, multiDay } = useContext(GridMetrics);
  const categories = useCalendar(s => s.categories);
  const resizeEvent = useCalendar(s => s.resizeEvent);
  const openEdit = useUI(s => s.openEdit);
  const { dateLocale } = useDict();
  const category = categories.find(c => c.id === o.event.categoryId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${o.key}@${p.top}`,
    data: { occurrence: o, kind: "timed" },
  });

  const [resizeDelta, setResizeDelta] = useState(0);
  const resizeStart = useRef<number | null>(null);
  const justResized = useRef(false);

  const onResizeDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStart.current = e.clientY;
  };
  const onResizeMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeStart.current === null) return;
    const minutes = snap((e.clientY - resizeStart.current) / PX);
    setResizeDelta(Math.max(minutes, SNAP - p.height));
  };
  const onResizeUp = () => {
    if (resizeStart.current === null) return;
    resizeStart.current = null;
    if (resizeDelta) {
      resizeEvent(o.event.id, resizeDelta * 60_000);
      justResized.current = true;
    }
    setResizeDelta(0);
  };

  // Mientras se arrastra, el bloque salta de 15 en 15 minutos y de día en día
  const dx = transform && multiDay && colW ? Math.round(transform.x / colW) * colW : 0;
  const dy = transform ? snap(transform.y / PX) * PX : 0;
  const height = (p.height + resizeDelta) * PX;
  const compact = height < 38;
  const start = isDragging && transform ? addMinutes(o.start, snap(transform.y / PX)) : o.start;
  const end = addMinutes(isDragging && transform ? addMinutes(o.end, snap(transform.y / PX)) : o.end, resizeDelta);
  const fmt = (d: Date) => format(d, "p", { locale: dateLocale });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (justResized.current) { justResized.current = false; return; }
        openEdit(o.event.id);
      }}
      style={{
        ...categoryVars(category),
        top: p.top * PX,
        height,
        left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
        width: `calc(${100 / p.columns}% - 4px)`,
        transform: dx || dy ? `translate3d(${dx}px, ${dy}px, 0)` : undefined,
      }}
      className={cn(
        "absolute flex touch-none flex-col overflow-hidden rounded-md border-l-[3px] border-[var(--c-solid)] px-1.5 text-left text-xs",
        chipColorClasses,
        compact ? "justify-center py-0" : "py-1",
        isDragging || resizeDelta ? "z-30 shadow-[0_10px_24px_-8px_rgba(15,20,40,.45)] ring-1 ring-[var(--c-solid)]" : "z-0 hover:z-20 hover:brightness-[.98]"
      )}
    >
      <span className={cn("flex min-w-0 items-center gap-1 font-semibold leading-tight", compact && "text-[11px]")}>
        <span className="truncate">{o.event.title}</span>
        {o.event.recurrence && <Repeat className="size-3 shrink-0 opacity-60" aria-hidden />}
        {compact && <span className="ml-auto shrink-0 font-normal opacity-75 tabular-nums">{fmt(start)}</span>}
      </span>
      {!compact && (
        <span className="truncate leading-tight opacity-80 tabular-nums">
          {fmt(start)} – {fmt(end)}{o.event.location && height > 60 ? ` · ${o.event.location}` : ""}
        </span>
      )}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
        aria-hidden
      />
    </button>
  );
}

function AllDayChip({ occurrence, day }: { occurrence: Occurrence; day: Date }) {
  const categories = useCalendar(s => s.categories);
  const openEdit = useUI(s => s.openEdit);
  const { colW, multiDay } = useContext(GridMetrics);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${occurrence.key}@${day.toISOString()}`,
    data: { occurrence, kind: "allday" },
  });
  const dx = transform && multiDay && colW ? Math.round(transform.x / colW) * colW : 0;
  const category = categories.find(c => c.id === occurrence.event.categoryId);

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => openEdit(occurrence.event.id)}
      style={{ ...categoryVars(category), transform: dx ? `translateX(${dx}px)` : undefined }}
      className={cn("truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium touch-none", chipColorClasses, isDragging && "relative z-30 shadow-lg")}
    >
      {occurrence.event.title}
    </button>
  );
}
