"use client";

import { Plus } from "lucide-react";
import { addMinutes, setHours, startOfHour } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useCursor, useDict } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { categoryVars } from "./category-style";
import { MiniCalendar } from "./mini-calendar";

export function Sidebar() {
  const { t } = useDict();
  const categories = useCalendar(s => s.categories);
  const hidden = useCalendar(s => s.hiddenCategories);
  const events = useCalendar(s => s.events);
  const toggle = useCalendar(s => s.toggleCategory);
  const openCreate = useUI(s => s.openCreate);
  const setHelpOpen = useUI(s => s.setHelpOpen);
  const cursor = useCursor();

  const createAtCursor = () => {
    const now = new Date();
    const base = startOfHour(setHours(cursor, Math.min(Math.max(now.getHours() + 1, 8), 20)));
    openCreate({ start: base.toISOString(), end: addMinutes(base, 60).toISOString(), allDay: false });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Button variant="primary" className="h-10 justify-start rounded-xl px-4" onClick={createAtCursor}>
        <Plus /> {t.newEvent}
      </Button>

      <MiniCalendar />

      <section aria-labelledby="cats-title">
        <h2 id="cats-title" className="mb-2 pl-1 text-sm font-semibold">{t.categories}</h2>
        <ul className="flex flex-col">
          {categories.map(c => {
            const visible = !hidden.includes(c.id);
            const count = events.filter(e => e.categoryId === c.id).length;
            return (
              <li key={c.id}>
                <label style={categoryVars(c)} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-surface-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]">
                  <input type="checkbox" checked={visible} onChange={() => toggle(c.id)} className="sr-only" />
                  <span
                    className={cn("flex size-4 items-center justify-center rounded border-2 border-[var(--c-solid)] transition-colors", visible && "bg-[var(--c-solid)]")}
                    aria-hidden
                  >
                    {visible && <svg viewBox="0 0 12 12" className="size-2.5 text-white"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span className={cn("flex-1", !visible && "text-muted line-through decoration-muted/50")}>{c.name}</span>
                  <span className="text-xs tabular-nums text-muted">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-auto space-y-2 text-xs leading-relaxed text-muted">
        <p>{t.hint}</p>
        <button onClick={() => setHelpOpen(true)} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
          {t.shortcuts} <kbd className="ml-1 rounded border border-line-strong px-1 font-sans">?</kbd>
        </button>
      </div>
    </div>
  );
}
