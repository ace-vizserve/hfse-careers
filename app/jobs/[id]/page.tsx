import { entity_list } from "@/app/constants";
import Navbar from "@/components/navbar";
import { getJob, getPublishedJobs } from "@/lib/jobs.server";
import type { JobDetail } from "@/lib/types/job";
import { absoluteUrl, jsonLdScript, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { formatEmploymentType, jobLocation, parseJobDescription } from "@/lib/utils";
import { ArrowRight, Briefcase, CheckCircle2, ChevronLeft, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareRoleButton } from "./share-button";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * Job pages are prerendered at build and refreshed in the background, so a
 * visitor is served static HTML and never waits on Manatal. Roles published
 * after the last build still resolve on first request, then cache like the
 * rest (`dynamicParams`).
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const jobs = await getPublishedJobs();

  return jobs.filter((job) => job.id).map((job) => ({ id: String(job.id) }));
}


/** Google prefers an ISO country code to a name. */
const COUNTRY_CODES: Record<string, string> = {
  Singapore: "SG",
  Malaysia: "MY",
  Philippines: "PH",
  Indonesia: "ID",
};

const POSTING_WINDOW_DAYS = 90;
const MINIMUM_REMAINING_DAYS = 30;

/**
 * Google wants a closing date and quietly drops a posting that has none -- but
 * it drops one with a *past* date immediately, so the fallback must never look
 * backwards. Every role here is still published and active in Manatal, which is
 * the only claim this makes: open now, and for a while yet. The page revalidates
 * every few minutes, so the date rolls forward while the role stays up and stops
 * the moment it comes down.
 */
function validThrough(posted: string, explicit?: string) {
  if (explicit) return explicit;

  const closes = new Date(posted);

  if (Number.isNaN(closes.getTime())) return undefined;

  closes.setDate(closes.getDate() + POSTING_WINDOW_DAYS);

  const floor = new Date();
  floor.setDate(floor.getDate() + MINIMUM_REMAINING_DAYS);

  return (closes > floor ? closes : floor).toISOString().split("T")[0];
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapEmploymentType(value?: string) {
  const raw = (value || "").toUpperCase();

  if (raw.includes("FULL")) return "FULL_TIME";
  if (raw.includes("PART")) return "PART_TIME";
  if (raw.includes("CONTRACT")) return "CONTRACTOR";
  if (raw.includes("TEMP")) return "TEMPORARY";
  if (raw.includes("INTERN")) return "INTERN";

  return "OTHER";
}

function salaryUnit(freq?: string) {
  if (freq === "hour") return "HOUR";
  if (freq === "day") return "DAY";
  if (freq === "week") return "WEEK";
  if (freq === "year") return "YEAR";
  return "MONTH";
}

/** The sidebar prints the amount on its own line, so the cadence is separate. */
function formatSalaryAmount(min?: number, max?: number, currency?: string) {
  if (!min && !max) return null;

  const formatter = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "SGD",
    maximumFractionDigits: 0,
  });

  if (min && max && min !== max) {
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }

  return formatter.format((min || max)!);
}

function salaryCadence(frequency?: string) {
  if (frequency === "hour") return "an hour";
  if (frequency === "day") return "a day";
  if (frequency === "week") return "a week";
  if (frequency === "year") return "a year";
  return "a month";
}

