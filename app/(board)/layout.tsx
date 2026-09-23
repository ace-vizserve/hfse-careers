import BoardShell from "@/components/board/board-shell";
import { getPublishedJobs } from "@/lib/jobs.server";

/**
 * The board's own layout, so the listing survives a navigation into a job.
 *
 * Next re-renders the page for a route change but keeps the layout mounted, so
 * holding the list here is what lets `/jobs/[id]` render beside it without the
 * list reloading, losing its filters or jumping back to the top.
 *
 * `/jobs/[id]` itself lives outside this group, which is what a direct visit
 * to that URL gets: the standalone page, no board around it.
 */
export default async function BoardLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  // Cached and deduplicated, so the intercepted route reading the same list
  // costs nothing: a click never waits on the network.
  const jobs = await getPublishedJobs();

  return (
    <BoardShell jobs={jobs} detail={detail}>
      {children}
    </BoardShell>
  );
}
