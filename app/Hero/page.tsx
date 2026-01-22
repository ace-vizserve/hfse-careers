"use client";
import { BookOpen, Briefcase, CheckCircle, DollarSign, Loader2, Mail, MapPin, Share2, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  org_logo: string;
  org_name: string;
  org_website: string;
}

interface FilterOptions {
  location: string;
  employmentType: string;
  isRemote: boolean | null;
}

const NAVBAR_HEIGHT = 136;

const Page = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    employmentType: "",
    isRemote: null,
  });

  // Helper functions - defined before useMemo
  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, "-");
      return formatted
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    }
    return employmentType || "Full-Time";
  };

  const formatLocation = (job: Job) => (job.is_remote ? "Remote" : job.country || "On-site");

  const formatSalary = (min?: number, max?: number, currency?: string, frequency?: string) => {
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

  console.log(jobs);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        const title = (job.position_name || job.title || "").toLowerCase();
        const company = (job.company?.name || "").toLowerCase();
        const location = (job.country || job.city || "").toLowerCase();
        const description = (job.description || "").toLowerCase();

        return (
          title.includes(query) || company.includes(query) || location.includes(query) || description.includes(query)
        );
      });
    }

    // Apply location filter
    if (filters.location.trim()) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter((job) => {
        const country = (job.country || "").toLowerCase();
        const city = (job.city || "").toLowerCase();
        const state = (job.state || "").toLowerCase();

        return (
          country.includes(locationQuery) ||
          city.includes(locationQuery) ||
          state.includes(locationQuery) ||
          (job.is_remote === true && locationQuery.includes("remote"))
        );
      });
    }

    // Apply employment type filter
    if (filters.employmentType) {
      filtered = filtered.filter((job) => {
        const jobType = formatEmploymentType(job.contract_details, job.employment_type);
        return jobType === filters.employmentType;
      });
    }

    // Apply remote filter
    if (filters.isRemote !== null) {
      filtered = filtered.filter((job) => {
        // When filtering for remote jobs
        if (filters.isRemote === true) {
          return job.is_remote === true;
        }
        // When filtering for on-site jobs
        if (filters.isRemote === false) {
          return job.is_remote === false || job.is_remote === null;
        }
        return true;
      });
    }

    return filtered;
  }, [jobs, searchQuery, filters]);

  // Update selected job when filtered jobs change
  useEffect(() => {
    if (filteredJobs.length > 0 && !filteredJobs.find((j) => j.id === selectedJob?.id)) {
      setSelectedJob(filteredJobs[0]);
    } else if (filteredJobs.length === 0) {
      setSelectedJob(null);
    }
  }, [filteredJobs]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="bg-gray-50">
      <Navbar onSearch={handleSearch} onFilterChange={handleFilterChange} />

      {/* Main container */}
      <div className="max-w-[1800px] mx-auto mt-[136px] md:flex" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
        {/* Job List */}
        <div
          className={`${showDetails ? "hidden md:block" : "block"} w-full md:w-[45%] bg-white md:overflow-y-auto scrollbar-hide`}>
          <div className="p-3 sm:p-4">
            {/* Results count */}
            {!loading && !error && (
              <div className="mb-4 px-2">
                <p className="text-sm text-gray-600">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found
                  {(searchQuery || filters.location || filters.employmentType || filters.isRemote !== null) && (
                    <span className="font-medium"> (filtered)</span>
                  )}
                </p>
              </div>
            )}

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

            {!loading && !error && filteredJobs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-2">No jobs match your criteria</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id
                      ? "bg-indigo-50 shadow-sm ring-2 ring-indigo-500"
                      : "bg-white hover:bg-gray-50 shadow-sm"
                  }`}>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Logo */}
                    {job.org_logo && (
                      <div className="flex-shrink-0 rounded-lg border bg-white p-2">
                        <Image
                          src={job.org_logo}
                          alt={job.org_name}
                          width={36}
                          height={36}
                          className="object-contain"
                        />
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      {job.urgently_hiring && (
                        <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full mb-2">
                          🚀 Urgently hiring
                        </span>
                      )}

                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight truncate">
                        {job.position_name || job.title || "Position Title"}
                      </h3>

                      {job.org_name && (
                        <a
                          target="_blank"
                          href={job.org_website}
                          className="mt-0.5 text-indigo-600 hover:underline font-medium text-sm sm:text-base truncate">
                          {job.org_name}
                        </a>
                      )}
                    </div>
                  </div>

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
        <div
          className={`${showDetails ? "block" : "hidden md:block"} w-full md:flex-1 bg-gray-50 md:overflow-y-auto scrollbar-hide`}>
          {selectedJob ? (
            <div className="p-4 sm:p-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  {selectedJob.org_logo && (
                    <div className="flex-shrink-0 rounded-lg border bg-white p-2">
                      <Image
                        src={selectedJob.org_logo}
                        alt={selectedJob.org_name}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      {selectedJob.position_name || selectedJob.title}
                    </h1>

                    {selectedJob.org_name && (
                      <a
                        target="_blank"
                        href={selectedJob.org_website}
                        className="inline-block mt-1 text-indigo-600 hover:underline font-medium text-base sm:text-lg">
                        {selectedJob.org_name}
                      </a>
                    )}
                  </div>
                </div>

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
                    selectedJob.frequency,
                  ) && (
                    <p className="font-semibold text-gray-900 text-base sm:text-lg">
                      {formatSalary(
                        selectedJob.salary_min,
                        selectedJob.salary_max,
                        selectedJob.currency,
                        selectedJob.frequency,
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
                          selectedJob.frequency,
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

                          if (section.startsWith("JOB QUALIFICATIONS:") || section.startsWith("JOB DETAILS:")) {
                            const headerMatch = section.match(/^(JOB QUALIFICATIONS:|JOB DETAILS:)/);
                            const header = headerMatch ? headerMatch[0] : "";
                            const content = section.replace(header, "").trim();

                            const items = content
                              .split(/(?=[A-Z][a-z]{2,})/)
                              .map((item) => item.trim())
                              .filter((item) => {
                                const wordCount = item.split(/\s+/).length;
                                return wordCount >= 5;
                              });

                            return (
                              <div key={sectionIdx} className="mb-6">
                                <p className="font-bold mb-2">{header}</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                  {items.map((item, idx) => (
                                    <li key={idx} className="text-gray-700">
                                      {item}
                                    </li>
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
              <p className="text-gray-500">
                {filteredJobs.length === 0 &&
                (searchQuery || filters.location || filters.employmentType || filters.isRemote !== null)
                  ? "No jobs match your search criteria"
                  : "Select a job to view details"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Page;
