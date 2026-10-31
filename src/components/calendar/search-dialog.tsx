"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Repeat, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useDict } from "@/lib/hooks";
import { categoryVars } from "./category-style";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SearchDialog() {
  const open = useUI(s => s.searchOpen);
  const setOpen = useUI(s => s.setSearchOpen);
  const openEdit = useUI(s => s.openEdit);
  const events = useCalendar(s => s.events);
  const categories = useCalendar(s => s.categories);
  const setCursor = useCalendar(s => s.setCursor);
  const { t, dateLocale } = useDict();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return [];
    return events
      .filter(e => normalize([e.title, e.location, e.description].filter(Boolean).join(" ")).includes(n))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 30);
  }, [q, events]);

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setQ(""); }}>
      <DialogContent closeLabel={t.form.cancel} className="top-[15%] max-w-xl translate-y-0 p-0 data-[state=open]:animate-[fade-in_120ms_ease-out]">
        <DialogTitle className="sr-only">{t.search}</DialogTitle>
        <DialogDescription className="sr-only">{t.searchPlaceholder}</DialogDescription>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
            className="h-12 flex-1 bg-transparent pr-8 text-base outline-none placeholder:text-muted/70"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-1.5" role="listbox" aria-label={t.search}>
          {q.trim() && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t.noResults}</li>}
          {results.map(e => {
            const cat = categories.find(c => c.id === e.categoryId);
            return (
              <li key={e.id}>
                <button
                  onClick={() => { setCursor(parseISO(e.start)); setOpen(false); setQ(""); openEdit(e.id); }}
                  style={categoryVars(cat)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                >
                  <span className="size-2.5 shrink-0 rounded-full bg-[var(--c-solid)]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {e.title}{e.recurrence && <Repeat className="size-3 text-muted" aria-hidden />}
                    </span>
                    {e.location && <span className="block truncate text-xs text-muted">{e.location}</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{format(parseISO(e.start), e.allDay ? "d MMM" : "d MMM, p", { locale: dateLocale })}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
