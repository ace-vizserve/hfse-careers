"use client";

import Navbar from "@/components/navbar";
import type { Job } from "@/lib/types/job";
import { formatEmploymentType } from "@/lib/utils";
import { Briefcase, CheckCircle, Mail, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

interface FilterOptions {
  employmentType: string;
  isRemote: boolean | null;
  employer: string;
  frequency: string;
  urgentOnly: boolean;
}

/** Navy header (104) + the search/filter row (92). Keep in step with navbar.tsx. */
const NAVBAR_HEIGHT = 196;

/** Phone chrome: the navy bar (76) + the search row (68). */
const MOBILE_NAVBAR_HEIGHT = 144;

/** Below this the detail is a page of its own, not a column. Matches Tailwind `md`. */
const DETAIL_PANE_MIN_WIDTH = "(min-width: 768px)";

const TypeBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
    <CheckCircle className="w-3 h-3" />
    {label}
  </span>
);

const LocationBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-3 py-1.5 text-[12px] font-medium text-[#414A66]">
    <MapPin className="w-3 h-3" />
    {label}
  </span>
);

const formatLocation = (job: Job) => (job.is_remote ? "Remote" : job.country || "On-site");

const RemoteBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
    Remote
  </span>
);

const UrgentBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1.5 text-[12px] font-medium text-[#1B2A8F]">
    <Zap className="w-3 h-3" />
    Urgently Hiring
  </span>
);

/**
 * The board: the listing on the left, and on the right whatever the
 * `@detail` slot is currently routed to.
 *
 * Selection is a URL, not state. A card is a link to `/jobs/[id]`, which the
 * intercepting route renders into the slot beside the list -- so the list keeps
 * its scroll position, its filters and its place, and Back does the obvious
 * thing. A direct visit to the same URL gets the standalone page instead, which
 * is what interception is for.
 */
export default function BoardShell({
  jobs,
  detail,
  children,
}: {
  jobs: Job[];
  /** The `@detail` parallel route. Server-rendered, handed down as a node. */
  detail: ReactNode;
  /** The page itself, which on this route is only its structured data. */
  children: ReactNode;
}) {
  const pathname = usePathname();

  /** Which card is lit up, read off the URL rather than tracked alongside it. */
  const selectedId = pathname?.startsWith("/jobs/") ? (pathname.split("/")[2] ?? null) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    employmentType: "",
    isRemote: null,
    employer: "",
    frequency: "",
    urgentOnly: false,
  });

  // Only offer employers that actually have a posting.
  const employers = useMemo(() => Array.from(new Set(jobs.map((job) => job.org_name).filter(Boolean))).sort(), [jobs]);

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

    if (filters.employer) {
      filtered = filtered.filter((job) => job.org_name === filters.employer);
    }

    if (filters.frequency) {
      filtered = filtered.filter((job) => job.frequency === filters.frequency);
    }

    if (filters.urgentOnly) {
      filtered = filtered.filter((job) => job.urgently_hiring === true);
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

  /**
   * On a phone there is no column to render into, so the click is allowed to
   * become a real navigation: a full load of `/jobs/[id]`, which misses the
   * interception and lands on the standalone page. Deciding at click time
   * rather than at render keeps the markup identical on the server and the
   * client, so nothing has to be measured before the page can be drawn.
   */
  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>, job: Job) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (window.matchMedia(DETAIL_PANE_MIN_WIDTH).matches) return;

    event.preventDefault();
    window.location.href = `/jobs/${job.id}`;
  };

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

  return (
    <>
      {children}

      {/* `suppressHydrationWarning`, because the PDPA dialog marks every other
          child of the body `aria-hidden` when it opens, and on Safari this
          subtree is hydrated as a consequence of that focus change -- so the
          attribute is always on the element before React gets to it. The
          warning is about markup this component never rendered. */}
      <div className="board-root min-h-dvh bg-[#EFF1F6]" suppressHydrationWarning>
        <Navbar
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
          employers={employers}
          resultCount={filteredJobs.length}
        />

        {/* The page scrolls as one. The listing flows with it; the detail
            column is pinned under the chrome and scrolls within itself, so a
            long description never drags the list along with it. */}
        <div
          className="mx-auto flex max-w-[1680px] flex-col gap-6 px-4 pb-8 pt-4 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:pt-6"
          style={
            {
              "--chrome": `${NAVBAR_HEIGHT}px`,
              "--chrome-mobile": `${MOBILE_NAVBAR_HEIGHT}px`,
            } as React.CSSProperties
          }>
          <div className="min-w-0 flex-1 lg:w-[41%] lg:flex-none">
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-white px-6 py-[18px] shadow-[0_1px_2px_rgba(16,22,43,0.05)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">
                {filteredJobs.length === 1 ? "Role available" : "Roles available"}
              </p>
              <span className="rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-3 py-1 text-sm font-semibold text-[#1B2A8F]">
                {filteredJobs.length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredJobs.length === 0 && (
                <div className="rounded-xl bg-white py-24 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#EDEFF6]">
                    <Briefcase className="h-6 w-6 text-[#6C7591]" />
                  </div>
                  <p className="mb-1 font-semibold text-[#4A5273]">No positions found</p>
                  <p className="text-sm text-[#6C7591]">Try adjusting your search or filters</p>
                </div>
              )}

                {filteredJobs.map((job) => {
                  const isActive = String(job.id) === selectedId;

                  return (
                    <div
                      key={job.id}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative rounded-[10px] px-5 py-[18px] transition-all duration-200 border ${
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
                            {/* `after:` stretches this link over the whole
                                card, so the card is clickable without wrapping
                                the employer's own link inside it. */}
                            <Link
                              href={`/jobs/${job.id}`}
                              scroll={false}
                              onClick={(event) => handleCardClick(event, job)}
                              className="after:absolute after:inset-0 after:rounded-[10px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#1E2FA8]/40">
                              <Highlight text={job.position_name || job.title || "Position Title"} />
                            </Link>
                          </h3>

                          {job.org_name && (
                            <a
                              target="_blank"
                              href={job.org_website}
                              onClick={(e) => e.stopPropagation()}
                              className="relative z-10 text-xs font-bold text-[#1E2FA8] hover:text-[#1E2FA8] hover:underline mt-0.5 inline-block truncate max-w-full">
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

          {/* Hidden below lg: there the detail is its own page. */}
          <div
            className="hidden min-w-0 flex-1 lg:sticky lg:block lg:overflow-y-auto lg:rounded-xl lg:bg-white lg:shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]"
            style={{ top: `calc(var(--chrome) + 1.5rem)`, maxHeight: `calc(100vh - var(--chrome) - 3rem)` }}>
            {detail}
          </div>
        </div>
      </div>
    </>
  );
}
