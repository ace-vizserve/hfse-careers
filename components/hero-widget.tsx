"use client";

import { ArrowUpRight, Award, BadgeCheck, GraduationCap, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const YOUTUBE_VIDEO_ID = "ftl-1Y4Ors8";
const YOUTUBE_START = 11;
const YOUTUBE_END = 52;
const YOUTUBE_SRC = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&start=${YOUTUBE_START}&end=${YOUTUBE_END}`;

export default function HeroWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage({ type: "resize-iframe", height: entry.target.scrollHeight }, "*");
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const features: { Icon: typeof GraduationCap; text: string }[] = [
    { Icon: GraduationCap, text: "1:1 mentorship with senior educators" },
    { Icon: Target, text: "Clear promotion milestones each semester" },
    { Icon: Award, text: "Dedicated R&D time for curriculum work" },
  ];

  const avatarGradients: [string, string][] = [
    ["#2638B6", "#003f87"],
    ["#ED7622", "#c45515"],
    ["#0056b3", "#2638B6"],
    ["#ffb77d", "#ED7622"],
  ];

  return (
    <div ref={containerRef} style={{ fontFamily: "Poppins" }} className="bg-white">
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
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .hero-fade-in-up {
          animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <section
        className="relative min-h-[100dvh] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2a254a 0%, #4C447A 55%, #6558a0 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ containerType: "size" }}>
          <iframe
            src={YOUTUBE_SRC}
            title="Background video"
            allow="autoplay; encrypted-media"
            className="absolute top-1/2 left-1/2"
            style={{
              border: 0,
              width: "max(100cqw, calc(100cqh * 16 / 9))",
              height: "max(100cqh, calc(100cqw * 9 / 16))",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(42,37,74,0.85) 0%, rgba(76,68,122,0.65) 50%, rgba(76,68,122,0.45) 100%)",
          }}
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-7 hero-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/25 mb-8">
              <BadgeCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">
                Trusted since 1999 · 200+ educators
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tighter mb-6">
              A career that
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(transparent 62%, rgba(237,118,34,0.45) 62%)",
                }}>
                grows
              </span>{" "}
              with you.
            </h1>

            <p className="text-white/80 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
              Where intellectual rigor meets real progression. Join HFSE — an atelier of educators shaping
              tomorrow&apos;s classrooms with mentorship, purpose, and a clear ladder forward.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Link
                href="/"
                target="_top"
                className="relative overflow-hidden flex items-center gap-3 bg-[#ED7622] text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#ED7622]/40 transition-all duration-300 active:scale-[0.98] hover:brightness-110 hover:shadow-[0_24px_48px_-12px_rgba(237,118,34,0.55)] hover:-translate-y-0.5 group/btn">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10">Browse Open Roles</span>
                <ArrowUpRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </Link>
              <Link
                href="/"
                target="_top"
                className="flex items-center gap-2 bg-[#2638B6] text-white border-2 border-[#2638B6] px-8 py-4 rounded-2xl font-black text-sm tracking-wide hover:brightness-110 hover:-translate-y-0.5 transition-all active:scale-[0.98] shadow-lg shadow-[#2638B6]/40">
                See Career Pathways
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 hero-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative">
              <div className="absolute -top-3 -right-3 w-full h-full bg-gradient-to-br from-[#2638B6]/15 to-[#ED7622]/10 rounded-[2rem] -rotate-1 pointer-events-none" />

              <div className="relative bg-white border border-stone-200/80 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,26,64,0.12)] overflow-hidden">
                <div className="relative h-36 bg-gradient-to-br from-[#2638B6] to-[#003f87] overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#ED7622]/30 rounded-full blur-3xl" />

                  <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                      Featured Program
                    </span>
                  </div>

                  <div className="absolute bottom-14 right-7 translate-y-1/2">
                    <div className="w-20 h-20 rounded-3xl bg-white border border-stone-200 shadow-xl flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-[#2638B6]" strokeWidth={2.25} />
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-14">
                  <span className="text-[10px] font-black text-[#2638B6] uppercase tracking-[0.2em]">
                    The Atelier Fellowship
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-[1.1] mt-1 mb-3">
                    Your fast-track to classroom leadership.
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed mb-6">
                    A structured growth program pairing every educator with senior mentors, dedicated R&amp;D time, and
                    clear promotion milestones.
                  </p>

                  <div className="space-y-3 mb-6">
                    {features.map(({ Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2638B6]/10 border border-[#2638B6]/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[#2638B6]" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-semibold text-stone-700">{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-5 border-t border-stone-200/80">
                    <div>
                      <div className="text-3xl font-black text-stone-900 tracking-tighter leading-none">94%</div>
                      <div className="text-[10px] font-black text-stone-500 uppercase tracking-[0.15em] mt-1.5">
                        Promotion Rate
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-stone-900 tracking-tighter leading-none">18mo</div>
                      <div className="text-[10px] font-black text-stone-500 uppercase tracking-[0.15em] mt-1.5">
                        Avg. to Leadership
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
