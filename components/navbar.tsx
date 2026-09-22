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
  Menu,
  Phone,
  Search,
  Building2,
  Clock,
  X,
} from "lucide-react";
import Image from "next/image";

import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StyledSelect } from "@/components/ui/styled-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React, { useState } from "react";

interface NavbarProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterOptions) => void;
  employers?: string[];
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

const Navbar: React.FC<NavbarProps> = ({ showBackButton = false, onBack, onSearch, onFilterChange, employers = [] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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

  const FilterPanel = ({ namePrefix }: { namePrefix: string }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">Filter Positions</p>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm font-bold text-[#1E2FA8] hover:text-[#16217A] transition-colors px-2 py-1 rounded-md hover:bg-[#E7EAFB]">
            Clear all
          </button>
        )}
      </div>

      {/* Employer — the board mixes HFSE International School and HAPI HAUS */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-3">
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
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-3">
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
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-3">
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
          <div className="mx-auto w-full max-w-[1680px] px-10 flex items-center h-[104px] gap-10">
            <a href="/" className="flex-shrink-0 transition-transform hover:scale-[1.03] active:scale-95">
              <Image
                src="/assets/geg-logo-transparent.png"
                alt="HFSE International School"
                width={220}
                height={110}
                className="h-[58px] w-auto object-contain"
                priority
              />
            </a>
            <div className="hidden md:flex items-center gap-5 text-[13px] font-medium text-[#C3C9DC]">
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
        <nav className="bg-[#EFF1F6]">
          <div className="mx-auto w-full max-w-[1680px] px-10">
            <div className="relative flex items-center justify-center h-[92px] w-full gap-4">
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden absolute left-4 p-2 rounded-lg hover:bg-white transition-colors text-[#4A5273]">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Desktop: search + filter ─────────────────────────────── */}
              <div className="hidden md:flex items-center gap-4">
                {/* Search input (Bigger Text & Width) */}
                <div className="flex items-center gap-2.5 w-[520px] rounded-[7px] border border-[#D5DAE8] bg-[#F5F6FA] px-4 shadow-[inset_0_1px_2px_rgba(16,22,43,0.05)]">
                  <Search className="w-[18px] h-[18px] flex-shrink-0 text-[#6C7591]" />
                  <input
                    type="text"
                    placeholder="Search positions…"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-[46px] w-full bg-transparent border-0 text-[15px] text-[#10162B] placeholder-[#8A92AB] focus:outline-none"
                  />
                </div>

                {/* Filter button */}
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <button className="relative flex items-center gap-2 min-h-[46px] px-7 py-3 rounded-[7px] text-[15px] font-semibold text-white bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all duration-200 hover:brightness-110">
                      <Filter className="w-[18px] h-[18px]" />
                      Filter Positions
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#1E2FA8] text-white text-[11px] rounded-md flex items-center justify-center font-semibold shadow-[0_1px_3px_rgba(30,47,168,0.3)] border border-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="end"
                    sideOffset={12}
                    className="w-96 rounded-xl border-[#E1E5F0] bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
                    <FilterPanel namePrefix="desktop" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mobile menu toggle */}
              <div className="md:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileOpen(!mobileOpen);
                  }}
                  className="p-3 rounded-2xl bg-[#F2F4FA] text-[#414A66] border border-[#E3E6F0]"
                  aria-label="Toggle menu">
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile expanded panel */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
            }`}>
            <div className="px-5 pb-8 pt-4 bg-[#EFF1F6] border-t border-[#E1E5F0] space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C7591] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search positions…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-[#D5DAE8] rounded-[7px] text-[13px] text-[#10162B] shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] focus:outline-none focus:ring-2 focus:ring-[#1E2FA8]/40 focus:border-[#1E2FA8] transition-all duration-200"
                />
              </div>

              <div className="border-t border-[#D5DAE8]" />
              <FilterPanel namePrefix="mobile" />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
