"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { IndustryCombobox } from "@/components/ui/industry-combo-box";
import { NationalityCombobox } from "@/components/ui/nationality-combo-box";
import { StyledSelect } from "@/components/ui/styled-select";
import { getApplicationField, type ApplicationField, type ApplicationFieldKey } from "@/lib/forms/application-fields";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

export const inputBase =
  "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all duration-200 " +
  "hover:border-slate-300 text-sm";

type ControlProps = {
  field: ApplicationField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  /**
   * FormControl hands these down through Radix Slot. They have to land on the
   * real element: the id is what the error focus, the label's htmlFor and the
   * end-to-end selectors all look for.
   */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * Renders the control for one registry entry. Previously this was a ~450-line
 * if-chain inside the page, deciding what to draw by fuzzy-matching Manatal
 * metadata; the widget is now declared up front, so this is a plain switch.
 */
function FieldControl({ field, value, onChange, onBlur, ...a11y }: ControlProps) {
  const text = String(value ?? "");

  switch (field.widget) {
    case "longtext":
      return (
        <textarea
          {...a11y}
          rows={5}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          className={cn(inputBase, "resize-none")}
        />
      );

    case "date":
      return <DatePicker id={a11y.id} value={text} onChange={onChange} onBlur={onBlur} placeholder={field.placeholder} />;

    case "select":
      return (
        <StyledSelect
          id={a11y.id}
          value={text}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={field.placeholder ?? "Select an option"}
          options={[...(field.options ?? [])]}
        />
      );

    case "nationality":
      return <NationalityCombobox id={a11y.id} value={text} onChange={onChange} onBlur={onBlur} />;

    case "industries":
      return (
        <IndustryCombobox
          id={a11y.id}
          value={Array.isArray(value) ? value : value ? [String(value)] : []}
          onChange={onChange}
        />
      );

    case "salary":
    case "digits":
    case "postalcode": {
      // Sanitising on change rather than filtering keydown: e.key for Backspace,
      // Tab and the arrows is a word, so a keydown filter blocked editing
      // entirely, and mobile keyboards that report "Unidentified" blocked typing.
      const maxLength = field.widget === "postalcode" ? 6 : field.maxLength;

      return (
        <input
          {...a11y}
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            onChange(maxLength ? digits.slice(0, maxLength) : digits);
          }}
          onBlur={onBlur}
          placeholder={field.placeholder}
          maxLength={maxLength}
          className={inputBase}
        />
      );
    }

    case "phone":
      return (
        <input
          {...a11y}
          type="tel"
          inputMode="tel"
          value={text}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9+\-\s()]/g, ""))}
          onBlur={onBlur}
          placeholder={field.placeholder ?? "+65 9123 4567"}
          className={inputBase}
        />
      );

    case "nricfin":
      return (
        <input
          {...a11y}
          type="text"
          value={text.toUpperCase()}
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            if (/^[STFGM]?[0-9]{0,7}[A-Za-z]?$/i.test(next)) onChange(next);
          }}
          onBlur={onBlur}
          placeholder={field.placeholder}
          maxLength={9}
          className={cn(inputBase, "uppercase tracking-widest font-mono")}
        />
      );

    case "email":
    case "url":
    case "text":
    default:
      return (
        <input
          {...a11y}
          type={field.widget === "email" ? "email" : field.widget === "url" ? "url" : "text"}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          className={inputBase}
        />
      );
  }
}

type ApplicationFormFieldProps = {
  name: ApplicationFieldKey;
  className?: string;
  /** Overrides the registry's `required`, for rules that depend on other answers. */
  required?: boolean;
  /** Replaces the control entirely, for the resume dropzone which owns its own state. */
  slot?: ReactNode;
  /** Overrides the registry description, for copy that depends on other answers. */
  description?: ReactNode;
};

export function ApplicationFormField({
  name,
  className,
  required,
  slot,
  description,
}: ApplicationFormFieldProps) {
  const field = getApplicationField(name);
  const { control } = useFormContext();
  const helpText = description ?? field.description;

  return (
    <div className={className}>
      <FormField
        control={control}
        name={name}
        render={({ field: controller }) => (
          <FormItem>
            <FormLabel required={required ?? field.required}>{field.label}</FormLabel>

            {slot ?? (
              <FormControl>
                <FieldControl
                  field={field}
                  value={controller.value}
                  onChange={controller.onChange}
                  onBlur={controller.onBlur}
                />
              </FormControl>
            )}

            {helpText && <FormDescription>{helpText}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
