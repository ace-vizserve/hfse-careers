"use client";

import PopupModal from "@/components/ui/popup-modal";
import type { Job } from "@/lib/types/job";
import { formatEmploymentType, parseJobDescription } from "@/lib/utils";
import { ArrowUpRight, Briefcase, CheckCircle, MapPin, Share2, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * A `Job` from the published listing, not the `JobDetail` that `getJob`
 * returns: this pane renders `urgently_hiring`, `requirements`, `benefits` and
 * `title`, and the per-job endpoint carries none of them. The intercepted route
 * therefore resolves its job out of the cached listing rather than re-fetching
 * one -- which also means a click costs no round-trip at all.
 */
export type PaneJob = Job;

const formatLocation = (job: PaneJob) => (job.is_remote ? "Remote" : job.country || "On-site");

/* Badges live at module scope: declared inside the pane they would be a new
   component type on every render, and React would rebuild rather than update. */
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

/** Shown in the detail column before a role has been picked. */
export const JobDetailEmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#ECEFF7] bg-white shadow-[0_1px_2px_rgba(16,22,43,0.07)]">
      <Briefcase className="h-7 w-7 text-[#6C7591]" />
    </div>
    <div>
      <p className="mb-1 text-sm font-semibold text-[#4A5273]">Select a position</p>
      <p className="text-xs text-[#6C7591]">Choose a listing on the left to see details</p>
    </div>
  </div>
);

/**
 * The right-hand column of the board. Rendered by the intercepted
 * `/jobs/[id]` route, so the URL is a real one and Back works, while the
 * listing beside it stays mounted.
 */
export default function JobDetailPane({ job }: { job: PaneJob }) {
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = async () => {
    if (!job?.id) return;
    await navigator.clipboard.writeText(`${window.location.origin}/jobs/${job.id}`);
    setShareModalOpen(true);
  };

  return (
                  <div className="space-y-6 p-2">
                    <div className="bg-white rounded-xl border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-5 sm:p-8">
                      <div className="flex items-start gap-5 mb-6">
                        {job.org_logo ? (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-[#ECEFF7] bg-white p-2 flex items-center justify-center shadow-[0_1px_2px_rgba(16,22,43,0.04)]">
                            <Image
                              src={job.org_logo}
                              alt={job.org_name}
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
                          <h1 className="mb-1 text-[22px] font-bold leading-tight tracking-tight text-[#10162B] sm:text-[28px]">
                            {job.position_name || job.title}
                          </h1>

                          {job.org_name && (
                            <a
                              target="_blank"
                              href={job.org_website}
                              className="text-sm font-bold text-[#1E2FA8] hover:text-[#1E2FA8] hover:underline">
                              {job.org_name}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <LocationBadge label={formatLocation(job)} />
                        <TypeBadge
                          label={formatEmploymentType(job.contract_details, job.employment_type)}
                        />
                        {job.is_remote && <RemoteBadge />}
                        {job.urgently_hiring && <UrgentBadge />}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/jobs/${job.id}/apply`}
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
                        {job.description ? (
                          <div className="bg-white rounded-xl border border-[#ECEFF7] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] p-6 sm:p-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                              <div className="p-4 rounded-lg bg-[#F2F4FA] border border-[#ECEFF7]">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-2">
                                  Job Type
                                </p>
                                <TypeBadge
                                  label={formatEmploymentType(
                                    job.contract_details,
                                    job.employment_type,
                                  )}
                                />
                              </div>
                              <div className="p-4 rounded-lg bg-[#F2F4FA] border border-[#ECEFF7]">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-2">
                                  Location
                                </p>
                                <LocationBadge label={formatLocation(job)} />
                              </div>
                            </div>

                            {/* Full description */}
                            <div className="border-t border-[#ECEFF7] pt-7">
                              <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                Full Description
                              </p>
                              <div className="text-[#414A66] text-sm leading-relaxed space-y-4">
                                {job.description ? (
                                  (() => {
                                    return parseJobDescription(job.description).map((section, sectionIdx) => {
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
                            {job.requirements && job.requirements.length > 0 && (
                              <div className="border-t border-[#ECEFF7] pt-7 mt-7">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                  Requirements
                                </p>
                                <ul className="space-y-2.5">
                                  {job.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#4A5273]">
                                      <span className="flex-shrink-0 w-1 h-1 rounded-[1px] bg-[#1E2FA8] mt-2" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Benefits */}
                            {job.benefits && job.benefits.length > 0 && (
                              <div className="border-t border-[#ECEFF7] pt-7 mt-7">
                                <p className="text-xs font-semibold text-[#6C7591] uppercase tracking-wider mb-4">
                                  Benefits
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {job.benefits.map((benefit, idx) => (
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
                                onClick={() => router.push(`/jobs/${job.id}/apply`)}
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
  );
}
