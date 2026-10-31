"use client";

import { useMemo, useState } from "react";
import { addMonths, format, isSameDay, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/store/calendar";
import { useCursor, useDict, useOccurrences, visibleDays } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Calendario chico para saltar a cualquier fecha; marca los días con eventos. */
export function MiniCalendar() {
  const cursor = useCursor();
  const setCursor = useCalendar(s => s.setCursor);
  const { t, dateLocale } = useDict();
  const [shown, setShown] = useState(() => startOfMonth(cursor));
  const [lastCursor, setLastCursor] = useState(cursor);
  if (!isSameDay(lastCursor, cursor)) {
    setLastCursor(cursor);
    if (!isSameMonth(shown, cursor)) setShown(startOfMonth(cursor));
  }

  const days = useMemo(() => visibleDays("month", shown), [shown]);
  const occurrences = useOccurrences(days[0], days[days.length - 1]);
  const busy = useMemo(() => new Set(occurrences.map(o => format(o.start, "yyyy-MM-dd"))), [occurrences]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="pl-1 text-sm font-semibold capitalize">{format(shown, "LLLL yyyy", { locale: dateLocale })}</span>
        <div className="flex">
          <button onClick={() => setShown(m => addMonths(m, -1))} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t.previous}><ChevronLeft className="size-4" /></button>
          <button onClick={() => setShown(m => addMonths(m, 1))} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t.next}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted">
        {days.slice(0, 7).map(d => <span key={d.toISOString()} className="pb-1 capitalize">{format(d, "EEEEE", { locale: dateLocale })}</span>)}
        {days.map(d => {
          const selected = isSameDay(d, cursor);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setCursor(d)}
              aria-label={format(d, "PPPP", { locale: dateLocale })}
              aria-current={selected ? "date" : undefined}
              className={cn(
                "relative mx-auto flex size-7 items-center justify-center rounded-full text-xs tabular-nums",
                !isSameMonth(d, shown) ? "text-muted/50" : "text-ink",
                selected ? "bg-ink font-semibold text-paper" : "hover:bg-surface-2",
                isToday(d) && !selected && "font-bold text-accent"
              )}
            >
              {format(d, "d")}
              {busy.has(format(d, "yyyy-MM-dd")) && !selected && <span className="absolute bottom-0.5 size-1 rounded-full bg-muted/60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
