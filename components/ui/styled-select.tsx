"use client";

import { Select } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { forwardRef } from "react";

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
}

export const StyledSelect = forwardRef<HTMLButtonElement, StyledSelectProps>(
  ({ id, value, defaultValue, onChange, onBlur, placeholder = "Select an option", options, disabled, name }, ref) => {
    return (
      <Select.Root value={value} defaultValue={defaultValue} onValueChange={onChange} disabled={disabled} name={name}>
        <Select.Trigger
          ref={ref}
          id={id}
          onBlur={onBlur}
          className="inline-flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed data-[placeholder]:text-slate-400 text-slate-800 shadow-sm shadow-slate-100 gap-2">
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown className="size-4 text-slate-400 shrink-0" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 z-50 min-w-[var(--radix-select-trigger-width)] max-h-[min(var(--radix-select-content-available-height),320px)] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2">
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white cursor-default">
              <ChevronDown className="size-3.5 text-slate-400 rotate-180" />
            </Select.ScrollUpButton>

            <Select.Viewport className="p-1.5">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 rounded-lg cursor-pointer select-none outline-none data-[highlighted]:bg-slate-50 data-[highlighted]:text-slate-900 data-[state=checked]:text-blue-700 data-[state=checked]:font-medium transition-colors">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="size-3.5 text-blue-600" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>

            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white cursor-default">
              <ChevronDown className="size-3.5 text-slate-400" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    );
  },
);

StyledSelect.displayName = "StyledSelect";
