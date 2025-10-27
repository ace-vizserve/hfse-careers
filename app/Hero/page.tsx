import React from 'react';
import { Feather, Search } from 'lucide-react';
import Navbar from '../components/navbar';
import Featured from '../Featured/page';
import Footer from '../components/footer';

// Main Page Component
const Page = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar with margin bottom */}
           <div className="mb-28 sm:mb-24">
  <Navbar />
</div>
      
       {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              The <span className="text-blue-600">Easiest Way</span><br />
              to Get Your New Job
            </h1>
            
            <p className="text-gray-700 text-base leading-relaxed max-w-lg">
              Discover great careers with incredible perks, where growth meets opportunity. Your dream job starts here, and we're ready to guide you every step of the way.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search for roles,locations, or catergories"
                  className="w-full px-5 py-4 border-2 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button className="bg-cyan-400 text-white px-10 py-4 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap">
                Search
              </button>
            </div>
            
            {/* Popular Search Links */}
            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-900 mb-3">Popular Search</p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="text-blue-600 hover:underline text-sm">Accountant</a>
                <a href="#" className="text-blue-600 hover:underline text-sm">Web Developer</a>
                <a href="#" className="text-blue-600 hover:underline text-sm">Virtual Assistant</a>
                <a href="#" className="text-blue-600 hover:underline text-sm">Graphics Designer</a>
              </div>
            </div>
          </div>
          
          {/* Right Images */}
<div className="relative hidden md:block">
  {/* Top Image - Smaller */}
  <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl border-4 border-blue-600 mb-6 ml-auto w-4/5">
    <img
      src="/assets/Image2.png"
      alt="Business professionals discussing"
      className="w-full h-48 object-cover"
    />
  </div>
  
  {/* Bottom Image - Larger, positioned to overlap */}
  <div className="relative z-20 rounded-3xl overflow-hidden shadow-2xl border-4 border-cyan-400 w-11/12">
    <img
      src="/assets/Image1.png"
      alt="Team meeting"
      className="w-full h-64 object-cover"
    />
  </div>
  
  {/* Decorative Dots - Top Right */}
  <div className="absolute top-0 right-0 w-16 h-16 grid grid-cols-3 gap-2 opacity-40 z-0">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="w-2 h-2 bg-blue-400 rounded-full"></div>
    ))}
  </div>
  
  {/* Decorative Dots - Middle */}
  <div className="absolute top-1/3 left-0 w-12 h-12 grid grid-cols-3 gap-1.5 opacity-30 z-0">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full"></div>
    ))}
  </div>
  
  {/* Decorative Dots - Bottom */}
  <div className="absolute bottom-0 right-1/4 w-12 h-12 grid grid-cols-3 gap-1.5 opacity-30 z-0">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full"></div>
    ))}
  </div>
</div>

        </div>
      </div>

      <Featured/>
      <Footer/>
    </div>
  );
};

export default Page;
