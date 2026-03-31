import JobsWidget from "@/components/jobs-widget";

export const metadata = {
  title: "Latest Job Openings | VizServe",
  description: "Recent career opportunities at HFSE and associated entities.",
};

export default function EmbedJobsPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <JobsWidget />
    </main>
  );
}
