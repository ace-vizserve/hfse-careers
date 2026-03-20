"use client";
import { ArrowUpRight, BookOpen, Briefcase, CheckCircle, Mail, MapPin, Share2, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/navbar";
import PopupModal from "./components/ui/PopupModal";

interface Job {
  id?: number;
  position_name?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_type?: string;
  contract_details?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  frequency?: string;
  is_remote?: boolean | null;
  company?: { name: string };
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
  org_logo: string;
  org_name: string;
  org_website: string;
}

interface FilterOptions {
  location: string;
  employmentType: string;
  isRemote: boolean | null;
}

const NAVBAR_HEIGHT = 136;

const Page = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({ location: "", employmentType: "", isRemote: null });

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, "-");
      return formatted
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    }
    return employmentType || "Full-Time";
  };

  const formatLocation = (job: Job) => (job.is_remote ? "Remote" : job.country || "On-site");

  const formatSalary = (min?: number, max?: number, currency?: string, frequency?: string) => {
    if (!min && !max) return null;
    const currencyCode = currency || "PHP";
    const formatter = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const freqText = frequency === "hour" ? " / hour" : " / month";
    if (min && max) return `${formatter.format(min)} – ${formatter.format(max)}${freqText}`;
    return `${formatter.format(min || max!)}${freqText}`;
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/jobs", { method: "GET", headers: { "Content-Type": "application/json" } });
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        let jobsList: Job[] = [];
        if (Array.isArray(data)) jobsList = data;
        else if (data.results && Array.isArray(data.results)) jobsList = data.results;
        else if (data.data && Array.isArray(data.data)) jobsList = data.data;
        else if (data.jobs && Array.isArray(data.jobs)) jobsList = data.jobs;
        setJobs(jobsList);
        if (jobsList.length > 0) setSelectedJob(jobsList[0]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        const title = (job.position_name || job.title || "").toLowerCase();
        const company = (job.company?.name || "").toLowerCase();
        const location = (job.country || job.city || "").toLowerCase();
        const description = (job.description || "").toLowerCase();
        return (
          title.includes(query) || company.includes(query) || location.includes(query) || description.includes(query)
        );
      });
    }
    if (filters.location.trim()) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter((job) => {
        const country = (job.country || "").toLowerCase();
        const city = (job.city || "").toLowerCase();
        const state = (job.state || "").toLowerCase();
        return (
          country.includes(locationQuery) ||
          city.includes(locationQuery) ||
          state.includes(locationQuery) ||
          (job.is_remote === true && locationQuery.includes("remote"))
        );
      });
    }
    if (filters.employmentType) {
      filtered = filtered.filter(
        (job) => formatEmploymentType(job.contract_details, job.employment_type) === filters.employmentType,
      );
    }
    if (filters.isRemote !== null) {
      filtered = filtered.filter((job) => {
        if (filters.isRemote === true) return job.is_remote === true;
        if (filters.isRemote === false) return job.is_remote === false || job.is_remote === null;
        return true;
      });
    }
    return filtered;
  }, [jobs, searchQuery, filters]);

  useEffect(() => {
    if (filteredJobs.length > 0 && !filteredJobs.find((j) => j.id === selectedJob?.id)) {
      setSelectedJob(filteredJobs[0]);
    } else if (filteredJobs.length === 0) {
      setSelectedJob(null);
    }
  }, [filteredJobs]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };
  const handleBack = () => setShowDetails(false);
  const handleShare = async () => {
    if (!selectedJob?.id) return;
    const jobUrl = `${window.location.origin}/jobs/${selectedJob.id}`;
    try {
      await navigator.clipboard.writeText(jobUrl);
      setShareModalOpen(true);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilterChange = (newFilters: FilterOptions) => setFilters(newFilters);

  // ── Shared badge components ───────────────────────────────────────────────

  const TypeBadge = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
      <CheckCircle className="w-3 h-3" />
      {label}
    </span>
  );

  const RemoteBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
      Remote
    </span>
  );

  const LocationBadge = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
      <MapPin className="w-3 h-3" />
      {label}
    </span>
  );

  const UrgentBadge = () => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
      <Zap className="w-3 h-3" />
      Urgently Hiring
    </span>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
       html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .job-card-active { box-shadow: 0 0 0 2px #7c3aed; }
      `}</style>

      <div className="bg-slate-50 min-h-screen">
        {/* Top accent bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500" />

        <Navbar onSearch={handleSearch} onFilterChange={handleFilterChange} />

        {/* Main layout */}
        <div className="max-w-[1800px] mx-auto md:flex  p-5 sm:p-7 space-y-5 space-x-5">
          {/* ── Job List Panel ─────────────────────────────────────────────── */}
          <div
            className={`${showDetails ? "hidden md:flex" : "flex"} flex-col w-full md:w-[42%] bg-white border-r border-slate-100 md:overflow-y-auto scrollbar-hide rounded-2xl`}>
            {/* Panel header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              {!loading && !error && (
                <div className="flex items-center justify-between">
                  {/* Results Count */}
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-base font-bold text-slate-900">
                      {filteredJobs.length}
                      <span className="ml-1 font-medium text-slate-500">
                        {filteredJobs.length === 1 ? "position" : "openings"} found
                      </span>
                    </p>
                  </div>

                  {/* Filter Status & Actions */}
                  {(searchQuery || filters.location || filters.employmentType || filters.isRemote !== null) && (
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                          />
                        </svg>
                        Filtered View
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm text-slate-400 tracking-wide">Loading positions…</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                  <p className="text-rose-700 font-semibold text-sm mb-1">Failed to load jobs</p>
                  <p className="text-rose-500 text-xs">{error}</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && filteredJobs.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-semibold mb-1">No positions found</p>
                  <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Job cards */}
              {filteredJobs.map((job) => {
                const isActive = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? "bg-white border-blue-300 shadow-md shadow-blue-100/60 job-card-active"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                    }`}>
                    {/* Active left accent */}

                    <div className="flex items-start gap-4 mb-3.5">
                      {/* Logo */}
                      {job.org_logo ? (
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-slate-100 bg-white p-1.5 flex items-center justify-center shadow-sm">
                          <Image
                            src={job.org_logo}
                            alt={job.org_name}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-slate-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {job.urgently_hiring && (
                          <div className="mb-1.5">
                            <UrgentBadge />
                          </div>
                        )}
                        <h3 className="font-semibold text-slate-900 text-base leading-snug truncate">
                          {job.position_name || job.title || "Position Title"}
                        </h3>
                        {job.org_name && (
                          <a
                            target="_blank"
                            href={job.org_website}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mt-0.5 inline-block truncate max-w-full">
                            {job.org_name}
                          </a>
                        )}
                      </div>

                      <LocationBadge label={formatLocation(job)} />
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge label={formatEmploymentType(job.contract_details, job.employment_type)} />
                      {job.is_remote && <RemoteBadge />}
                      {job.easily_apply && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                          <Mail className="w-3 h-3" />
                          Easy Apply
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Job Detail Panel ────────────────────────────────────────────── */}
          <div
            className={`${showDetails ? "flex" : "hidden md:flex"} flex-col flex-1 bg-slate-50 md:overflow-y-auto scrollbar-hide`}>
            {selectedJob ? (
              <div className="space-y-6">
                {/* Mobile back button */}
                <button
                  onClick={handleBack}
                  className="flex md:hidden items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors py-2 px-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 -mx-1 mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to listings
                </button>

                {/* ── Hero card ─── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-start gap-5 mb-6">
                    {selectedJob.org_logo ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl border border-slate-100 bg-white p-2 flex items-center justify-center shadow-sm">
                        <Image
                          src={selectedJob.org_logo}
                          alt={selectedJob.org_name}
                          width={52}
                          height={52}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                        <Briefcase className="w-7 h-7 text-slate-300" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight tracking-tight mb-1">
                        {selectedJob.position_name || selectedJob.title}
                      </h1>
                      {selectedJob.org_name && (
                        <a
                          target="_blank"
                          href={selectedJob.org_website}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                          {selectedJob.org_name}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <LocationBadge label={formatLocation(selectedJob)} />
                    <TypeBadge
                      label={formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                    />
                    {selectedJob.is_remote && <RemoteBadge />}
                    {selectedJob.urgently_hiring && <UrgentBadge />}
                  </div>

                  {/* Urgency note */}
                  {selectedJob.urgently_hiring && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-5 text-xs text-blue-700 leading-relaxed">
                      <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      Responded to 75%+ of applications in the past 30 days, typically within 1 day.
                    </div>
                  )}

                  {/* CTA row */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                      Apply Now
                      <ArrowUpRight className="size-4" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500 hover:text-slate-700"
                      aria-label="Share">
                      <Share2 className="w-4 h-4" />
                    </button>

                    <PopupModal
                      open={shareModalOpen}
                      onClose={() => setShareModalOpen(false)}
                      title="Link copied"
                      message="The job link has been copied to your clipboard."
                    />
                  </div>
                </div>

                {/* ── Profile Insights card ─── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-800">Profile Insights</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-5 ml-11">
                    How the job qualifications align with your profile
                  </p>

                  <div className="ml-11 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Education</p>
                      <TypeBadge label="Bachelor's" />
                    </div>
                  </div>
                </div>

                {/* ── Job Details card ─── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-800">Job Details</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Type</p>
                      <TypeBadge
                        label={formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</p>
                      <LocationBadge label={formatLocation(selectedJob)} />
                    </div>
                  </div>

                  {/* Full description */}
                  <div className="border-t border-slate-100 pt-7">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Full Description
                    </p>
                    <div className="text-slate-700 text-sm leading-relaxed space-y-4">
                      {selectedJob.description ? (
                        (() => {
                          const text = selectedJob.description.replace(/<[^>]*>/g, "");
                          const sections = text.split(/(?=JOB QUALIFICATIONS:|JOB DETAILS:)/);
                          return sections.map((section, sectionIdx) => {
                            if (!section.trim()) return null;
                            if (section.startsWith("JOB QUALIFICATIONS:") || section.startsWith("JOB DETAILS:")) {
                              const headerMatch = section.match(/^(JOB QUALIFICATIONS:|JOB DETAILS:)/);
                              const header = headerMatch ? headerMatch[0] : "";
                              const content = section.replace(header, "").trim();
                              const items = content
                                .split(/(?=[A-Z][a-z]{2,})/)
                                .map((item) => item.trim())
                                .filter((item) => item.split(/\s+/).length >= 5);
                              return (
                                <div key={sectionIdx}>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                    {header.replace(":", "")}
                                  </p>
                                  <ul className="space-y-2">
                                    {items.map((item, idx) => (
                                      <li key={idx} className="flex items-start gap-2.5 text-slate-600">
                                        <span className="flex-shrink-0 w-1 h-1 rounded-full bg-blue-400 mt-2" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                            return (
                              <p key={sectionIdx} className="text-slate-600">
                                {section}
                              </p>
                            );
                          });
                        })()
                      ) : (
                        <p className="text-slate-400 italic text-sm">No description available.</p>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="border-t border-slate-100 pt-7 mt-7">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Requirements</p>
                      <ul className="space-y-2.5">
                        {selectedJob.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                            <span className="flex-shrink-0 w-1 h-1 rounded-full bg-blue-400 mt-2" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div className="border-t border-slate-100 pt-7 mt-7">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Benefits</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.benefits.map((benefit, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom apply CTA */}
                  <div className="border-t border-slate-100 pt-7 mt-7 flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                      Apply Now
                      <ArrowUpRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <p className="text-slate-600 font-semibold text-sm mb-1">
                    {filteredJobs.length === 0 &&
                    (searchQuery || filters.location || filters.employmentType || filters.isRemote !== null)
                      ? "No jobs match your search"
                      : "Select a position"}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {filteredJobs.length === 0 &&
                    (searchQuery || filters.location || filters.employmentType || filters.isRemote !== null)
                      ? "Try adjusting your filters"
                      : "Choose a listing on the left to see details"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
