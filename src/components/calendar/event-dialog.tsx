"use client";

import { useId, useMemo, useState } from "react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/store/calendar";
import { useUI } from "@/store/ui";
import { useDict } from "@/lib/hooks";
import type { CalendarEvent, Frequency } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { categoryVars } from "./category-style";

interface FormState {
  title: string;
  allDay: boolean;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  location: string;
  description: string;
  repeat: "none" | Frequency;
  until: string;
}

function toForm(e: Pick<CalendarEvent, "start" | "end" | "allDay"> & Partial<CalendarEvent>, fallbackCategory: string): FormState {
  const start = parseISO(e.start);
  const end = parseISO(e.end);
  return {
    title: e.title ?? "",
    allDay: e.allDay,
    date: format(start, "yyyy-MM-dd"),
    endDate: format(e.allDay ? addDays(end, -1) : end, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    categoryId: e.categoryId ?? fallbackCategory,
    location: e.location ?? "",
    description: e.description ?? "",
    repeat: e.recurrence?.freq ?? "none",
    until: e.recurrence?.until ?? "",
  };
}

const formSchema = z.object({
  title: z.string().trim().min(1, "title"),
  allDay: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

/** Convierte el formulario en un evento; devuelve una clave de error si no es válido. */
function fromForm(f: FormState, id: string): CalendarEvent | "titleRequired" | "endBeforeStart" {
  const parsed = formSchema.safeParse(f);
  if (!parsed.success) return parsed.error.issues.some(i => i.path[0] === "title") ? "titleRequired" : "endBeforeStart";

  let start: Date, end: Date;
  if (f.allDay) {
    start = startOfDay(parseISO(f.date));
    end = addDays(startOfDay(parseISO(f.endDate < f.date ? f.date : f.endDate)), 1);
  } else {
    start = parseISO(`${f.date}T${f.startTime}`);
    end = parseISO(`${f.date}T${f.endTime}`);
    // Si la hora de fin es menor, se asume que termina al día siguiente solo si es "00:00"
    if (f.endTime === "00:00") end = addDays(end, 1);
    if (end <= start) return "endBeforeStart";
  }

  return {
    id,
    title: f.title.trim(),
    allDay: f.allDay,
    start: start.toISOString(),
    end: end.toISOString(),
    categoryId: f.categoryId,
    location: f.location.trim() || undefined,
    description: f.description.trim() || undefined,
    recurrence: f.repeat === "none" ? undefined : { freq: f.repeat, interval: 1, until: f.until || undefined },
  };
}

export function EventDialog() {
  const editor = useUI(s => s.editor);
  const close = useUI(s => s.closeEditor);
  const events = useCalendar(s => s.events);
  const categories = useCalendar(s => s.categories);
  const addEvent = useCalendar(s => s.addEvent);
  const updateEvent = useCalendar(s => s.updateEvent);
  const deleteEvent = useCalendar(s => s.deleteEvent);
  const { t } = useDict();
  const ids = useId();

  const editing = editor.mode === "edit" ? events.find(e => e.id === editor.eventId) : undefined;
  const source = editor.mode === "create" ? editor.draft : editing;
  const initial = useMemo(() => (source ? toForm(source, categories[0]?.id ?? "") : null), [source, categories]);

  // Reinicia el formulario cuando cambia lo que se está editando (patrón "estado derivado del render anterior")
  const editorKey = editor.mode === "edit" ? `e:${editor.eventId}` : editor.mode === "create" ? `c:${editor.draft.start}:${editor.draft.end}` : "closed";
  const [state, setState] = useState<{ key: string; form: FormState | null; error: string | null }>({ key: editorKey, form: initial, error: null });
  if (state.key !== editorKey) setState({ key: editorKey, form: initial, error: null });
  const { form, error } = state;
  const setForm = (fn: (f: FormState | null) => FormState | null) => setState(s => ({ ...s, form: fn(s.form) }));
  const setError = (error: string | null) => setState(s => ({ ...s, error }));

  const open = editor.mode !== "closed" && !!form;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => (f ? { ...f, [k]: v } : f));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const result = fromForm(form, editing?.id ?? uid());
    if (typeof result === "string") { setError(t.form[result]); return; }
    if (editing) { updateEvent(result); toast(t.toasts.saved); }
    else { addEvent(result); toast(t.toasts.created); }
    close();
  }

  function onDelete() {
    if (!editing) return;
    const removed = deleteEvent(editing.id);
    close();
    if (removed) toast(t.toasts.deleted, { action: { label: t.toasts.undo, onClick: () => addEvent(removed) } });
  }

  const field = "h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) close(); }}>
      {form && (
        <DialogContent closeLabel={t.form.cancel} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogTitle className="font-display text-xl font-semibold">{editing ? t.editEvent : t.newEvent}</DialogTitle>
          <DialogDescription className="sr-only">{editing ? t.editEvent : t.newEvent}</DialogDescription>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor={`${ids}-title`} className="sr-only">{t.form.title}</label>
              <input
                id={`${ids}-title`}
                autoFocus
                value={form.title}
                onChange={e => { set("title", e.target.value); setError(null); }}
                placeholder={t.form.titlePlaceholder}
                className="w-full border-b border-line-strong bg-transparent pb-2 font-display text-2xl text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                aria-invalid={error === t.form.titleRequired}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div>
                <label htmlFor={`${ids}-date`} className={label}>{t.form.date}</label>
                <input id={`${ids}-date`} type="date" value={form.date} onChange={e => set("date", e.target.value)} className={field} />
              </div>
              <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allDay} onChange={e => set("allDay", e.target.checked)} className="size-4 accent-[var(--accent)]" />
                {t.allDay}
              </label>
            </div>

            {form.allDay ? (
              <div>
                <label htmlFor={`${ids}-enddate`} className={label}>{t.form.end}</label>
                <input id={`${ids}-enddate`} type="date" min={form.date} value={form.endDate} onChange={e => set("endDate", e.target.value)} className={field} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${ids}-start`} className={label}>{t.form.start}</label>
                  <input id={`${ids}-start`} type="time" step={900} value={form.startTime} onChange={e => { set("startTime", e.target.value); setError(null); }} className={field} />
                </div>
                <div>
                  <label htmlFor={`${ids}-end`} className={label}>{t.form.end}</label>
                  <input id={`${ids}-end`} type="time" step={900} value={form.endTime} onChange={e => { set("endTime", e.target.value); setError(null); }} className={field} aria-invalid={error === t.form.endBeforeStart} />
                </div>
              </div>
            )}

            <fieldset>
              <legend className={label}>{t.form.category}</legend>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => {
                  const active = form.categoryId === c.id;
                  return (
                    <label
                      key={c.id}
                      style={categoryVars(c)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]",
                        active ? "border-[var(--c-solid)] bg-[var(--c-soft)] text-[var(--c-ink)] dark:bg-[var(--c-soft-d)] dark:text-[var(--c-ink-d)]" : "border-line-strong text-muted hover:text-ink"
                      )}
                    >
                      <input type="radio" name={`${ids}-cat`} value={c.id} checked={active} onChange={() => set("categoryId", c.id)} className="sr-only" />
                      <span className="size-2 rounded-full bg-[var(--c-solid)]" />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${ids}-repeat`} className={label}>{t.form.repeat}</label>
                <select id={`${ids}-repeat`} value={form.repeat} onChange={e => set("repeat", e.target.value as FormState["repeat"])} className={field}>
                  <option value="none">{t.form.repeatNone}</option>
                  <option value="daily">{t.form.repeatDaily}</option>
                  <option value="weekly">{t.form.repeatWeekly}</option>
                  <option value="monthly">{t.form.repeatMonthly}</option>
                </select>
              </div>
              {form.repeat !== "none" && (
                <div>
                  <label htmlFor={`${ids}-until`} className={label}>{t.form.until}</label>
                  <input id={`${ids}-until`} type="date" min={form.date} value={form.until} onChange={e => set("until", e.target.value)} className={field} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor={`${ids}-loc`} className={label}>{t.form.location}</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" aria-hidden />
                <input id={`${ids}-loc`} value={form.location} onChange={e => set("location", e.target.value)} className={cn(field, "pl-8")} />
              </div>
            </div>

            <div>
              <label htmlFor={`${ids}-desc`} className={label}>{t.form.description}</label>
              <textarea id={`${ids}-desc`} rows={3} value={form.description} onChange={e => set("description", e.target.value)} className={cn(field, "h-auto resize-y py-2")} />
            </div>

            {editing?.recurrence && <p className="text-xs text-muted">{t.form.recurringNote}</p>}
            {error && <p role="alert" className="text-sm font-medium text-[#c4323a] dark:text-[#ff8a8e]">{error}</p>}

            <div className="flex items-center gap-2 pt-1">
              {editing && (
                <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                  <Trash2 /> {t.form.delete}
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" onClick={close}>{t.form.cancel}</Button>
                <Button type="submit" variant="primary">{editing ? t.form.save : t.form.create}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
