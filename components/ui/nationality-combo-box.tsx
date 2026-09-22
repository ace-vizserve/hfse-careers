"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { nationalities } from "@/app/constants";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NationalityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Popover + Command, replacing a hand-rolled listbox. The stored value stays the
 * demonym, as the Manatal payload expects; the common name is only shown to help
 * a candidate find the right row.
 */
export const NationalityCombobox = ({
  value,
  onChange,
  onBlur,
  placeholder = "Search nationality…",
  id,
}: NationalityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selected = nationalities.find((n) => n.demonym === value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full min-h-[40px] items-center justify-between gap-2 rounded-[7px] border border-[#D5DAE8] bg-white px-3 py-2.5 text-[13px]",
            "shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] transition-colors hover:border-[#C8CEE0]",
            "focus-visible:border-[#1E2FA8] focus-visible:ring-2 focus-visible:ring-[#1E2FA8]/40 focus-visible:outline-none",
            selected ? "text-[#10162B]" : "text-[#8A92AB]",
          )}>
          <span className="truncate">
            {selected ? `${selected.demonym} (${selected.common_name})` : placeholder}
          </span>

          <span className="flex shrink-0 items-center gap-1">
            {value && (
              <span
                role="button"
                aria-label="Clear nationality"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="rounded p-0.5 text-[#6C7591] transition-colors hover:text-[#10162B]">
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 text-[#6C7591]" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] rounded-[10px] border-[#E1E5F0] p-0 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
        <Command>
          <CommandInput placeholder="Type to filter…" className="text-[13px]" />
          <CommandList className="max-h-60">
            <CommandEmpty className="py-6 text-center text-[13px] text-[#6C7591]">
              No nationality matches
            </CommandEmpty>
            <CommandGroup>
              {nationalities.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.demonym} ${option.common_name}`}
                  onSelect={() => {
                    onChange(option.demonym);
                    setOpen(false);
                  }}
                  className="text-[13px] text-[#10162B] data-[selected=true]:bg-[#E7EAFB] data-[selected=true]:text-[#1B2A8F]">
                  <Check
                    className={cn("size-4 text-[#1E2FA8]", option.demonym === value ? "opacity-100" : "opacity-0")}
                  />
                  {option.demonym}
                  <span className="ml-1 text-[#6C7591]">({option.common_name})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
