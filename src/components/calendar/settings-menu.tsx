"use client";

import { useTheme } from "next-themes";
import { Code2, Download, Languages, RotateCcw, Settings2, SunMoon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendar } from "@/store/calendar";
import { useDict } from "@/lib/hooks";
import { toICS } from "@/lib/ics";
import type { Locale } from "@/lib/types";

export const REPO_URL = "https://github.com/xTorres97/calendario";

export function SettingsMenu() {
  const { t, locale } = useDict();
  const { theme, setTheme } = useTheme();
  const setLocale = useCalendar(s => s.setLocale);
  const resetDemo = useCalendar(s => s.resetDemo);

  function exportIcs() {
    const blob = new Blob([toICS(useCalendar.getState().events)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "calendario.ics" });
    a.click();
    URL.revokeObjectURL(url);
    toast(t.toasts.exported);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.menu.theme}><Settings2 /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-1.5"><SunMoon className="size-3.5" />{t.menu.theme}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">{t.menu.light}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t.menu.dark}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t.menu.system}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5"><Languages className="size-3.5" />{t.menu.language}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={v => setLocale(v as Locale)}>
          <DropdownMenuRadioItem value="es">Español</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={exportIcs}><Download />{t.menu.exportIcs}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { resetDemo(); toast(t.toasts.reset); }}><RotateCcw />{t.menu.resetDemo}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer"><Code2 />{t.menu.sourceCode}</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
