"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Mail, Phone, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

interface NavbarProps {}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && target && !target.closest('nav')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top Contact Bar */}
      <div className={`w-full bg-[#312B66] text-white py-2.5 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Contact Info */}
          <div className="flex items-center space-x-4 lg:space-x-6 text-xs sm:text-sm">
            <a
              href="mailto:contact@example.com"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition-colors duration-300 group"
              aria-label="Email us"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">contact@example.com</span>
            </a>

            <a
              href="tel:+1234567890"
              className="flex items-center space-x-1.5 hover:text-cyan-200 transition-colors duration-300 group"
              aria-label="Call us"
            >
              <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
            </a>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center space-x-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav 
        className={`bg-white transition-all duration-300 ${
          scrolled ? 'shadow-lg' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <a href="/" className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
                <Image
                  src="/assets/logo.png"
                  alt="Logo"
                  width={160}
                  height={80}
                  className="h-18 w-auto object-contain hover:opacity-90 transition-opacity"
                  priority
                />
              </a>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              

              <button className="px-6 py-2.5 bg-cyan-400 text-white rounded-lg font-semibold hover:bg-cyan-500 active:bg-cyan-600 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2">
                Sign Up
              </button>

              <button className="px-6 py-2.5 bg-[#4A5BA8] text-white rounded-lg font-semibold hover:bg-indigo-800 active:bg-indigo-900 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2">
                Sign In
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu with Animation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50 border-t">
            <button 
              className="flex items-center w-full text-gray-700 hover:text-blue-600 hover:bg-white transition-all px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsOpen(false)}
            >
              <Search className="w-5 h-5 mr-2" />
              <span className="font-medium">Find Job</span>
            </button>

            <button 
              className="w-full px-6 py-2.5 bg-cyan-400 text-white rounded-lg font-semibold hover:bg-cyan-500 active:bg-cyan-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </button>

            <button 
              className="w-full px-6 py-2.5 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 active:bg-indigo-900 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;