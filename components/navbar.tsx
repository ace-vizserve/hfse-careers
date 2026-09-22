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
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface NavbarProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterOptions) => void;
}

interface FilterOptions {
  location: string;
  employmentType: string;
  isRemote: boolean | null;
}

const Navbar: React.FC<NavbarProps> = ({ showBackButton = false, onBack, onSearch, onFilterChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    employmentType: "",
    isRemote: null,
  });

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const cleared: FilterOptions = { location: "", employmentType: "", isRemote: null };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  const activeFilterCount = [filters.location, filters.employmentType, filters.isRemote !== null].filter(
    Boolean,
  ).length;

  // ── Shared input class (Bigger text & padding) ──────────────────────────
  const inputCls =
    "w-full min-h-[40px] px-3 py-2.5 bg-white border border-[#D5DAE8] rounded-[7px] text-[#10162B] text-[13px] placeholder-[#8A92AB] " +
    "shadow-[inset_0_1px_2px_rgba(16,22,43,0.04)] focus:outline-none focus:ring-2 focus:ring-[#1E2FA8]/40 focus:border-[#1E2FA8] transition-all duration-200";

  // ── Radio pill (Bigger text & padding) ──────────────────────────────────
  const RadioPill = ({
    label,
    checked,
    onChange,
    name,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
    name: string;
  }) => (
    <label
      className={`flex items-center gap-2 min-h-[40px] px-4 py-2.5 rounded-[7px] border cursor-pointer text-[12px] font-semibold transition-all select-none
        ${
          checked
            ? "border-[#1E2FA8] bg-[#1E2FA8] text-white"
            : "border-[#D5DAE8] bg-white text-[#4A5273] hover:border-[#C8CEE0]"
        }`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {checked && (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {label}
    </label>
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

      {/* Location */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-3">
          <MapPin className="w-4 h-4" />
          Location
        </label>
        <input
          type="text"
          placeholder="e.g. Manila, Singapore…"
          value={filters.location}
          onChange={(e) => handleFilterUpdate("location", e.target.value)}
          className={inputCls + "text-sm"}
        />
      </div>

      {/* Employment Type */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6C7591] uppercase tracking-[0.14em] mb-3">
          <Briefcase className="w-4 h-4" />
          Employment Type
        </label>
        <select
          value={filters.employmentType}
          onChange={(e) => handleFilterUpdate("employmentType", e.target.value)}
          className={
            inputCls +
            " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_18px_center] text-sm"
          }>
          <option value="">All Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Freelance">Freelance</option>
          <option value="Internship">Internship</option>
        </select>
      </div>

      {/* Work Setting */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591] mb-3">Work Setting</p>
        <div className="flex flex-wrap gap-3">
          <RadioPill
            name={`${namePrefix}-remote`}
            label="All"
            checked={filters.isRemote === null}
            onChange={() => handleFilterUpdate("isRemote", null)}
          />
          <RadioPill
            name={`${namePrefix}-remote`}
            label="Remote"
            checked={filters.isRemote === true}
            onChange={() => handleFilterUpdate("isRemote", true)}
          />
          <RadioPill
            name={`${namePrefix}-remote`}
            label="On-site"
            checked={filters.isRemote === false}
            onChange={() => handleFilterUpdate("isRemote", false)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-[#1B2A8F] text-white sticky top-0 left-0 right-0 z-50">
        {/* ── Top info bar (Bigger text & Height) ────────────────────────── */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-[1440px] px-[30px] flex items-center h-[89px] gap-8">
            <a href="/" className="flex-shrink-0 transition-transform hover:scale-[1.03] active:scale-95">
              <Image
                src="/assets/geg-logo-transparent.png"
                alt="HFSE International School"
                width={220}
                height={110}
                className="h-[50px] w-auto object-contain"
                priority
              />
            </a>
            <div className="hidden md:flex items-center gap-5 text-xs font-medium text-[#C3C9DC]">
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
          <div className="mx-auto w-full max-w-[1440px] px-[30px]">
            <div className="relative flex items-center justify-center h-[77px] w-full gap-3">
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
                <div className="flex items-center gap-2 w-[420px] rounded-[7px] border border-[#D5DAE8] bg-[#F5F6FA] px-[11px] shadow-[inset_0_1px_2px_rgba(16,22,43,0.05)]">
                  <Search className="w-3.5 h-3.5 flex-shrink-0 text-[#6C7591]" />
                  <input
                    type="text"
                    placeholder="Search positions…"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-[34px] w-full bg-transparent border-0 text-[13px] text-[#10162B] placeholder-[#8A92AB] focus:outline-none"
                  />
                </div>

                {/* Filter button (Bigger Text & Padding) */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative flex items-center gap-2 min-h-[36px] px-6 py-[9px] rounded-[7px] text-[13px] font-semibold text-white bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all duration-200 hover:brightness-110">
                    <Filter className="w-4 h-4" />
                    Filter Positions
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#1E2FA8] text-white text-[11px] rounded-md flex items-center justify-center font-semibold shadow-[0_1px_3px_rgba(30,47,168,0.3)] border border-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop filter dropdown */}
                  {showFilters && (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-96 bg-white border border-[#E1E5F0] rounded-xl shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-6 z-50">
                      <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-l border-t border-[#E1E5F0] rotate-45" />
                      <FilterPanel namePrefix="desktop" />
                    </div>
                  )}
                </div>
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
