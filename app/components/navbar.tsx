"use client";

import {
  ChevronLeft,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Twitter,
  Menu,
  X,
  Globe,
  Search,
  MapPin,
  Briefcase,
  Filter,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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

const Navbar: React.FC<NavbarProps> = ({ 
  showBackButton = false, 
  onBack,
  onSearch,
  onFilterChange 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    employmentType: "",
    isRemote: null,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (mobileOpen && !target.closest("nav")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileOpen]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterUpdate = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      location: "",
      employmentType: "",
      isRemote: null,
    };
    setFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  const activeFilterCount = [
    filters.location,
    filters.employmentType,
    filters.isRemote !== null,
  ].filter(Boolean).length;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* ================= TOP HEADER ================= */}
      <div
        className={`w-full bg-[#312B66] text-white py-2.5 transition-all duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center">
          {/* Left: Contact Info */}
          <div className="flex items-center space-x-4 text-xs sm:text-sm">
            <a
              href="mailto:info@vizserve.com"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">info@vizserve.com</span>
            </a>

            <a
              href="tel:+12345678900"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
            </a>

            <a
              href="https://www.vizserve.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-cyan-200 transition font-medium"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Visit our Website</span>
            </a>
          </div>

          <div className="flex-grow mx-8" />

          {/* Right: Social Icons */}
          <div className="flex items-center space-x-2">
            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ================= MAIN NAVBAR ================= */}
      <nav
        className={`bg-white transition-all duration-300 ${
          scrolled ? "shadow-lg" : "shadow-sm"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-24 w-full">
            {/* Left: Back Button + Logo */}
            <div className="flex items-center gap-3">
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <a href="/">
                <Image
                  src="/assets/logo.png"
                  alt="Logo"
                  width={200}
                  height={100}
                  className="h-20 w-auto object-contain"
                  priority
                />
              </a>
            </div>

            <div className="flex-grow mx-8" />

            {/* Desktop Search & Filters */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileOpen(!mobileOpen);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Filter Dropdown */}
          {showFilters && (
            <div className="hidden md:block absolute right-4 lg:right-8 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filter Jobs</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Manila, Remote"
                    value={filters.location}
                    onChange={(e) => handleFilterUpdate("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employment Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Employment Type
                  </label>
                  <select
                    value={filters.employmentType}
                    onChange={(e) => handleFilterUpdate("employmentType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="Full-Time">Full-Time</option>
                     <option value="Part-Time">Part-Time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Remote Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Setting
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote"
                        checked={filters.isRemote === null}
                        onChange={() => handleFilterUpdate("isRemote", null)}
                        className="mr-2"
                      />
                      <span className="text-sm">All</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote"
                        checked={filters.isRemote === true}
                        onChange={() => handleFilterUpdate("isRemote", true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Remote only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote"
                        checked={filters.isRemote === false}
                        onChange={() => handleFilterUpdate("isRemote", false)}
                        className="mr-2"
                      />
                      <span className="text-sm">On-site only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50 border-t">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Mobile Filters */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Manila, Remote"
                    value={filters.location}
                    onChange={(e) => handleFilterUpdate("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Employment Type
                  </label>
                  <select
                    value={filters.employmentType}
                    onChange={(e) => handleFilterUpdate("employmentType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Remote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Setting
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote-mobile"
                        checked={filters.isRemote === null}
                        onChange={() => handleFilterUpdate("isRemote", null)}
                        className="mr-2"
                      />
                      <span className="text-sm">All</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote-mobile"
                        checked={filters.isRemote === true}
                        onChange={() => handleFilterUpdate("isRemote", true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Remote only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="remote-mobile"
                        checked={filters.isRemote === false}
                        onChange={() => handleFilterUpdate("isRemote", false)}
                        className="mr-2"
                      />
                      <span className="text-sm">On-site only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;