function formatDatePosted(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function websiteLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderJobDescription(description: string) {
  return parseJobDescription(description).map((section, sectionIdx) => {
    const spacing = sectionIdx === 0 ? "" : "mt-5";

    if (section.type === "header") {
      return (
        <section key={sectionIdx} className={spacing}>
          <p className="text-[13px] font-bold text-[#10162B]">{section.header}</p>
          <ul className="mt-[9px] list-disc pl-[19px] text-[14px] leading-[1.85] text-[#414A66]">
            {section.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      );
    }

    return (
      <p key={sectionIdx} className={`text-[14px] leading-[1.85] text-[#414A66] ${spacing}`}>
        {section.text}
      </p>
    );
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: "Job not found",
      description: "This job posting is no longer available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = stripHtml(job.description).slice(0, 155);
  const canonicalPath = `/jobs/${job.id}`;

  // The layout's template appends "| HFSE Careers"; Open Graph has no template
  // of its own, so it spells the whole thing out.
  const socialTitle = `${job.position_name} | HFSE Careers`;

  return {
    title: job.position_name,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: "en_SG",
      type: "article",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${job.position_name} - HFSE Careers`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function JobDetailPage({ params }: Params) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  const organization = entity_list.find((org) => org.id === job.organization);
  const orgLogo = organization?.logo;
  const orgName = organization?.name || job.company?.name || "HFSE Global Education Group";
  const orgWebsite = organization?.website || "https://hfse.edu.sg/";

  const location = jobLocation(job);
  const employmentType = formatEmploymentType(job.contract_details, job.employment_type, "Full-Time");
  const salary = formatSalaryAmount(job.salary_min, job.salary_max, job.currency);
  const datePosted = formatDatePosted(job.date_posted || job.updated_at);

  const datePostedIso = job.date_posted || job.updated_at || new Date().toISOString().split("T")[0];
  const closingDate = validThrough(datePostedIso, job.valid_through);

  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.position_name,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.company?.name || "HFSE Global Education Group",
      value: String(job.id),
    },
    datePosted: datePostedIso,
    ...(closingDate ? { validThrough: closingDate } : {}),
    employmentType: mapEmploymentType(job.contract_details || job.employment_type),
    hiringOrganization: {
      "@type": "Organization",
      name: orgName,
      sameAs: orgWebsite,
      logo: orgLogo || absoluteUrl("/assets/geg-favicon.png"),
    },
    ...(location
      ? {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(job.city ? { addressLocality: job.city } : {}),
              ...(job.country ? { addressCountry: COUNTRY_CODES[job.country] ?? job.country } : {}),
            },
          },
        }
      : {}),
    ...(job.is_remote
      ? {
          jobLocationType: "TELECOMMUTE",
          ...(job.country
            ? { applicantLocationRequirements: { "@type": "Country", name: job.country } }
            : {}),
        }
      : {}),
    ...(job.salary_min || job.salary_max
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.currency || "SGD",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salary_min ? { minValue: job.salary_min } : {}),
              ...(job.salary_max ? { maxValue: job.salary_max } : {}),
              unitText: salaryUnit(job.frequency),
            },
          },
        }
      : {}),
    directApply: true,
    url: absoluteUrl(`/jobs/${job.id}`),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Jobs", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: job.position_name, item: absoluteUrl(`/jobs/${job.id}`) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jobPostingJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd)} />

      <div className="flex min-h-dvh flex-col bg-[#EFF1F6]">
        {/* Same navy chrome as the listings page; the artboard drops its search row. */}
        <Navbar showSearch={false} />

        <div className="mx-auto w-full max-w-[1680px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-[30px]">
          <Link
            href="/"
            className="inline-flex items-center gap-[7px] text-[16px] font-medium text-[#4A5273] transition-colors hover:text-[#10162B]">
            <ChevronLeft className="size-4" />
            See all jobs
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[1680px] px-4 pb-10 pt-3 sm:px-6 lg:px-10 lg:pb-14 lg:pt-4">
          <div className="flex flex-col items-start gap-5 lg:flex-row">
            <main className="flex w-full min-w-0 flex-1 flex-col gap-4">
              {/* Title card */}
              <section className="rounded-xl bg-white px-5 py-5 sm:px-7 sm:py-[26px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
                <div className="flex gap-4">
                  {orgLogo ? (
                    <div className="flex size-[60px] flex-shrink-0 items-center justify-center rounded-xl border border-[#E3E6F0] bg-white shadow-[0_1px_3px_rgba(16,22,43,0.08)]">
                      <Image src={orgLogo} alt={orgName} width={44} height={44} className="h-auto w-11 object-contain" />
                    </div>
                  ) : (
                    <div className="flex size-[60px] flex-shrink-0 items-center justify-center rounded-xl border border-[#E3E6F0] bg-[#F2F4FA]">
                      <Briefcase className="size-6 text-[#6C7591]" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h1 className="text-[22px] font-bold leading-[1.2] tracking-[-0.035em] text-[#10162B] sm:text-[28px] sm:leading-[1.15]">
                      {job.position_name}
                    </h1>

                    <a
                      href={orgWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-medium text-[#4A5273] transition-colors hover:text-[#10162B]">
                      {orgName}
                    </a>

                    <div className="mt-[14px] flex flex-wrap gap-[7px]">
                      {location && (
                        <span className="inline-flex items-center gap-[5px] rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-2.5 py-[5px] text-[12px] font-medium text-[#414A66]">
                          <MapPin className="size-3 text-[#6C7591]" />
                          {location}
                        </span>
                      )}
                      <span className="rounded-md border border-[#D3D9F7] bg-[#E7EAFB] px-2.5 py-[5px] text-[12px] font-medium text-[#1B2A8F]">
                        {employmentType}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Job description */}
              <section className="rounded-xl bg-white px-5 py-5 sm:px-7 sm:py-[26px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
                <h2 className="mb-4 border-b border-[#ECEFF7] pb-[14px] text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">
                  Job Description
                </h2>

                {renderJobDescription(job.description || "")}
              </section>

              {/* Process cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-xl bg-white p-[22px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_6px_18px_rgba(16,22,43,0.06)]">
                  <div className="flex items-start gap-[14px]">
                    <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7EAFB]">
                      <Clock className="size-5 text-[#1E2FA8]" />
                    </span>
                    <div>
                      <h2 className="mb-1 text-[15px] font-semibold text-[#10162B]">Application Process</h2>
                      <p className="text-[13px] leading-[1.65] text-[#4A5273]">
                        We review applications on a rolling basis and will contact qualified candidates within 5-7
                        business days.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl bg-white p-[22px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_6px_18px_rgba(16,22,43,0.06)]">
                  <div className="flex items-start gap-[14px]">
                    <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7EAFB]">
                      <CheckCircle2 className="size-5 text-[#1E2FA8]" />
                    </span>
                    <div>
                      <h2 className="mb-1 text-[15px] font-semibold text-[#10162B]">What to Expect</h2>
                      <p className="text-[13px] leading-[1.65] text-[#4A5273]">
                        Our hiring process includes an initial screening, technical interview, and final conversation
                        with the team.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Closing CTA */}
              {/* Phones already get the sidebar's Apply Now just below this. */}
              <section className="relative hidden overflow-hidden rounded-[14px] px-6 py-10 text-center sm:block sm:px-10 sm:py-[52px] shadow-[0_2px_6px_rgba(22,33,122,0.2),0_16px_40px_rgba(22,33,122,0.28)]">
                <Image
                  src="/assets/career-opportunities.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 780px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,33,122,0.93)_0%,rgba(30,47,168,0.82)_55%,rgba(38,56,182,0.7)_100%)]" />

                <div className="relative">
                  <h2 className="text-[22px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">Ready to Apply?</h2>
                  <p className="mx-auto mt-[10px] max-w-[440px] text-[14px] leading-[1.65] text-white/80">
                    Take the next step in your career with {orgName}.
                  </p>

                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="mt-6 inline-flex items-center gap-[9px] rounded-lg bg-white px-8 py-[14px] text-[15px] font-semibold text-[#16217A] shadow-[0_2px_4px_rgba(0,0,0,0.18),0_12px_30px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-0.5">
                    Apply Now
                    <ArrowRight className="size-4" strokeWidth={2.4} />
                  </Link>
                </div>
              </section>
            </main>

            <aside className="flex w-full flex-shrink-0 flex-col gap-4 lg:w-[420px]">
              <section className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
                {salary && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">Salary</p>
                    <p className="mt-[7px] text-[24px] font-bold tracking-[-0.03em] text-[#10162B]">{salary}</p>
                    <p className="mt-0.5 text-[13px] text-[#6C7591]">{salaryCadence(job.frequency)}</p>
                  </div>
                )}

                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="flex min-h-[42px] w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_4px_12px_rgba(30,47,168,0.3)] transition-all hover:brightness-110">
                  Apply Now
                </Link>

                <ShareRoleButton jobId={job.id} />

                <div className="my-5 h-px bg-[#ECEFF7]" />

                <div className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-[#6C7591]">Employment type</span>
                  <span className="font-semibold text-[#10162B]">{employmentType}</span>
                </div>

                {location && (
                  <div className="flex justify-between py-1.5 text-[13px]">
                    <span className="text-[#6C7591]">Location</span>
                    <span className="font-semibold text-[#10162B]">{location}</span>
                  </div>
                )}

                {datePosted && (
                  <div className="flex justify-between py-1.5 text-[13px]">
                    <span className="text-[#6C7591]">Date posted</span>
                    <span className="font-semibold text-[#10162B]">{datePosted}</span>
                  </div>
                )}
              </section>

              <section className="rounded-xl bg-white p-[22px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_6px_18px_rgba(16,22,43,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#E3E6F0] bg-white">
                    {orgLogo ? (
                      <Image src={orgLogo} alt="" width={32} height={32} className="h-auto w-8 object-contain" />
                    ) : (
                      <Briefcase className="size-4 text-[#6C7591]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#10162B]">{orgName}</p>
                    <a
                      href={orgWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-[#1E2FA8] hover:underline">
                      {websiteLabel(orgWebsite)}
                    </a>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
