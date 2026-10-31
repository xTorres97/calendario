"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addDays, addMonths, addWeeks, parseISO } from "date-fns";
import type { CalendarEvent, Category, Locale, ViewMode } from "@/lib/types";
import { seedCategories, seedEvents } from "@/lib/seed";
import { DICTS } from "@/lib/i18n";

interface CalendarState {
  events: CalendarEvent[];
  categories: Category[];
  hiddenCategories: string[];
  view: ViewMode;
  /** Fecha que se está mirando (ISO). No se persiste: siempre abre en hoy. */
  cursor: string;
  locale: Locale;
  seeded: boolean;
  hydrated: boolean;

  addEvent: (e: CalendarEvent) => void;
  updateEvent: (e: CalendarEvent) => void;
  deleteEvent: (id: string) => CalendarEvent | undefined;
  /** Desplaza inicio y fin (en ms). En series mueve toda la serie. */
  shiftEvent: (id: string, deltaMs: number) => void;
  /** Cambia la duración sumando `deltaMs` al fin (mínimo 15 min). */
  resizeEvent: (id: string, deltaMs: number) => void;

  setView: (v: ViewMode) => void;
  setCursor: (d: Date) => void;
  step: (dir: -1 | 1) => void;
  goToday: () => void;
  toggleCategory: (id: string) => void;
  setLocale: (l: Locale) => void;
  resetDemo: () => void;
}

const MIN_DURATION = 15 * 60_000;

const shiftIso = (iso: string, ms: number) => new Date(parseISO(iso).getTime() + ms).toISOString();

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      categories: [],
      hiddenCategories: [],
      view: "week",
      cursor: new Date().toISOString(),
      locale: "es",
      seeded: false,
      hydrated: false,

      addEvent: e => set(s => ({ events: [...s.events, e] })),
      updateEvent: e => set(s => ({ events: s.events.map(x => (x.id === e.id ? e : x)) })),
      deleteEvent: id => {
        const found = get().events.find(e => e.id === id);
        set(s => ({ events: s.events.filter(e => e.id !== id) }));
        return found;
      },
      shiftEvent: (id, deltaMs) =>
        set(s => ({
          events: s.events.map(e =>
            e.id === id ? { ...e, start: shiftIso(e.start, deltaMs), end: shiftIso(e.end, deltaMs) } : e
          ),
        })),
      resizeEvent: (id, deltaMs) =>
        set(s => ({
          events: s.events.map(e => {
            if (e.id !== id) return e;
            const start = parseISO(e.start).getTime();
            const end = Math.max(start + MIN_DURATION, parseISO(e.end).getTime() + deltaMs);
            return { ...e, end: new Date(end).toISOString() };
          }),
        })),

      setView: view => set({ view }),
      setCursor: d => set({ cursor: d.toISOString() }),
      step: dir => {
        const { view, cursor } = get();
        const d = parseISO(cursor);
        const next = view === "month" ? addMonths(d, dir) : view === "week" ? addWeeks(d, dir) : addDays(d, dir);
        set({ cursor: next.toISOString() });
      },
      goToday: () => set({ cursor: new Date().toISOString() }),
      toggleCategory: id =>
        set(s => ({
          hiddenCategories: s.hiddenCategories.includes(id)
            ? s.hiddenCategories.filter(x => x !== id)
            : [...s.hiddenCategories, id],
        })),
      setLocale: locale =>
        set(s => {
          // Traduce el nombre de las categorías por defecto que el usuario no renombró
          const from = DICTS[s.locale].defaultCategories as Record<string, string>;
          const to = DICTS[locale].defaultCategories as Record<string, string>;
          const categories = s.categories.map(c => (from[c.id] === c.name && to[c.id] ? { ...c, name: to[c.id] } : c));
          return { locale, categories };
        }),
      resetDemo: () => {
        const locale = get().locale;
        set({ events: seedEvents(locale), categories: seedCategories(locale), hiddenCategories: [], seeded: true });
      },
    }),
    {
      name: "calendario:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: s => ({
        events: s.events,
        categories: s.categories,
        hiddenCategories: s.hiddenCategories,
        view: s.view,
        locale: s.locale,
        seeded: s.seeded,
      }),
      onRehydrateStorage: () => state => {
        if (!state) return;
        if (!state.seeded) {
          const locale = detectLocale();
          useCalendar.setState({
            locale,
            events: seedEvents(locale),
            categories: seedCategories(locale),
            seeded: true,
          });
        }
        // En pantallas chicas abrir en vista día
        if (typeof window !== "undefined" && window.innerWidth < 640 && state.view === "week") {
          useCalendar.setState({ view: "day" });
        }
        useCalendar.setState({ hydrated: true });
      },
    }
  )
);
