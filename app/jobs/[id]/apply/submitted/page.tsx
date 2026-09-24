import { ArrowUpRight, CheckCircle2, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobHeader } from "@/components/job-header";
import { getJob } from "@/lib/jobs.server";
import { formatEmploymentType, jobLocation } from "@/lib/utils";

import { SubmittedEmail } from "./submitted-email";

type Params = {
  params: Promise<{ id: string }>;
};

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  return {
    title: job ? `Application submitted: ${job.position_name}` : "Application submitted",
    // A confirmation is for one candidate, not for search.
    robots: { index: false, follow: true },
  };
}

/**
 * The confirmation, on its own route.
 *
 * It used to be a branch inside the form: same URL, so a refresh dropped the
 * candidate back onto an empty form, there was nothing to link to, and nothing
 * to count in analytics. Here it survives a reload, and it renders for anyone
 * who opens it -- the role is public, and the only per-candidate line comes
 * from sessionStorage and is simply absent when there is nothing to show.
 */
export default async function ApplicationSubmittedPage({ params }: Params) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  const location = jobLocation(job);
  const employmentType = formatEmploymentType(job.contract_details, job.employment_type);

  return (
    <div className="min-h-screen bg-[#EFF1F6]">
      <JobHeader job={job} />

      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-4 sm:px-[30px] sm:pb-10 sm:pt-[26px]">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-[560px] rounded-xl bg-white px-5 py-8 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] sm:px-8 sm:py-9">
            <div className="flex flex-col items-center text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-[#CDEFE1] bg-[#E7F6EF]">
                <CheckCircle2 className="size-6 text-[#10A56B]" strokeWidth={1.75} />
              </span>

              <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#10162B]">Application Submitted!</h2>
              <p className="mt-2 max-w-[440px] text-[13px] leading-[1.65] text-[#4A5273]">
                Thank you for applying. We&apos;ll review your application and be in touch soon.
              </p>
            </div>

            {/* Which role this confirms. Without it a candidate applying to
                several of your roles gets the same page every time. */}
            <div className="mt-6 rounded-[10px] border border-[#E4E7F1] bg-[#FBFCFE] p-[18px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6C7591]">You applied for</p>
              <p className="mt-2 text-[15px] font-semibold tracking-[-0.015em] text-[#10162B]">{job.position_name}</p>
              {job.org_name && <p className="mt-0.5 text-[12px] text-[#4A5273]">{job.org_name}</p>}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {employmentType && (
                  <span className="rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-2.5 py-1 text-[11px] font-medium text-[#414A66]">
                    {employmentType}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-2.5 py-1 text-[11px] font-medium text-[#414A66]">
                    <MapPin className="size-[11px] text-[#6C7591]" />
                    {location}
                  </span>
                )}
              </div>
            </div>

            <SubmittedEmail jobId={String(job.id)} />

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
                Browse More Jobs
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href={`/jobs/${job.id}`}
                className="inline-flex min-h-[36px] items-center justify-center rounded-[7px] border border-[#D5DAE8] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#10162B] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F7F8FC]">
                View this role
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
