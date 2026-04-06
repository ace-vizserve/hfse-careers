import JobsWidget from "@/components/jobs-widget";

export const metadata = {
  title: "Latest Job Openings | VizServe",
  description: "Recent career opportunities at HFSE and associated entities.",
};

export default function EmbedJobsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBF8F4]">
      {/* Warm gradient orbs */}
      <div className="pointer-events-none absolute -top-48 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#2638B6]/[0.04] to-amber-100/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-orange-100/25 to-[#2638B6]/[0.02] blur-[100px]" />

      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #8c8780 0.6px, transparent 0.6px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Decorative top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#2638B6]/30 to-transparent" />

      <div className="relative">
        <JobsWidget />
      </div>
    </main>
  );
}
