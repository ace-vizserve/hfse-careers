import { ChevronLeft, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { JobDetail } from "@/lib/types/job";

/**
 * The navy bar that heads the apply flow: where the candidate came from, which
 * role they are on, and who it is with.
 *
 * It lives here rather than inside the form because the confirmation is its own
 * route now and has to head the page the same way -- a candidate who has just
 * submitted should not be dropped onto a differently-framed page.
 */
export function JobHeader({ job }: { job: JobDetail }) {
  return (
    // Tighter on a phone: stacked, this bar plus the stepper band under it was
    // eating a third of a small screen before the first field.
    <div className="bg-[#1B2A8F] px-4 py-3 shadow-[0_1px_0_#E1E5F0] sm:px-[30px] sm:py-7">
      <div className="mx-auto flex max-w-[1060px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-[7px] text-[13px] font-medium text-white transition-colors hover:text-[#C3C9DC]">
          <ChevronLeft className="size-[15px]" />
          Back to listings
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="min-w-0 flex-1 sm:flex-none sm:text-right">
            <h1 className="truncate text-[18px] font-semibold leading-[1.2] tracking-[-0.03em] text-white sm:text-[22px]">
              {job?.position_name || "Open Position"}
            </h1>
            <div className="mt-[5px] flex flex-wrap items-center gap-[9px] text-[12px] text-white sm:justify-end sm:text-[13px]">
              {job?.org_website ? (
                <Link href={job.org_website} target="_blank" className="font-medium text-white hover:underline">
                  {job?.org_name || "Company"}
                </Link>
              ) : (
                <span className="font-medium">{job?.org_name || "Company"}</span>
              )}
              {job?.location && (
                <>
                  <span className="text-[#C3C9DC]">&middot;</span>
                  <span className="inline-flex items-center gap-[5px]">
                    <MapPin className="size-3 text-white" />
                    {job.location}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#E3E6F0] bg-white shadow-[0_1px_3px_rgba(16,22,43,0.08)] sm:size-14">
            {job?.org_logo ? (
              <Image
                src={job.org_logo}
                alt={job.org_name ?? "Organization logo"}
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <span className="text-[17px] font-semibold text-[#6C7591]">{job?.org_name?.charAt(0) || "C"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
