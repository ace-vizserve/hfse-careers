"use client";

import { ArrowUpRight, Briefcase, CheckCircle, Mail, MapPin, Share2, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar";
import PopupModal from "@/components/ui/popup-modal";
import { formatEmploymentType, parseJobDescription } from "@/lib/utils";
import type { Job } from "@/lib/types/job";

interface FilterOptions {
  location: string;
  employmentType: string;
  isRemote: boolean | null;
}

// Navy header (104) + the search/filter row (92). Keep in step with navbar.tsx.
const NAVBAR_HEIGHT = 196;

export default function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();

  const [jobs] = useState<Job[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialJobs[0] ?? null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    employmentType: "",
    isRemote: null,
  });

  const formatLocation = (job: Job) => (job.is_remote ? "Remote" : job.country || "On-site");

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
  }, [filteredJobs, selectedJob?.id]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  const handleBack = () => setShowDetails(false);

  const handleShare = async () => {
    if (!selectedJob?.id) return;
    const jobUrl = `${window.location.origin}/jobs/${selectedJob.id}`;
    await navigator.clipboard.writeText(jobUrl);
    setShareModalOpen(true);
  };

  /**
   * Marks the part of a label that matched what is typed in the search box, so
   * a candidate can see why a result is in the list. Rebuilt on every keystroke
   * because searchQuery updates per character.
   */
  const Highlight = ({ text }: { text: string }) => {
    const term = searchQuery.trim();
    if (!term) return <>{text}</>;

    // The query is user input, so escape it before it becomes a pattern.
    const pattern = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    const parts = text.split(pattern);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="rounded-[3px] bg-[#FFE68A] px-0.5 text-[#10162B]">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  const TypeBadge = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
      <CheckCircle className="w-3 h-3" />
      {label}
    </span>
  );

  const RemoteBadge = () => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
      Remote
    </span>
  );

  const LocationBadge = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-3 py-1.5 text-[12px] font-medium text-[#414A66]">
      <MapPin className="w-3 h-3" />
      {label}
    </span>
  );

  const UrgentBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
      <Zap className="w-3 h-3" />
      Urgently Hiring
    </span>
  );

  return (
    <>
      <style>{`
        body { background-color: #EFF1F6; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-dvh bg-[#EFF1F6]">
        <Navbar onSearch={setSearchQuery} onFilterChange={setFilters} />

        <div
          className="max-w-[1680px] mx-auto md:flex px-10 pt-6 pb-8 gap-6"
          style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
          <div
            className={`${showDetails ? "hidden md:flex" : "flex"} flex-col w-full md:w-[41%] bg-white rounded-xl overflow-hidden mb-6`}>
            <div className="flex-shrink-0 px-6 py-[18px] border-b border-[#ECEFF7] bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">
                  {filteredJobs.length === 1 ? "Role available" : "Roles available"}
                </p>
                <span className="rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1 text-sm font-semibold text-[#1B2A8F]">
                  {filteredJobs.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
              {filteredJobs.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-14 h-14 rounded-lg bg-[#EDEFF6] flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-[#6C7591]" />
                  </div>
                  <p className="text-[#4A5273] font-semibold mb-1">No positions found</p>
                  <p className="text-[#6C7591] text-sm">Try adjusting your search or filters</p>
                </div>
              )}

              {filteredJobs.map((job) => {
                const isActive = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`relative rounded-[10px] px-5 py-[18px] cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? "bg-white border-[#1E2FA8] shadow-[0_2px_4px_rgba(30,47,168,0.10),0_8px_18px_rgba(30,47,168,0.14)]"
                        : "bg-white border-[#E4E7F1] hover:border-[#C8CEE0] hover:shadow-[0_2px_8px_rgba(16,22,43,0.06)]"
                    }`}>
                    <div className="flex items-start gap-4 mb-4">
                      {job.org_logo ? (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-[#E3E6F0] bg-white p-1.5 flex items-center justify-center shadow-[0_1px_2px_rgba(16,22,43,0.07)]">
                          <Image
                            src={job.org_logo}
                            alt={job.org_name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-[#E3E6F0] bg-[#F2F4FA] flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-[#6C7591]" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {job.urgently_hiring && (
                          <div className="mb-1.5">
                            <UrgentBadge />
                          </div>
                        )}

                        <h3 className="text-[17px] font-semibold tracking-[-0.015em] leading-[1.3] text-[#10162B] truncate">
                          <Highlight text={job.position_name || job.title || "Position Title"} />
                        </h3>

                        {job.org_name && (
                          <a
                            target="_blank"
                            href={job.org_website}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-[#1E2FA8] hover:text-[#1E2FA8] hover:underline mt-0.5 inline-block truncate max-w-full">
                            <Highlight text={job.org_name} />
                          </a>
                        )}
                      </div>

                      <LocationBadge label={formatLocation(job)} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge label={formatEmploymentType(job.contract_details, job.employment_type)} />
                      {job.is_remote && <RemoteBadge />}
                      {job.easily_apply && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2F4FA] border border-[#E3E6F0] text-[#6C7591] text-xs font-semibold">
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

          <div
            className={`${showDetails ? "flex" : "hidden md:flex"} flex-col flex-1 overflow-hidden mb-6 bg-white rounded-xl shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]`}>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-6 p-1">
                {selectedJob ? (
                  <div className="space-y-6">
                    <button
                      onClick={handleBack}
                      className="flex md:hidden items-center gap-2 text-sm font-medium text-[#6C7591] hover:text-[#414A66] transition-colors py-2 px-3 rounded-[7px] hover:bg-white border border-transparent hover:border-[#E3E6F0] -mx-1 mb-1">
                      Back to listings
                    </button>

                    <div className="bg-white rounded-xl border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-6 sm:p-8">
                      <div className="flex items-start gap-5 mb-6">
                        {selectedJob.org_logo ? (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-[#ECEFF7] bg-white p-2 flex items-center justify-center shadow-[0_1px_2px_rgba(16,22,43,0.04)]">
                            <Image
                              src={selectedJob.org_logo}
                              alt={selectedJob.org_name}
                              width={52}
                              height={52}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-[#ECEFF7] bg-[#F2F4FA] flex items-center justify-center">
                            <Briefcase className="w-7 h-7 text-[#6C7591]" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h1 className="text-2xl sm:text-3xl font-bold text-[#10162B] leading-tight tracking-tight mb-1">
                            {selectedJob.position_name || selectedJob.title}
                          </h1>

                          {selectedJob.org_name && (
                            <a
                              target="_blank"
                              href={selectedJob.org_website}
                              className="text-sm font-bold text-[#1E2FA8] hover:text-[#1E2FA8] hover:underline">
                              {selectedJob.org_name}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <LocationBadge label={formatLocation(selectedJob)} />
                        <TypeBadge
                          label={formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                        />
                        {selectedJob.is_remote && <RemoteBadge />}
                        {selectedJob.urgently_hiring && <UrgentBadge />}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/jobs/${selectedJob.id}/apply`}
                          className="flex items-center gap-2 px-6 py-3 bg-[#1E2FA8] text-white text-sm font-semibold rounded-[7px] hover:bg-[#16217A] transition-all shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)]">
                          Apply Now
                          <ArrowUpRight className="size-4" />
                        </Link>

                        <button
                          onClick={handleShare}
                          className="p-3 rounded-[7px] border border-[#E3E6F0] bg-white hover:bg-[#F2F4FA] hover:border-[#D5DAE8] transition-all text-[#6C7591] hover:text-[#414A66]"
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

                    <div className="bg-white rounded-xl border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-6 sm:p-7">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#1E2FA8] flex items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)]">
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-base font-semibold text-[#414A66]">Job Details</h2>
                      </div>

                      <div className="text-[#414A66] text-sm leading-relaxed">
                        {selectedJob.description ? (
                          <div className="bg-white rounded-xl border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-6 sm:p-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                              <div className="p-4 rounded-lg bg-[#F2F4FA] border border-[#ECEFF7]">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-2">
                                  Job Type
                                </p>
                                <TypeBadge
                                  label={formatEmploymentType(
                                    selectedJob.contract_details,
                                    selectedJob.employment_type,
                                  )}
                                />
                              </div>
                              <div className="p-4 rounded-lg bg-[#F2F4FA] border border-[#ECEFF7]">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-2">
                                  Location
                                </p>
                                <LocationBadge label={formatLocation(selectedJob)} />
                              </div>
                            </div>

                            {/* Full description */}
                            <div className="border-t border-[#ECEFF7] pt-7">
                              <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                Full Description
                              </p>
                              <div className="text-[#414A66] text-sm leading-relaxed space-y-4">
                                {selectedJob.description ? (
                                  (() => {
                                    return parseJobDescription(selectedJob.description).map((section, sectionIdx) => {
                                      if (section.type === "header") {
                                        return (
                                          <div key={sectionIdx}>
                                            <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-3">
                                              {section.header.replace(":", "")}
                                            </p>
                                            <ul className="space-y-2">
                                              {section.items.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-[#4A5273]">
                                                  <span className="flex-shrink-0 w-1 h-1 rounded-[1px] bg-[#1E2FA8] mt-2" />
                                                  {item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        );
                                      }
                                      return (
                                        <p key={sectionIdx} className="text-[#4A5273]">
                                          {section.text}
                                        </p>
                                      );
                                    });
                                  })()
                                ) : (
                                  <p className="text-[#6C7591] italic text-sm">No description available.</p>
                                )}
                              </div>
                            </div>

                            {/* Requirements */}
                            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                              <div className="border-t border-[#ECEFF7] pt-7 mt-7">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                  Requirements
                                </p>
                                <ul className="space-y-2.5">
                                  {selectedJob.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#4A5273]">
                                      <span className="flex-shrink-0 w-1 h-1 rounded-[1px] bg-[#1E2FA8] mt-2" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Benefits */}
                            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                              <div className="border-t border-[#ECEFF7] pt-7 mt-7">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                  Benefits
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedJob.benefits.map((benefit, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 bg-[#EDEFF6] border border-[#E3E6F0] text-[#4A5273] rounded-md text-xs font-medium">
                                      {benefit}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bottom apply CTA */}
                            <div className="border-t border-[#ECEFF7] pt-7 mt-7 flex items-center gap-3">
                              <button
                                onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-[#1E2FA8] text-white text-sm font-semibold rounded-[7px] hover:bg-[#16217A] transition-all shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)]">
                                Apply Now
                                <ArrowUpRight className="size-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[#6C7591] italic text-sm">No description available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                    <div className="w-16 h-16 rounded-lg bg-white border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.07)] flex items-center justify-center">
                      <Briefcase className="w-7 h-7 text-[#6C7591]" />
                    </div>
                    <div>
                      <p className="text-[#4A5273] font-semibold text-sm mb-1">Select a position</p>
                      <p className="text-[#6C7591] text-xs">Choose a listing on the left to see details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
