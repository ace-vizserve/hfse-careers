import JobsWidget from "@/components/jobs-widget";

export const metadata = {
  // Absolute: this renders inside someone else's page, not ours.
  title: { absolute: "Latest Job Openings | VizServe" },
  description: "Recent career opportunities at HFSE and associated entities.",
};

export default function EmbedJobsPage() {
  return (
    <main className="relative overflow-hidden">
      <JobsWidget />
    </main>
  );
}
