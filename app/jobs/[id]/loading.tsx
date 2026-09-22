import { JobDetailSkeleton } from "@/components/ui/page-skeletons";

/** Covers the first request for a role that was not prerendered. */
export default function Loading() {
  return <JobDetailSkeleton />;
}
