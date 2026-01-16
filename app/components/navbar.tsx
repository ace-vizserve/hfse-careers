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
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface NavbarProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ showBackButton = false, onBack }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
              href="mailto:contact@example.com"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">contact@example.com</span>
            </a>

            <a
              href="tel:+1234567890"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
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

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="https://www.vizserve.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-cyan-400 text-white rounded-lg font-semibold hover:bg-cyan-500"
              >
                Company Website
              </a>

              <a
                href="https://vizserve.com/contact-vizserve/"
                className="px-4 py-2.5 bg-[#312B66] text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Contact Us
              </a>
            </div>

            {/* Mobile Menu Toggle (Lucide Icons) */}
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

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50 border-t">
              <a
                href="https://www.vizserve.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2.5 bg-cyan-400 text-white rounded-lg font-semibold hover:bg-cyan-500 shadow-sm"
              >
                Company Website
              </a>

              <a
                href="https://vizserve.com/contact-vizserve/"
                className="block w-full px-4 py-2.5 bg-[#312B66] text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
