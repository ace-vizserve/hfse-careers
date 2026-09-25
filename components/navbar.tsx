"use client";

import {
  Briefcase,
  ChevronLeft,
  Facebook,
  Filter,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Search,
  Building2,
  Clock,
} from "lucide-react";
import Image from "next/image";

import { Checkbox } from "@/components/ui/checkbox";
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from "@/components/ui/bottom-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StyledSelect } from "@/components/ui/styled-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React, { useState } from "react";

interface NavbarProps {
  showBackButton?: boolean;
  /** The search + filter row only has something to drive on the listings page. */
  showSearch?: boolean;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterOptions) => void;
  employers?: string[];
  /** Drives the sheet's "Show N roles" button, so a filter's effect is visible
   *  before it is dismissed. */
  resultCount?: number;
}

interface FilterOptions {
  employmentType: string;
  isRemote: boolean | null;
  employer: string;
  frequency: string;
  urgentOnly: boolean;
}

/** Radix Select rejects an empty item value, so this stands in for "no filter". */
const ALL_VALUE = "__all__";

/**
 * One button, opened by either the popover or the sheet depending on width.
 * At module scope on purpose: declared inside Navbar it would be a new
 * component type on every render, and Radix would rebuild the trigger rather
 * than update it -- which drops the click that was aimed at it.
 */
