"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ArrowUpRight, Briefcase, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const elements = document.querySelectorAll(".job-card");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-idx"));
          if (entry.isIntersecting) {
            setVisibleIndexes((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [jobs]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        setJobs((data.results || []).slice(0, 5));
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

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      return contractDetails
        .replace(/_/g, "-")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("-");
    }
    return employmentType || "Full-Time";
  };

  if (loading) {
    return (
      <div className="flex gap-6 p-6 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="min-w-[320px] md:min-w-[400px] h-[450px] bg-white/60 backdrop-blur-sm border border-stone-200/40 rounded-[2.5rem] animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
          <Briefcase className="w-10 h-10 text-red-400" />
        </div>

        <h3 className="text-2xl font-black text-stone-900 mb-2">Something went wrong</h3>

        <p className="text-stone-500 max-w-md mb-6">
          We couldn’t load the job listings right now. Please try again later.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-2xl bg-[#2638B6] text-white font-bold hover:opacity-90 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full py-10 px-4 group select-none overflow-hidden" style={{ fontFamily: "inherit" }}>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes iconWiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(10deg);
          }
          75% {
            transform: rotate(-10deg);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <div className="w-full mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-12 animate-fade-in-up">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2638B6]/10 text-[#2638B6] text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-[#2638B6]/15">
            <Sparkles className="w-3.5 h-3.5" />
            Grow With HFSE GEG
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tighter leading-[1.1]">
            Shape the future <br />
            <span className="text-[#2638B6]">with our team</span>
          </h2>
          <p className="mt-4 text-stone-500 text-base leading-relaxed max-w-md">
            Discover roles where your passion meets purpose. Join a team dedicated to shaping the next generation.
          </p>
        </div>

        <div className="hidden md:flex gap-3">
          <button
            onClick={() => api?.scrollPrev()}
            className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200/50 shadow-lg shadow-stone-200/20 flex items-center justify-center text-stone-400 hover:text-[#2638B6] hover:border-[#2638B6]/20 hover:bg-white transition-all active:scale-90"
            aria-label="Previous">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200/50 shadow-lg shadow-stone-200/20 flex items-center justify-center text-stone-400 hover:text-[#2638B6] hover:border-[#2638B6]/20 hover:bg-white transition-all active:scale-90"
            aria-label="Next">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        className="w-full">
        <CarouselContent className="-ml-4 px-4 md:px-12 pb-12">
          {jobs.map((job, idx) => (
            <CarouselItem
              key={job.id}
              data-idx={idx}
              className="job-card pl-6 basis-[85vw] sm:basis-[45vw] lg:basis-1/3 min-w-[300px] max-w-[450px]">
              <div
                className={`h-full flex flex-col bg-white/80 backdrop-blur-sm border border-stone-200/50 rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-all duration-700 hover:bg-[#FBF8F4] hover:border-[#2638B6]/20 hover:shadow-[0_24px_48px_-12px_rgba(38,56,182,0.12)] group/card relative overflow-hidden ${
                  visibleIndexes.includes(idx) ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${idx * 0.12}s` }}
                onPointerDown={() => {
                  isDragging.current = false;
                }}
                onPointerMove={() => {
                  isDragging.current = true;
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2638B6]/5 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 -mr-16 -mt-16" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="w-20 h-20 rounded-3xl bg-white border border-stone-200/50 p-3 flex items-center justify-center group-hover/card:scale-110 group-hover/card:rotate-3 group-hover/card:border-[#2638B6]/20 group-hover/card:bg-white transition-all duration-500 shadow-sm">
                      {job.org_logo ? (
                        <Image
                          src={job.org_logo}
                          alt={job.org_name || "Company Logo"}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <Briefcase className="w-8 h-8 text-stone-300" />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-[#2638B6] uppercase tracking-widest pt-2">
                      {job.org_name || "HFSE"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-black text-stone-900 text-xl md:text-2xl leading-tight mb-4 group-hover/card:text-[#2638B6] transition-colors duration-500 line-clamp-2">
                      {job.position_name || job.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-100/50 border border-stone-200/50 text-xs font-bold text-stone-600 group-hover/card:bg-[#2638B6]/5 group-hover/card:border-[#2638B6]/15 transition-all duration-300">
                        <MapPin className="w-4 h-4 text-[#2638B6]/70 group-hover/card:animate-[iconWiggle_1s_ease-in-out_infinite]" />
                        {job.location || job.country || "Singapore"}
                      </div>

                      <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-100/50 border border-stone-200/50 text-xs font-bold text-stone-600 group-hover/card:bg-[#2638B6]/5 group-hover/card:border-[#2638B6]/15 transition-all duration-300">
                        <Clock className="w-4 h-4 text-[#2638B6]/70 group-hover/card:scale-110 transition-transform" />
                        {formatEmploymentType(job.contract_details, job.employment_type)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 overflow-hidden rounded-2xl">
                    <Link
                      href={`/jobs/${job.id}`}
                      target="_top"
                      onClick={(e) => {
                        if (isDragging.current) e.preventDefault();
                      }}
                      className="relative flex items-center justify-center gap-3 w-full py-5 bg-[#2638B6] text-white font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-[0.98] group/btn hover:bg-[#1e2e9a]">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                      <span className="relative z-10">Learn More</span>
                      <ArrowUpRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hidden" />
        <CarouselNext className="hidden" />
      </Carousel>

      <div className="mt-8 text-center px-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
        <Link
          href="/"
          target="_top"
          className="inline-flex items-center gap-4 text-stone-400 hover:text-[#2638B6] font-bold text-sm transition-all group/all">
          Can&apos;t find what you&apos;re looking for?{" "}
          <span className="text-stone-800 group-hover/all:text-[#2638B6] underline underline-offset-4 decoration-stone-300 group-hover/all:decoration-[#2638B6]/30">
            View All Roles
          </span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
