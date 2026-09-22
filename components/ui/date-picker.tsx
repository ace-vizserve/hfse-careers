"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

/** The form stores dates as `YYYY-MM-DD`, so convert at the boundary only. */
const toISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromISO = (value?: string | null) => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const formatDisplay = (date?: Date) =>
  date
    ? date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
    : "";

/**
 * Popover + Calendar, replacing a hand-built month grid. react-day-picker brings
 * keyboard navigation, month and year dropdowns and the date semantics that the
 * bespoke version never had.
 */
export function DatePicker({ id, value, onChange, onBlur, placeholder = "Select a date", disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = fromISO(value);

  return (
    <Popover open={open} onOpenChange={(next) => {
      setOpen(next);
      if (!next) onBlur?.();
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex w-full min-h-[40px] items-center justify-between gap-2 rounded-[7px] border border-[#D5DAE8] bg-white px-3 py-2.5 text-[13px]",
            "shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] transition-colors hover:border-[#C8CEE0]",
            "focus-visible:border-[#1E2FA8] focus-visible:ring-2 focus-visible:ring-[#1E2FA8]/40 focus-visible:outline-none",
            disabled && "cursor-not-allowed opacity-50",
            selected ? "text-[#10162B]" : "text-[#8A92AB]",
          )}>
          {selected ? formatDisplay(selected) : placeholder}
          <CalendarDays className="size-[15px] shrink-0 text-[#6C7591]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto rounded-[10px] border-[#E1E5F0] bg-white p-3 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(1940, 0)}
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
          onSelect={(date) => {
            if (!date) return;
            onChange?.(toISO(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
