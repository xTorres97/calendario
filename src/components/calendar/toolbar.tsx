"use client";

import { endOfWeek, format, isSameMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useCursor, useDict, WEEK_STARTS_ON } from "@/lib/hooks";
import type { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SettingsMenu } from "./settings-menu";

export function Toolbar() {
  const { t, dateLocale } = useDict();
  const view = useCalendar(s => s.view);
  const setView = useCalendar(s => s.setView);
  const step = useCalendar(s => s.step);
  const goToday = useCalendar(s => s.goToday);
  const setSearchOpen = useUI(s => s.setSearchOpen);
  const setSidebarOpen = useUI(s => s.setSidebarOpen);
  const cursor = useCursor();

  // El título es el elemento tipográfico protagonista: mes en grande, año liviano
  let main = format(cursor, "LLLL", { locale: dateLocale });
  let sub = format(cursor, "yyyy");
  if (view === "week") {
    const s = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
    const e = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
    if (!isSameMonth(s, e)) {
      main = `${format(s, "LLL", { locale: dateLocale })}–${format(e, "LLL", { locale: dateLocale })}`.replace(/\./g, "");
      sub = format(e, "yyyy");
    }
  } else if (view === "day") {
    main = format(cursor, "d LLLL", { locale: dateLocale });
    sub = format(cursor, "EEEE", { locale: dateLocale });
  }

  const views: ViewMode[] = ["month", "week", "day"];

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-3 md:px-5">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label={t.categories}>
        <Menu />
      </Button>

      <h1 className="mr-auto flex min-w-0 flex-1 items-baseline gap-2 sm:flex-none" aria-live="polite">
        <span className="truncate font-display text-[1.6rem] font-semibold capitalize leading-none tracking-[-0.02em] md:text-[2.25rem]">{main}</span>
        <span className="hidden shrink-0 font-display text-lg font-light capitalize text-muted sm:inline md:text-xl">{sub}</span>
      </h1>

      <div className="flex items-center sm:order-last">
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label={t.search}><Search /></Button>
        <SettingsMenu />
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="flex items-center rounded-lg border border-line-strong bg-surface">
          <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} aria-label={t.previous}><ChevronLeft /></Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="rounded-none border-x border-line">{t.today}</Button>
          <Button variant="ghost" size="icon-sm" onClick={() => step(1)} aria-label={t.next}><ChevronRight /></Button>
        </div>

        <div role="tablist" aria-label={t.views.week} className="ml-auto flex rounded-lg bg-surface-2 p-0.5 sm:ml-0">
          {views.map(v => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("h-8 rounded-md px-3 text-sm font-medium text-muted transition-colors",
                view === v ? "bg-surface text-ink shadow-[0_1px_2px_rgba(15,20,40,.12)]" : "hover:text-ink")}
            >
              {t.views[v]}
            </button>
          ))}
        </div>
      </div>

    </header>
  );
}
