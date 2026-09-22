"use client";

import { forwardRef } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  name?: string;
  className?: string;
}

/**
 * The project's select, now a thin skin over the shadcn Select. Keeping this
 * wrapper means call sites still pass `options` and `onChange(value)` rather
 * than composing Radix parts at every field.
 */
export const StyledSelect = forwardRef<HTMLButtonElement, StyledSelectProps>(
  ({ id, value, defaultValue, onChange, onBlur, placeholder = "Select an option", options, disabled, name, className }, ref) => (
    <Select value={value} defaultValue={defaultValue} onValueChange={onChange} disabled={disabled} name={name}>
      <SelectTrigger
        ref={ref}
        id={id}
        onBlur={onBlur}
        className={cn(
          "w-full min-h-[40px] rounded-[7px] border-[#D5DAE8] bg-white px-3 py-2.5 text-[13px] text-[#10162B]",
          "shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] data-[placeholder]:text-[#8A92AB]",
          "focus-visible:border-[#1E2FA8] focus-visible:ring-2 focus-visible:ring-[#1E2FA8]/40",
          className,
        )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className="rounded-[10px] border-[#E1E5F0] bg-white shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="rounded-md text-[13px] text-[#10162B] focus:bg-[#E7EAFB] focus:text-[#1B2A8F]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
);

StyledSelect.displayName = "StyledSelect";
