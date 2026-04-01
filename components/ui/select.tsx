"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  placeholder?: string;
};

export function Select({
  options,
  value,
  onChange,
  disabled = false,
  className,
  contentClassName,
  placeholder = "Select\u2026",
}: SelectProps) {
  const selected = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 text-left outline-none",
            "min-h-[52px] rounded-[14px] border border-line bg-paper-3 px-4 py-4 text-ink transition-all duration-200",
            "focus:border-accent/30 focus:shadow-[0_0_0_4px_rgba(232,101,10,0.08)]",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          type="button"
        >
          <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "max-h-[min(50vh,320px)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto",
          contentClassName,
        )}
      >
        <DropdownMenuRadioGroup onValueChange={onChange} value={value}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
