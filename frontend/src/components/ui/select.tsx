"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition-colors outline-none select-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 [&>span]:truncate",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & {
    align?: "start" | "center" | "end";
    sideOffset?: number;
    position?: "popper" | "item-aligned";
    positionerClassName?: string;
  }
>(
  (
    {
      className,
      children,
      align = "start",
      sideOffset = 4,
      position = "popper",
      positionerClassName,
      ...props
    },
    ref
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={position === "item-aligned"}
        className={cn("z-50 min-w-[var(--anchor-width)]", positionerClassName)}
      >
        <SelectPrimitive.Popup
          ref={ref}
          className={cn(
            "relative z-50 max-h-64 min-w-[8rem] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List className="space-y-0.5">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs text-slate-700 outline-none transition-colors data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 data-[selected]:font-semibold data-[selected]:text-blue-600 dark:text-slate-300 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-100 dark:data-[selected]:text-blue-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="truncate">
      {children}
    </SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator>
      <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
