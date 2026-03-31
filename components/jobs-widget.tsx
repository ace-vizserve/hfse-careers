"use client";

import { Briefcase, MapPin, Clock, ArrowUpRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface Job {
  id: number;
  title: string;
  position_name?: string;
  department?: string;
  location?: string;
  country?: string;
  city?: string;
  employment_type?: string;
  contract_details?: string;
  created_at: string;
  org_name?: string;
  org_logo?: string;
}

export default function JobsWidget() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        setJobs((data.results || []).slice(0, 8)); // Fetch more for carousel
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!containerRef.current || loading) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage({ type: "resize-iframe", height: entry.target.scrollHeight }, "*");
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [loading]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      return contractDetails.replace(/_/g, "-").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
    }
    return employmentType || "Full-Time";
  };

  if (loading) {
    return (
      <div className="flex gap-6 p-6 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="min-w-[320px] md:min-w-[400px] h-[450px] bg-slate-50 rounded-[2.5rem] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || jobs.length === 0) {
    return (
      <div className="p-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-blue-200" />
        </div>
        <h3 className="text-slate-900 font-black text-2xl tracking-tight">Begin Your HFSE Journey Soon</h3>
        <p className="text-slate-400 mt-3 max-w-sm mx-auto font-medium">We're tailoring new opportunities for you. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative py-10 px-4 group select-none">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header Section */}
      <div className="max-w-[1200px] mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg shadow-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            Grow With HFSE GEG
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
            Shape the future <br />
            <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">with our team.</span>
          </h2>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => scroll("left")}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all active:scale-90"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all active:scale-90"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        className="hide-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 md:px-12 pb-12"
      >
        {jobs.map((job) => (
          <div
            key={job.id}
            className="snap-center shrink-0 w-[85vw] sm:w-[45vw] lg:w-[calc(33.333%-1rem)] min-w-[300px] max-w-[450px]"
          >
            <div className="h-full flex flex-col bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 transition-all duration-700 hover:border-blue-400 hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.15)] group/card relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 -mr-16 -mt-16" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Entity Logo Section */}
                <div className="mb-8 flex items-start justify-between">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-center group-hover/card:scale-110 group-hover/card:border-blue-100 group-hover/card:bg-white transition-all duration-500 shadow-sm">
                    {job.org_logo ? (
                      <Image
                        src={job.org_logo}
                        alt={job.org_name || "Company Logo"}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    ) : (
                      <Briefcase className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-2">
                    {job.org_name || "HFSE"}
                  </span>
                </div>

                {/* Job Info */}
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-2xl md:text-3xl leading-tight mb-4 group-hover/card:text-blue-600 transition-colors duration-500 line-clamp-2">
                    {job.position_name || job.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 group-hover/card:bg-blue-50 group-hover/card:border-blue-100 transition-colors">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {job.location || job.country || "Singapore"}
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 group-hover/card:bg-blue-50 group-hover/card:border-blue-100 transition-colors">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {formatEmploymentType(job.contract_details, job.employment_type)}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-12">
                  <Link
                    href={`/jobs/${job.id}`}
                    target="_top"
                    className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 transform active:scale-[0.98]"
                  >
                    Take This Step
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Bottom CTA */}
      <div className="mt-8 text-center px-4">
        <Link
          href="/"
          target="_top"
          className="inline-flex items-center gap-4 text-slate-400 hover:text-blue-600 font-bold text-sm transition-all group/all"
        >
          Can't find what you're looking for? <span className="text-slate-900 group-hover/all:text-blue-600 underline underline-offset-4 decoration-slate-200 group-hover/all:decoration-blue-200">View All 50+ Roles</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
