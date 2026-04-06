"use client";

import { Popover } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${MONTH_NAMES[m - 1]?.slice(0, 3)} ${y}`;
}

interface DatePickerProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Select a date",
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const parsed = useMemo(() => {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return { year: y, month: m - 1, day: d };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor((parsed?.year ?? today.year) / 12) * 12,
  );

  useEffect(() => {
    if (open) {
      const y = parsed?.year ?? today.year;
      const m = parsed?.month ?? today.month;
      setViewYear(y);
      setViewMonth(m);
      setYearRangeStart(Math.floor(y / 12) * 12);
      setViewMode("days");
    }
  }, [open, parsed, today]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const handleSelect = useCallback(
    (day: number) => {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
      onChange?.(dateStr);
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isToday = (day: number) =>
    viewYear === today.year && viewMonth === today.month && day === today.day;

  const isSelected = (day: number) =>
    parsed !== null && viewYear === parsed.year && viewMonth === parsed.month && day === parsed.day;

  const displayValue = value ? formatDisplay(value) : "";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          onBlur={onBlur}
          disabled={disabled}
          className={`inline-flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 cursor-pointer shadow-sm shadow-slate-100 gap-2 ${
            disabled ? "opacity-40 cursor-not-allowed" : ""
          } ${displayValue ? "text-slate-800" : "text-slate-400"}`}>
          <span className="flex items-center gap-2.5 truncate">
            <CalendarDays className="size-4 text-slate-400 shrink-0" />
            <span className="truncate">{displayValue || placeholder}</span>
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-50 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-4 w-[300px] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          onOpenAutoFocus={(e) => e.preventDefault()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") prevMonth();
                else if (viewMode === "years") setYearRangeStart((s) => s - 12);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") setViewMode("months");
                else if (viewMode === "months") setViewMode("years");
                else setViewMode("days");
              }}
              className="text-sm font-semibold text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors">
              {viewMode === "years"
                ? `${yearRangeStart} – ${yearRangeStart + 11}`
                : viewMode === "months"
                  ? `${viewYear}`
                  : `${MONTH_NAMES[viewMonth]} ${viewYear}`}
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") nextMonth();
                else if (viewMode === "years") setYearRangeStart((s) => s + 12);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Year picker */}
          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setViewMode("months");
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    y === viewYear
                      ? "bg-blue-600 text-white"
                      : y === today.year
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Month picker */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setViewMonth(i);
                    setViewMode("days");
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    i === viewMonth && viewYear === (parsed?.year ?? today.year)
                      ? "bg-blue-600 text-white"
                      : i === today.month && viewYear === today.year
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}>
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Day picker */}
          {viewMode === "days" && (
            <>
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Empty leading cells */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const todayMark = isToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelect(day)}
                      className={`relative h-9 w-full rounded-lg text-sm font-medium transition-all ${
                        selected
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : todayMark
                            ? "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                            : "text-slate-700 hover:bg-slate-100"
                      }`}>
                      {day}
                      {todayMark && !selected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleSelect(today.day)}
                  disabled={viewYear !== today.year || viewMonth !== today.month}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-default">
                  Today
                </button>
              </div>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
