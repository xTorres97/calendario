"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useUI } from "@/store/ui";
import { useDict } from "@/lib/hooks";

export function HelpDialog() {
  const open = useUI(s => s.helpOpen);
  const setOpen = useUI(s => s.setHelpOpen);
  const { t } = useDict();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent closeLabel={t.form.cancel} className="max-w-sm">
        <DialogTitle className="font-display text-xl font-semibold">{t.shortcuts}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted">{t.hint}</DialogDescription>
        <dl className="mt-4 divide-y divide-line">
          {t.shortcutList.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between py-2 text-sm">
              <dt>{label}</dt>
              <dd className="flex gap-1">
                {keys.split(" ").map((k, i) => k === "/" && keys.length > 1 ? <span key={i} className="text-muted">/</span> : (
                  <kbd key={i} className="min-w-6 rounded-md border border-line-strong bg-surface-2 px-1.5 py-0.5 text-center font-sans text-xs">{k}</kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
