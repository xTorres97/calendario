"use client";

import { useMemo, useState } from "react";
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addDays, differenceInCalendarDays, format, isSameDay, isSameMonth, isToday, startOfDay } from "date-fns";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useCursor, useDict, useOccurrences, visibleDays } from "@/lib/hooks";
import type { Occurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { categoryVars, chipColorClasses } from "./category-style";

const MAX_CHIPS = 3;

export function MonthView() {
  const cursor = useCursor();
  const { t, dateLocale } = useDict();
  const days = useMemo(() => visibleDays("month", cursor), [cursor]);
  const from = days[0];
  const to = useMemo(() => addDays(days[days.length - 1], 1), [days]);
  const occurrences = useOccurrences(from, to);
  const shiftEvent = useCalendar(s => s.shiftEvent);
  const setCursor = useCalendar(s => s.setCursor);
  const setView = useCalendar(s => s.setView);
  const openCreate = useUI(s => s.openCreate);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) {
      // Un evento de varios días aparece en cada día que cubre
      const last = o.event.allDay ? addDays(o.end, -1) : o.end;
      for (let d = startOfDay(o.start); d <= last; d = addDays(d, 1)) {
        const k = format(d, "yyyy-MM-dd");
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(o);
      }
    }
    for (const list of map.values())
      list.sort((a, b) => Number(b.event.allDay) - Number(a.event.allDay) || a.start.getTime() - b.start.getTime());
    return map;
  }, [occurrences]);

  function onDragEnd(e: DragEndEvent) {
    const occ = e.active.data.current?.occurrence as Occurrence | undefined;
    if (!occ || !e.over) return;
    const target = new Date(`${e.over.id}T00:00:00`);
    const days = differenceInCalendarDays(target, startOfDay(occ.start));
    if (!days) return;
    shiftEvent(occ.event.id, days * 86_400_000);
    toast(occ.event.recurrence ? t.toasts.movedSeries : t.toasts.moved);
  }

  const weekdays = days.slice(0, 7).map(d => format(d, "EEE", { locale: dateLocale }));

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid grid-cols-7 border-b border-line">
          {weekdays.map(w => (
            <div key={w} className="px-2 py-2 text-xs font-medium capitalize text-muted">{w}</div>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(6.5rem, 1fr))` }}>
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const list = byDay.get(key) ?? [];
            return (
              <DayCell
                key={key}
                id={key}
                day={day}
                outside={!isSameMonth(day, cursor)}
                occurrences={list}
                moreLabel={t.more(list.length - MAX_CHIPS)}
                onCreate={() => {
                  const start = new Date(day); start.setHours(9, 0, 0, 0);
                  openCreate({ start: start.toISOString(), end: new Date(start.getTime() + 3_600_000).toISOString(), allDay: false });
                }}
                onOpenDay={() => { setCursor(day); setView("day"); }}
                dayLabel={format(day, "EEEE d MMMM", { locale: dateLocale })}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function DayCell({ id, day, outside, occurrences, moreLabel, onCreate, onOpenDay, dayLabel }: {
  id: string; day: Date; outside: boolean; occurrences: Occurrence[]; moreLabel: string;
  onCreate: () => void; onOpenDay: () => void; dayLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const today = isToday(day);
  const shown = occurrences.slice(0, MAX_CHIPS);
  const hidden = occurrences.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={e => { if (e.target === e.currentTarget) onCreate(); }}
      className={cn(
        "group relative flex min-w-0 flex-col gap-0.5 border-b border-r border-line p-1 transition-colors [&:nth-child(7n)]:border-r-0",
        outside && "bg-surface-2/50",
        isOver && "bg-accent-soft"
      )}
    >
      <button
        onClick={onOpenDay}
        aria-label={dayLabel}
        className={cn(
          "mb-0.5 ml-0.5 flex size-7 items-center justify-center self-start rounded-full text-sm tabular-nums hover:bg-surface-2",
          outside ? "text-muted/70" : "text-ink",
          today && "bg-accent font-semibold text-accent-ink hover:bg-accent"
        )}
      >
        {format(day, "d")}
      </button>
      {shown.map(o => <MonthChip key={o.key} occurrence={o} day={day} />)}
      {hidden > 0 && (
        <button onClick={onOpenDay} className="self-start rounded px-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {moreLabel}
        </button>
      )}
      <button
        onClick={onCreate}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-x-1 bottom-1 hidden h-5 rounded text-xs text-muted opacity-0 hover:bg-surface-2 group-hover:opacity-100 md:block"
      >
        +
      </button>
    </div>
  );
}

function MonthChip({ occurrence, day }: { occurrence: Occurrence; day: Date }) {
  const categories = useCalendar(s => s.categories);
  const openEdit = useUI(s => s.openEdit);
  const { dateLocale } = useDict();
  const [id] = useState(() => `${occurrence.key}@${format(day, "yyyy-MM-dd")}`);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data: { occurrence } });
  const category = categories.find(c => c.id === occurrence.event.categoryId);
  const allDay = occurrence.event.allDay;
  const continues = !isSameDay(occurrence.start, day);

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => openEdit(occurrence.event.id)}
      style={{ ...categoryVars(category), transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs leading-5 touch-none",
        allDay ? chipColorClasses : "text-ink hover:bg-surface-2",
        isDragging && "relative z-20 shadow-lg ring-1 ring-line-strong",
        allDay && continues && "rounded-l-none"
      )}
    >
      {!allDay && <span className="size-1.5 shrink-0 rounded-full bg-[var(--c-solid)]" />}
      {!allDay && <span className="shrink-0 tabular-nums text-muted">{format(occurrence.start, "p", { locale: dateLocale }).replace(/\s?([ap])\.?\s?m\.?/i, "$1")}</span>}
      <span className="truncate font-medium">{occurrence.event.title}</span>
      {occurrence.event.recurrence && <Repeat className="size-3 shrink-0 opacity-60" aria-hidden />}
    </button>
  );
}
