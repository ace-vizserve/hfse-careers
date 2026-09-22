import { JobsSkeleton } from "@/components/ui/page-skeletons";

/** Shown while the listings page resolves its jobs on the server. */
export default function Loading() {
  return <JobsSkeleton />;
}
