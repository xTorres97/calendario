"use client";

import { create } from "zustand";
import type { CalendarEvent } from "@/lib/types";

export type EditorState =
  | { mode: "closed" }
  | { mode: "create"; draft: Pick<CalendarEvent, "start" | "end" | "allDay"> & Partial<CalendarEvent> }
  | { mode: "edit"; eventId: string };

interface UIState {
  editor: EditorState;
  searchOpen: boolean;
  helpOpen: boolean;
  sidebarOpen: boolean;
  openCreate: (draft: Extract<EditorState, { mode: "create" }>["draft"]) => void;
  openEdit: (eventId: string) => void;
  closeEditor: () => void;
  setSearchOpen: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useUI = create<UIState>()(set => ({
  editor: { mode: "closed" },
  searchOpen: false,
  helpOpen: false,
  sidebarOpen: false,
  openCreate: draft => set({ editor: { mode: "create", draft } }),
  openEdit: eventId => set({ editor: { mode: "edit", eventId } }),
  closeEditor: () => set({ editor: { mode: "closed" } }),
  setSearchOpen: searchOpen => set({ searchOpen }),
  setHelpOpen: helpOpen => set({ helpOpen }),
  setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
}));
