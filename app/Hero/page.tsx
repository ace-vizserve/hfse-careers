"use client";
import { BookOpen, Briefcase, CheckCircle, DollarSign, Loader2, Mail, MapPin, Share2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import PopupModal from "../components/ui/PopupModal";

interface Job {
  id?: number;
  position_name?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_type?: string;
  contract_details?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  frequency?: string;
  is_remote?: boolean | null;
  company?: {
    name: string;
  };
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
}

const NAVBAR_HEIGHT = 136; // top bar + main navbar

const Page = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/jobs", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        let jobsList: Job[] = [];
        if (Array.isArray(data)) jobsList = data;
        else if (data.results && Array.isArray(data.results)) jobsList = data.results;
        else if (data.data && Array.isArray(data.data)) jobsList = data.data;
        else if (data.jobs && Array.isArray(data.jobs)) jobsList = data.jobs;

        setJobs(jobsList);
        if (jobsList.length > 0) setSelectedJob(jobsList[0]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, "-");
      return formatted
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    }
    return employmentType || "Full-time";
  };

  const formatLocation = (job: Job) => (job.is_remote ? "Remote" : job.country || "On-site");

  const formatSalary = (
  min?: number,
  max?: number,
  currency?: string,
  frequency?: string
) => {
  if (!min && !max) return null;

  const currencyCode = currency || "PHP";

  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const freqText = frequency === "hour" ? " / hour" : " / month";

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}${freqText}`;
  }

  return `${formatter.format(min || max!)}${freqText}`;
};

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  const handleBack = () => setShowDetails(false);

  const handleShare = async () => {
  if (!selectedJob?.id) return;

  const jobUrl = `${window.location.origin}/jobs/${selectedJob.id}`;

  try {
    await navigator.clipboard.writeText(jobUrl);
    setShareModalOpen(true);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

  return (
    <div className="bg-gray-50">
      <Navbar />

      {/* Main container: height = viewport - navbar */}
      <div className="max-w-[1800px] mx-auto mt-[136px] md:flex" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
        {/* Job List */}
        <div className={`${showDetails ? "hidden md:block" : "block"} w-full md:w-[45%] bg-white md:overflow-y-auto scrollbar-hide`}>
          <div className="p-3 sm:p-4">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-lg p-4 m-4">
                <p className="text-red-800 font-medium">Error loading jobs: {error}</p>
                <p className="text-red-600 text-sm mt-1">Make sure your API endpoint is configured correctly</p>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No jobs available at the moment.</p>
              </div>
            )}

            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id
                      ? "bg-indigo-50 shadow-sm ring-2 ring-indigo-500"
                      : "bg-white hover:bg-gray-50 shadow-sm"
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {job.urgently_hiring && (
                        <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mb-2">
                          Urgently hiring
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 hover:underline">
                        {job.position_name || job.title || "Position Title"}
                      </h3>
                    </div>
                  </div>

                  {job.company?.name && (
                    <p className="text-gray-700 font-medium mb-1 text-sm sm:text-base">{job.company.name}</p>
                  )}

                  <p className="text-gray-600 text-sm mb-2">{formatLocation(job)}</p>

                  {formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency) && (
                    <p className="text-gray-800 font-medium text-sm mb-2">
                      {formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-sm mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm">
                      {formatEmploymentType(job.contract_details, job.employment_type)}
                    </span>
                    {job.is_remote && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm">Remote</span>
                    )}
                  </div>

                  {job.easily_apply && (
                    <div className="flex items-center gap-1 text-sm text-indigo-600">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Easily apply</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className={`${showDetails ? "block" : "hidden md:block"} w-full md:flex-1 bg-gray-50 md:overflow-y-auto scrollbar-hide`}>
          {selectedJob ? (
            <div className="p-4 sm:p-6">
              {/* Job Header */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {selectedJob.position_name || selectedJob.title}
                </h1>

                {selectedJob.company?.name && (
                  <a
                    href="#"
                    className="text-indigo-600 hover:underline font-medium text-base sm:text-lg mb-3 inline-block">
                    {selectedJob.company.name}
                  </a>
                )}

                <div className="mb-4 text-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm sm:text-base">{formatLocation(selectedJob)}</p>
                    {selectedJob.is_remote && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Remote</span>
                    )}
                  </div>
                  {formatSalary(
                    selectedJob.salary_min,
                    selectedJob.salary_max,
                    selectedJob.currency,
                    selectedJob.frequency
                  ) && (
                    <p className="font-semibold text-gray-900 text-base sm:text-lg">
                      {formatSalary(
                        selectedJob.salary_min,
                        selectedJob.salary_max,
                        selectedJob.currency,
                        selectedJob.frequency
                      )}
                    </p>
                  )}
                </div>

                {selectedJob.urgently_hiring && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">
                      Responded to 75% or more applications in the past 30 days, typically within 1 day.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
                  <button
                    onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm sm:text-base">
                    Apply now
                  </button>
                  <div className="relative">
                    <button
                      onClick={handleShare}
                      className="p-2.5 bg-white shadow-sm rounded-lg hover:bg-gray-50 transition"
                      aria-label="Share">
                      <Share2 className="w-5 h-5" />
                    </button>

                  <PopupModal
                    open={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    title="Link copied"
                    message="The job link has been copied to your clipboard."
                  />

                  </div>
                </div>
              </div>

              {/* Profile Insights */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Profile insights</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Here's how the job qualifications align with your profile.
                </p>
                <div className="flex items-start gap-3 mb-4">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Education</p>
                    <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs sm:text-sm text-green-700 font-medium">Bachelor's</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Job details</h2>

                <div className="space-y-4 mb-6">
                  {/* Pay */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Pay</p>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {formatSalary(
                          selectedJob.salary_min,
                          selectedJob.salary_max,
                          selectedJob.currency,
                          selectedJob.frequency
                        ) || "Competitive salary"}
                      </p>
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Job type</p>
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs sm:text-sm text-green-700 font-medium">
                            {formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Location</p>
                      <p className="text-gray-700 text-sm sm:text-base">{formatLocation(selectedJob)}</p>
                    </div>
                  </div>
                </div>

                {/* Full Description */}
                <div className="border-t pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Full Job Description</h3>
                  <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
{selectedJob.description ? (
  (() => {
    const text = selectedJob.description.replace(/<[^>]*>/g, "");
    const sections = text.split(/(?=JOB QUALIFICATIONS:|JOB DETAILS:)/);
    
    return sections.map((section, sectionIdx) => {
      if (!section.trim()) return null;
      
      // Check if this is a section header
      if (section.startsWith('JOB QUALIFICATIONS:') || section.startsWith('JOB DETAILS:')) {
        const headerMatch = section.match(/^(JOB QUALIFICATIONS:|JOB DETAILS:)/);
        const header = headerMatch ? headerMatch[0] : '';
        const content = section.replace(header, '').trim();
        
        // Split by capital letters followed by at least 3 letters
        const items = content
          .split(/(?=[A-Z][a-z]{2,})/)
          .map(item => item.trim())
          .filter(item => {
            const wordCount = item.split(/\s+/).length;
            return wordCount >= 5; // Only keep items with 5 or more words
          });
        
        return (
          <div key={sectionIdx} className="mb-6">
            <p className="font-bold mb-2">{header}</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {items.map((item, idx) => (
                <li key={idx} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        );
      }
      
      return <p key={sectionIdx}>{section}</p>;
    });
  })()
) : (
  <p className="italic text-gray-400">No description available.</p>
)}
                  </div>
                </div>

                {/* Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm sm:text-base">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a job to view details</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default Page;