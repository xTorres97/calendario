import { addDays, addMinutes, format, startOfDay, startOfWeek } from "date-fns";
import type { CalendarEvent, Category, Locale } from "./types";
import { DICTS } from "./i18n";

export function seedCategories(locale: Locale): Category[] {
  const n = DICTS[locale].defaultCategories;
  return [
    { id: "work", name: n.work, color: "cobalt" },
    { id: "personal", name: n.personal, color: "teal" },
    { id: "health", name: n.health, color: "rose" },
    { id: "learning", name: n.learning, color: "violet" },
    { id: "social", name: n.social, color: "amber" },
  ];
}

type SeedRow = [day: number, startH: number, startM: number, minutes: number, cat: string, es: string, en: string, extra?: Partial<CalendarEvent>];

/** Semana de ejemplo relativa a hoy, para que la demo siempre se vea viva. */
export function seedEvents(locale: Locale, today = new Date()): CalendarEvent[] {
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const L = (es: string, en: string) => (locale === "es" ? es : en);

  const rows: SeedRow[] = [
    [0, 9, 0, 30, "work", "Planificación semanal", "Weekly planning", { recurrence: { freq: "weekly", interval: 1 } }],
    [0, 10, 0, 90, "work", "Diseño del onboarding", "Onboarding design", { location: "Sala Ávila / Ávila room" }],
    [0, 13, 0, 60, "social", "Almuerzo con Andrea", "Lunch with Andrea", { location: "Café Arábica" }],
    [0, 18, 30, 60, "health", "Gimnasio", "Gym", { recurrence: { freq: "weekly", interval: 1 } }],
    [0, 7, 0, 15, "health", "Meditación", "Meditation", { recurrence: { freq: "daily", interval: 1 } }],
    [1, 8, 0, 60, "learning", "Clase de inglés", "Spanish class", { recurrence: { freq: "weekly", interval: 1 } }],
    [3, 8, 0, 60, "learning", "Clase de inglés", "Spanish class", { recurrence: { freq: "weekly", interval: 1 } }],
    [1, 11, 0, 60, "work", "Revisión con el cliente", "Client review", { description: L("Llevar el prototipo y las métricas de la semana.", "Bring the prototype and this week's metrics.") }],
    [1, 11, 30, 45, "work", "Llamada con soporte", "Support call"],
    [1, 15, 0, 120, "work", "Sesión de foco: API de pagos", "Focus block: payments API"],
    [2, 10, 0, 60, "health", "Odontólogo", "Dentist", { location: "Clínica Las Mercedes" }],
    [2, 14, 0, 60, "work", "Demo del sprint", "Sprint demo", { recurrence: { freq: "weekly", interval: 2 } }],
    [2, 14, 30, 30, "work", "Entrevista técnica", "Technical interview"],
    [2, 19, 0, 120, "social", "Cumpleaños de Luis", "Luis's birthday", { location: "Altamira" }],
    [3, 9, 30, 60, "work", "Retro del equipo", "Team retro"],
    [3, 12, 0, 60, "personal", "Pagar servicios", "Pay utility bills"],
    [3, 16, 0, 90, "learning", "Curso de TypeScript avanzado", "Advanced TypeScript course"],
    [4, 10, 0, 180, "work", "Taller de accesibilidad", "Accessibility workshop", { location: "Online" }],
    [4, 18, 0, 60, "health", "Yoga", "Yoga", { recurrence: { freq: "weekly", interval: 1 } }],
    [5, 10, 0, 120, "personal", "Mercado y compras", "Groceries"],
    [5, 20, 0, 150, "social", "Cine con amigos", "Movie night"],
    [6, 11, 0, 90, "personal", "Llamada familiar", "Family call", { recurrence: { freq: "weekly", interval: 1 } }],
    [8, 9, 0, 60, "work", "Kickoff nuevo proyecto", "New project kickoff"],
    [10, 15, 0, 60, "health", "Chequeo médico anual", "Annual check-up"],
    [12, 19, 0, 120, "social", "Cena de equipo", "Team dinner"],
    [-3, 10, 0, 60, "work", "Entrega de propuesta", "Proposal handoff"],
    [-5, 17, 0, 90, "learning", "Meetup de React", "React meetup", { location: "Caracas" }],
    [-7, 11, 0, 60, "work", "Revisión de presupuesto", "Budget review"],
    [-9, 15, 30, 60, "health", "Fisioterapia", "Physiotherapy"],
    [-12, 10, 0, 120, "work", "Workshop de producto", "Product workshop"],
    [-13, 19, 0, 120, "social", "Cena con la familia", "Family dinner"],
    [-16, 9, 0, 60, "work", "Onboarding de Carla", "Carla's onboarding"],
    [-19, 16, 0, 90, "learning", "Charla de diseño", "Design talk"],
    [-22, 12, 0, 60, "personal", "Renovar pasaporte", "Renew passport"],
    [-24, 10, 0, 60, "work", "Planificación trimestral", "Quarterly planning"],
    [15, 10, 0, 60, "work", "Revisión de métricas", "Metrics review"],
    [17, 18, 0, 90, "learning", "Meetup de TypeScript", "TypeScript meetup"],
    [19, 12, 0, 60, "personal", "Corte de pelo", "Haircut"],
    [22, 9, 30, 60, "work", "Kickoff Q1", "Q1 kickoff"],
    [24, 20, 0, 120, "social", "Concierto", "Concert"],
  ];

  const events: CalendarEvent[] = rows.map(([day, h, m, minutes, cat, es, en, extra], i) => {
    // Las series empiezan 4 semanas atrás para que el pasado reciente también tenga eventos
    const offset = extra?.recurrence ? (extra.recurrence.freq === "daily" ? -14 : -28) : 0;
    const start = addMinutes(addDays(monday, day + offset), h * 60 + m);
    return {
      id: `seed-${i}`,
      title: L(es, en),
      start: start.toISOString(),
      end: addMinutes(start, minutes).toISOString(),
      allDay: false,
      categoryId: cat,
      ...extra,
    };
  });

  // Eventos de todo el día
  const allDay = (id: string, day: number, days: number, cat: string, es: string, en: string): CalendarEvent => {
    const s = startOfDay(addDays(monday, day));
    return { id, title: L(es, en), start: s.toISOString(), end: addDays(s, days).toISOString(), allDay: true, categoryId: cat };
  };
  events.push(
    allDay("seed-ad-1", 3, 1, "personal", "Aniversario", "Anniversary"),
    allDay("seed-ad-2", 9, 3, "work", "Conferencia de producto", "Product conference"),
    allDay("seed-ad-3", 15, 1, "work", "Cierre de trimestre", "Quarter close"),
  );

  // Fecha fin para la clase diaria: 3 semanas
  const daily = events.find(e => e.recurrence?.freq === "daily");
  if (daily?.recurrence) daily.recurrence.until = format(addDays(monday, 21), "yyyy-MM-dd");

  return events;
}
