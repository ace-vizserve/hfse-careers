import { JobDetailEmptyState } from "@/components/job-detail-pane";

/**
 * What the detail column shows when the URL names no job — on `/`, and on any
 * other route this layout happens to wrap. A slot without a `default` makes
 * Next 404 the whole route on a hard visit, so this is not optional.
 */
export default function DetailDefault() {
  return <JobDetailEmptyState />;
}
