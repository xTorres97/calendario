"use client";

import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export const DropdownMenuRadioGroup = DM.RadioGroup;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-48 rounded-xl border border-line bg-surface p-1 text-sm text-ink shadow-[0_16px_40px_-16px_rgba(15,20,40,.35)]", className)}
        {...props}
      />
    </DM.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return <DM.Item className={cn("flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted", className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DM.RadioItem>) {
  return (
    <DM.RadioItem className={cn("flex cursor-default select-none items-center gap-2 rounded-lg py-2 pl-8 pr-2.5 outline-none data-[highlighted]:bg-surface-2 relative", className)} {...props}>
      <DM.ItemIndicator className="absolute left-2.5"><Check className="size-4 text-accent" /></DM.ItemIndicator>
      {children}
    </DM.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-2.5 pb-1 pt-2 text-xs text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DM.Separator>) {
  return <DM.Separator className={cn("my-1 h-px bg-line", className)} {...props} />;
}
