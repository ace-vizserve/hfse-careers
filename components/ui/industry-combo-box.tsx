"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { industry_list } from "@/app/constants";
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

interface IndustryComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  id?: string;
  required?: boolean;
}

/**
 * Multi-select on Popover + Command. Values stay as stringified industry ids
 * because that is what the Manatal payload joins on.
 */
export const IndustryCombobox = ({ value = [], onChange, id }: IndustryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selected = industry_list.filter((ind) => value.includes(String(ind.id)));

  const toggle = (industryId: string) =>
    onChange(value.includes(industryId) ? value.filter((v) => v !== industryId) : [...value, industryId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full min-h-[40px] items-center justify-between gap-2 rounded-[7px] border border-[#D5DAE8] bg-white px-3 py-2 text-left text-[13px]",
            "shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] transition-colors hover:border-[#C8CEE0]",
            "focus-visible:border-[#1E2FA8] focus-visible:ring-2 focus-visible:ring-[#1E2FA8]/40 focus-visible:outline-none",
          )}>
          <span className="flex flex-1 flex-wrap items-center gap-1.5 py-0.5">
            {selected.length === 0 && <span className="text-[#8A92AB]">Select industries…</span>}

            {selected.map((ind) => (
              <span
                key={ind.id}
                className="inline-flex items-center gap-1 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-2 py-0.5 text-[11px] font-medium text-[#1B2A8F]">
                {ind.name}
                <span
                  role="button"
                  aria-label={`Remove ${ind.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(String(ind.id));
                  }}
                  className="transition-opacity hover:opacity-60">
                  <X className="size-3" />
                </span>
              </span>
            ))}
          </span>

          <ChevronDown className="size-4 shrink-0 text-[#6C7591]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] rounded-[10px] border-[#E1E5F0] p-0 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
        <Command>
          <CommandInput placeholder="Search industries…" className="text-[13px]" />
          <CommandList className="max-h-56">
            <CommandEmpty className="py-6 text-center text-[13px] text-[#6C7591]">No industries match</CommandEmpty>
            <CommandGroup>
              {industry_list.map((ind) => {
                const isActive = value.includes(String(ind.id));

                return (
                  <CommandItem
                    key={ind.id}
                    value={ind.name}
                    onSelect={() => toggle(String(ind.id))}
                    className="text-[13px] text-[#10162B] data-[selected=true]:bg-[#E7EAFB] data-[selected=true]:text-[#1B2A8F]">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border",
                        isActive ? "border-[#1E2FA8] bg-[#1E2FA8]" : "border-[#B9C2D9] bg-white",
                      )}>
                      {isActive && <Check className="size-3 text-white" />}
                    </span>
                    {ind.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
