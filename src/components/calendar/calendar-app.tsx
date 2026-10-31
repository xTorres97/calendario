"use client";

import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { addMinutes, startOfHour } from "date-fns";
import { Plus } from "lucide-react";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useCursor, useDict } from "@/lib/hooks";
import { seedCategories, seedEvents } from "@/lib/seed";
import { Toolbar } from "./toolbar";
import { Sidebar } from "./sidebar";
import { MonthView } from "./month-view";
import { TimeGrid } from "./time-grid";
import { EventDialog } from "./event-dialog";
import { SearchDialog } from "./search-dialog";
import { HelpDialog } from "./help-dialog";

export function CalendarApp() {
  const hydrated = useCalendar(s => s.hydrated);
  const view = useCalendar(s => s.view);
  const locale = useCalendar(s => s.locale);
  const sidebarOpen = useUI(s => s.sidebarOpen);
  const setSidebarOpen = useUI(s => s.setSidebarOpen);
  const { t } = useDict();

  // Carga lo guardado en el navegador. Si el almacenamiento no está disponible
  // (modo privado, cookies bloqueadas) la app funciona igual con los datos de ejemplo.
  useEffect(() => {
    let done = false;
    Promise.resolve(useCalendar.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        if (done) return;
        if (!useCalendar.getState().hydrated) {
          const s = useCalendar.getState();
          useCalendar.setState({
            ...(s.seeded ? {} : { events: seedEvents(s.locale), categories: seedCategories(s.locale), seeded: true }),
            hydrated: true,
          });
        }
      });
    return () => { done = true; };
  }, []);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  useShortcuts();

  if (!hydrated) {
    return <div className="flex h-dvh items-center justify-center text-sm text-muted" aria-busy>…</div>;
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface md:block" aria-label={t.categories}>
        <Sidebar />
      </aside>

      {/* En móvil la barra lateral es un panel deslizable */}
      <DialogPrimitive.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0b1020]/40 md:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-line bg-surface md:hidden data-[state=open]:animate-[slide-in_160ms_ease-out]">
            <DialogPrimitive.Title className="sr-only">{t.categories}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{t.hint}</DialogPrimitive.Description>
            <Sidebar />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <main className="flex min-w-0 flex-1 flex-col bg-surface">
        <Toolbar />
        <div className="min-h-0 flex-1">
          {view === "month" ? <MonthView /> : <TimeGrid view={view} />}
        </div>
      </main>

      {/* Botón flotante para crear en móvil (la barra lateral está oculta) */}
      <button
        onClick={() => {
          const start = new Date(useCalendar.getState().cursor);
          start.setHours(Math.min(Math.max(new Date().getHours() + 1, 8), 20), 0, 0, 0);
          useUI.getState().openCreate({ start: start.toISOString(), end: addMinutes(start, 60).toISOString(), allDay: false });
        }}
        aria-label={t.newEvent}
        className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-[0_12px_28px_-10px_rgba(47,91,234,.7)] md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <EventDialog />
      <SearchDialog />
      <HelpDialog />
    </div>
  );
}

function useShortcuts() {
  const cursor = useCursor();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); useUI.getState().setSearchOpen(true); }
        return;
      }
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      const ui = useUI.getState();
      if (ui.editor.mode !== "closed" || ui.searchOpen || ui.helpOpen) return;
      const cal = useCalendar.getState();
      switch (e.key.toLowerCase()) {
        case "t": cal.goToday(); break;
        case "m": cal.setView("month"); break;
        case "w": case "s": cal.setView("week"); break;
        case "d": cal.setView("day"); break;
        case "arrowleft": case "j": cal.step(-1); break;
        case "arrowright": case "k": cal.step(1); break;
        case "n": {
          const start = startOfHour(addMinutes(new Date(cursor), 0));
          start.setHours(Math.min(Math.max(new Date().getHours() + 1, 8), 20));
          ui.openCreate({ start: start.toISOString(), end: addMinutes(start, 60).toISOString(), allDay: false });
          break;
        }
        case "/": ui.setSearchOpen(true); break;
        case "?": ui.setHelpOpen(true); break;
        default: return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor]);
}