const FilterTriggerButton = ({ count, ...props }: React.ComponentProps<"button"> & { count: number }) => (
  <button
    aria-label="Filter positions"
    className="relative flex min-h-[42px] flex-shrink-0 items-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-3.5 py-3 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all duration-200 hover:brightness-110 sm:min-h-[46px] lg:px-7"
    {...props}>
    <Filter className="h-[18px] w-[18px]" />
    <span className="hidden lg:inline">Filter Positions</span>
    {count > 0 && (
      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md border border-white bg-[#1E2FA8] text-[11px] font-semibold text-white shadow-[0_1px_3px_rgba(30,47,168,0.3)] sm:-right-2.5 sm:-top-2.5 sm:h-7 sm:w-7">
        {count}
      </span>
    )}
  </button>
);

const Navbar: React.FC<NavbarProps> = ({
  showBackButton = false,
  showSearch = true,
  onBack,
  onSearch,
  onFilterChange,
  employers = [],
  resultCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Two states, not one. Both the popover and the sheet stay mounted at every
  // width and each renders through a portal, so a shared flag would open the
  // hidden one as well -- its content escapes the wrapper that hides it.
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ employmentType: "", isRemote: null, employer: "", frequency: "", urgentOnly: false });


  // Close filter dropdown on outside click

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterUpdate = (key: keyof FilterOptions, value: any) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const clearFilters = () => {
    const cleared: FilterOptions = { employmentType: "", isRemote: null, employer: "", frequency: "", urgentOnly: false };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  const activeFilterCount = [
    filters.employmentType,
    filters.isRemote !== null,
    filters.employer,
    filters.frequency,
    filters.urgentOnly,
  ].filter(
    Boolean,
  ).length;


  // ── Radio pill (Bigger text & padding) ──────────────────────────────────
  /**
   * A segmented option built on the shadcn RadioGroup: the real radio keeps
   * arrow-key navigation and screen-reader semantics, while the label carries
   * the look. The hand-rolled version had neither.
   */
  const RadioPill = ({ label, value, id }: { label: string; value: string; id: string }) => (
    <div className="relative">
      <RadioGroupItem id={id} value={value} className="peer sr-only" />
      <label
        htmlFor={id}
        className="flex min-h-[40px] cursor-pointer select-none items-center gap-2 rounded-[7px] border border-[#D5DAE8] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#4A5273] transition-all hover:border-[#C8CEE0] peer-data-[state=checked]:border-[#1E2FA8] peer-data-[state=checked]:bg-[#1E2FA8] peer-data-[state=checked]:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1E2FA8]/40">
        {label}
      </label>
    </div>
  );

  /** `heading` is dropped inside the sheet, which titles itself. */
  const FilterPanel = ({ namePrefix, heading = true }: { namePrefix: string; heading?: boolean }) => (
    <div className="space-y-5">
      {(heading || activeFilterCount > 0) && (
        <div className={`flex items-center ${heading ? "justify-between" : "justify-end"}`}>
          {heading && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">Filter Positions</p>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-bold text-[#1E2FA8] hover:text-[#16217A] transition-colors px-2 py-1 rounded-md hover:bg-[#E7EAFB]">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Employer — the board mixes HFSE International School and HAPI HAUS */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-2">
          <Building2 className="w-4 h-4" />
          Employer
        </label>
        <StyledSelect
          value={filters.employer || ALL_VALUE}
          onChange={(v) => handleFilterUpdate("employer", v === ALL_VALUE ? "" : v)}
          placeholder="All employers"
          options={[
            { value: ALL_VALUE, label: "All employers" },
            ...employers.map((name) => ({ value: name, label: name })),
          ]}
        />
      </div>

      {/* Employment Type */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-2">
          <Briefcase className="w-4 h-4" />
          Employment Type
        </label>
        <StyledSelect
          value={filters.employmentType || ALL_VALUE}
          onChange={(v) => handleFilterUpdate("employmentType", v === ALL_VALUE ? "" : v)}
          placeholder="All Types"
          options={[
            { value: ALL_VALUE, label: "All Types" },
            { value: "Full-Time", label: "Full-Time" },
            { value: "Part-Time", label: "Part-Time" },
            { value: "Freelance", label: "Freelance" },
            { value: "Internship", label: "Internship" },
          ]}
        />
      </div>

      {/* Salary basis — the tuition roles pay hourly, the rest monthly */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-2">
          <Clock className="w-4 h-4" />
          Pay Basis
        </label>
        <RadioGroup
          value={filters.frequency || "any"}
          onValueChange={(v) => handleFilterUpdate("frequency", v === "any" ? "" : v)}
          className="flex flex-wrap gap-3">
          <RadioPill id={`${namePrefix}-freq-any`} value="any" label="Any" />
          <RadioPill id={`${namePrefix}-freq-month`} value="month" label="Monthly" />
          <RadioPill id={`${namePrefix}-freq-hour`} value="hour" label="Hourly" />
        </RadioGroup>
      </div>

      {/* Urgently hiring */}
      <label
        htmlFor={`${namePrefix}-urgent`}
        className="flex cursor-pointer items-center gap-3 rounded-[7px] border border-[#D5DAE8] bg-white px-4 py-3 transition-colors hover:border-[#C8CEE0]">
        <Checkbox
          id={`${namePrefix}-urgent`}
          checked={filters.urgentOnly}
          onCheckedChange={(checked) => handleFilterUpdate("urgentOnly", checked === true)}
          className="size-[18px] rounded-[4px] border-[#B9C2D9] data-[state=checked]:border-[#1E2FA8] data-[state=checked]:bg-[#1E2FA8]"
        />
        <span className="text-[13px] font-medium text-[#10162B]">Urgently hiring only</span>
      </label>

      {/* Work Setting */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591] mb-3">Work Setting</p>
        <RadioGroup
          value={filters.isRemote === null ? "all" : filters.isRemote ? "remote" : "onsite"}
          onValueChange={(v) => handleFilterUpdate("isRemote", v === "all" ? null : v === "remote")}
          className="flex flex-wrap gap-3">
          <RadioPill id={`${namePrefix}-remote-all`} value="all" label="All" />
          <RadioPill id={`${namePrefix}-remote-yes`} value="remote" label="Remote" />
          <RadioPill id={`${namePrefix}-remote-no`} value="onsite" label="On-site" />
        </RadioGroup>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-[#1B2A8F] text-white sticky top-0 left-0 right-0 z-50">
        {/* ── Top info bar (Bigger text & Height) ────────────────────────── */}
        <div className="w-full">
          <div className="mx-auto flex w-full max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:gap-10 lg:px-10 h-[76px] sm:h-[104px]">
            <a href="/" className="flex-shrink-0 transition-transform hover:scale-[1.03] active:scale-95">
              <Image
                src="/assets/geg-logo-transparent.png"
                alt="HFSE International School"
                width={220}
                height={110}
                className="h-[40px] w-auto object-contain sm:h-[58px]"
                priority
              />
            </a>
            <div className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-[#C3C9DC]">
              <a
                href="mailto:teamwork@hfse.edu.sg"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#C3C9DC]" />
                <span className="hidden sm:inline">teamwork@hfse.edu.sg</span>
              </a>
              <a href="tel:+12345678900" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#C3C9DC]" />
                <span className="hidden sm:inline">+65 6451 0080</span>
              </a>
              <a
                href="https://hfse.edu.sg/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors border-l border-white/20 pl-6 ml-1">
                <Globe className="w-3.5 h-3.5 text-[#C3C9DC]" />
                <span className="hidden sm:inline">Visit Website</span>
              </a>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/hfseinternational" },
                { Icon: Instagram, href: "https://www.instagram.com/hfseinternational" },
                { Icon: Linkedin, href: "https://sg.linkedin.com/company/hfse-global-education-group" },
              ].map(({ Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/25 rounded-lg transition-all hover:-translate-y-0.5 active:scale-90"
                  aria-label={`Visit our ${Icon.name}`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main nav bar (Increased Height to h-24) ────────────────────── */}
        {showSearch && (
          <nav className="bg-[#EFF1F6]">
            <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
              {/* One row at every width: search takes the space, filter opens a
                  popover. The old burger pushed the page down to show them. */}
              <div className="flex h-[68px] w-full items-center justify-center gap-2 sm:h-[92px] sm:gap-4">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    aria-label="Back"
                    className="flex-shrink-0 rounded-lg p-2 text-[#4A5273] transition-colors hover:bg-white lg:hidden">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="flex w-full items-center gap-2 lg:w-auto lg:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[7px] border border-[#D5DAE8] bg-[#F5F6FA] px-3 shadow-[inset_0_1px_2px_rgba(16,22,43,0.05)] sm:px-4 lg:w-[520px] lg:flex-none">
                    <Search className="h-[18px] w-[18px] flex-shrink-0 text-[#6C7591]" />
                    <input
                      type="text"
                      placeholder="Search positions…"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="h-[42px] w-full border-0 bg-transparent text-[14px] text-[#10162B] placeholder-[#8A92AB] focus:outline-none sm:h-[46px] sm:text-[15px]"
                    />
                  </div>

                  {/* A popover anchored to this button has room at md and up.
                      Below that it lands two thirds of the way down a 390px
                      screen, clipped, scrolling inside itself -- so the phone
                      gets a sheet instead. Both stay mounted; only one is
                      reachable, which is what keeps their open states apart. */}
                  <div className="hidden lg:block">
                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                      <PopoverTrigger asChild>
                        <FilterTriggerButton count={activeFilterCount} />
                      </PopoverTrigger>

                      <PopoverContent
                        align="end"
                        sideOffset={12}
                        className="max-h-[min(70dvh,560px)] w-[min(384px,calc(100vw-2rem))] overflow-y-auto rounded-xl border-[#E1E5F0] bg-white p-5 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] sm:p-6">
                        <FilterPanel namePrefix="nav" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="lg:hidden">
                    <BottomSheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
                      <BottomSheetTrigger asChild>
                        <FilterTriggerButton count={activeFilterCount} />
                      </BottomSheetTrigger>

                      <BottomSheetContent
                        title="Filter Positions"
                        description="Narrow the roles by employer, employment type, pay basis and work setting."
                        footer={
                          <button
                            type="button"
                            onClick={() => setShowFilterSheet(false)}
                            className="flex min-h-[44px] w-full items-center justify-center rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-5 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
                            {resultCount === undefined
                              ? "Show results"
                              : `Show ${resultCount} ${resultCount === 1 ? "role" : "roles"}`}
                          </button>
                        }>
                        <FilterPanel namePrefix="sheet" heading={false} />
                      </BottomSheetContent>
                    </BottomSheet>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </>
  );
};

export default Navbar;
