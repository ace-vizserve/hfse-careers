"use client";

import { industry_list } from "@/app/constants";
import { useEffect, useRef, useState } from "react";

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}

export const IndustryCombobox = ({ value, onChange, id }: IndustryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = industry_list.find((ind) => String(ind.id) === String(value));
  const filtered = industry_list.filter((ind) => ind.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inputBase =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all duration-200 " +
    "hover:border-slate-300 text-sm";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className={`${inputBase} flex items-center justify-between gap-2 text-left ${
          !selected ? "text-slate-400" : "text-slate-800"
        }`}>
        <span className="truncate">{selected ? selected.name : "Select an industry"}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search industries…"
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((ind) => {
                const isActive = String(value) === String(ind.id);
                return (
                  <li key={ind.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        onChange(String(ind.id));
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
                      }`}>
                      <span>{ind.name}</span>
                      {isActive && (
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">No industries match</li>
            )}
          </ul>

          {/* Clear */}
          {value && (
            <div className="p-2 border-t border-slate-100">
              <button
                type="button"
                onMouseDown={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
