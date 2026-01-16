<<<<<<< HEAD
"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Loader2,
  Mail,
  Share2,
  BookOpen,
  DollarSign,
  Briefcase,
  CheckCircle,
  Zap,
  MapPin
} from 'lucide-react'
import Navbar from '../components/navbar'

interface Job {
  id?: number
  position_name?: string
  title?: string
  location?: string
  city?: string
  state?: string
  country?: string
  employment_type?: string
  contract_details?: string
  description?: string
  salary_min?: number
  salary_max?: number
  currency?: string
  frequency?: string
  is_remote?: boolean | null
  company?: {
    name: string
  }
  requirements?: string[]
  benefits?: string[]
  urgently_hiring?: boolean
  easily_apply?: boolean
=======
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  company?: { name: string };
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
>>>>>>> 012ee74 (chore: apply some changes)
}

const NAVBAR_HEIGHT = 136 // top bar + main navbar

const Page = () => {
<<<<<<< HEAD
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
=======
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
>>>>>>> 012ee74 (chore: apply some changes)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
<<<<<<< HEAD
        setLoading(true)
        const response = await fetch('/api/jobs', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Failed to fetch jobs')
        const data = await response.json()
        let jobsList: Job[] = []
        if (Array.isArray(data)) jobsList = data
        else if (data.results && Array.isArray(data.results)) jobsList = data.results
        else if (data.data && Array.isArray(data.data)) jobsList = data.data
        else if (data.jobs && Array.isArray(data.jobs)) jobsList = data.jobs

        setJobs(jobsList)
        if (jobsList.length > 0) setSelectedJob(jobsList[0])
        setLoading(false)
=======
        setLoading(true);
        const response = await fetch("/api/jobs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }

        const data = await response.json();

        let jobsList: Job[] = [];
        if (Array.isArray(data)) {
          jobsList = data;
        } else if (data.results && Array.isArray(data.results)) {
          jobsList = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          jobsList = data.data;
        } else if (data.jobs && Array.isArray(data.jobs)) {
          jobsList = data.jobs;
        }

        setJobs(jobsList);
        if (jobsList.length > 0) {
          setSelectedJob(jobsList[0]);
        }
        setLoading(false);
>>>>>>> 012ee74 (chore: apply some changes)
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
<<<<<<< HEAD
    }
    fetchJobs()
  }, [])

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, '-')
      return formatted
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-')
=======
    };

    fetchJobs();
  }, []);

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, "-");
      return formatted
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
>>>>>>> 012ee74 (chore: apply some changes)
    }
    return employmentType || "Full-time";
  };

<<<<<<< HEAD
  const formatLocation = (job: Job) => (job.is_remote ? 'Remote' : job.country || 'On-site')

  const formatSalary = (min?: number, max?: number, currency?: string, frequency?: string) => {
    const currencyCode = currency || 'PHP'
    const freqText = frequency === 'hour' ? 'an hour' : 'a month'
    if (min && max) return `${currencyCode} ${min.toLocaleString()} - ${currencyCode} ${max.toLocaleString()} ${freqText}`
    return null
  }
=======
  const formatLocation = (job: Job) => {
    if (job.is_remote) {
      return "Remote";
    }
    return job.country || "On-site";
  };

  const getCompanyName = (job: Job) => {
    if (job.company?.name) {
      return job.company.name;
    }
    return job.is_remote ? "Remote" : "On-site";
  };

  const formatSalary = (min?: number, max?: number, currency?: string, frequency?: string) => {
    const currencyCode = currency || "PHP";
    const freq = frequency || "month";
    const freqText = freq === "hour" ? "an hour" : "a month";

    if (min && max) {
      return `${currencyCode} ${min.toLocaleString()} - ${currencyCode} ${max.toLocaleString()} ${freqText}`;
    }
    return null;
  };
>>>>>>> 012ee74 (chore: apply some changes)

  const handleJobClick = (job: Job) => {
    setSelectedJob(job)
    setShowDetails(true)
  }

  const handleBack = () => setShowDetails(false)

  return (
    <div className="bg-gray-50">
      <Navbar />

      {/* Main container: height = viewport - navbar */}
      <div
        className="max-w-[1800px] mx-auto mt-[136px] md:flex"
        style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
      >
        {/* Job List */}
        <div
          className={`${showDetails ? 'hidden md:block' : 'block'} w-full md:w-[45%] bg-white md:overflow-y-auto`}
        >
          <div className="p-3 sm:p-4">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-lg p-4 m-4">
                <p className="text-red-800 font-medium">Error loading jobs: {error}</p>
                <p className="text-red-600 text-sm mt-1">
                  Make sure your API endpoint is configured correctly
                </p>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No jobs available at the moment.</p>
              </div>
            )}

<<<<<<< HEAD
            <div className="space-y-3">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id
                      ? 'bg-indigo-50 shadow-sm ring-2 ring-indigo-500'
                      : 'bg-white hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {job.urgently_hiring && (
                        <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mb-2">
                          Urgently hiring
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 hover:underline">
                        {job.position_name || job.title || 'Position Title'}
                      </h3>
=======
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {job.urgently_hiring && (
                          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mb-2">
                            Urgently hiring
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:underline">
                          {job.position_name || job.title || "Position Title"}
                        </h3>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (job.id) toggleSaveJob(job.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Save job">
                          <svg
                            className={`w-5 h-5 ${savedJobs.has(job.id!) ? "fill-indigo-600" : "fill-none"}`}
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Not interested">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {job.company?.name && <p className="text-gray-700 font-medium mb-1">{job.company.name}</p>}
                    <p className="text-gray-600 text-sm mb-2">{formatLocation(job)}</p>

                    {formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency) && (
                      <p className="text-gray-800 font-medium text-sm mb-2">
                        {formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm mb-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {formatEmploymentType(job.contract_details, job.employment_type)}
                      </span>
                      {job.is_remote && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Remote</span>}
>>>>>>> 012ee74 (chore: apply some changes)
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
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm">
                        Remote
                      </span>
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

<<<<<<< HEAD
        {/* Job Details */}
        <div
          className={`${showDetails ? 'block' : 'hidden md:block'} w-full md:flex-1 bg-gray-50 md:overflow-y-auto`}
        >
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
                    className="text-indigo-600 hover:underline font-medium text-base sm:text-lg mb-3 inline-block"
                  >
                    {selectedJob.company.name}
                  </a>
                )}

                <div className="mb-4 text-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm sm:text-base">{formatLocation(selectedJob)}</p>
                    {selectedJob.is_remote && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        Remote
                      </span>
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
=======
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {selectedJob ? (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-4 border border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedJob.position_name || selectedJob.title}
                  </h1>
                  {selectedJob.company?.name && (
                    <a href="#" className="text-indigo-600 hover:underline font-medium text-lg mb-3 inline-block">
                      {selectedJob.company.name}
                    </a>
                  )}

                  <div className="mb-4 text-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <p>{formatLocation(selectedJob)}</p>
                      {selectedJob.is_remote && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                          Remote
                        </span>
                      )}
                    </div>
                    {formatSalary(
                      selectedJob.salary_min,
                      selectedJob.salary_max,
                      selectedJob.currency,
                      selectedJob.frequency
                    ) && (
                      <p className="font-semibold text-gray-900 text-lg">
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
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Responded to 75% or more applications in the past 30 days, typically within 1 day.</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button
                      onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm">
                      Apply now
                    </button>
                    <button
                      onClick={() => selectedJob.id && toggleSaveJob(selectedJob.id)}
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Save job">
                      <svg
                        className={`w-5 h-5 ${savedJobs.has(selectedJob.id!) ? "fill-indigo-600" : "fill-none"}`}
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                    <button
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Not interested">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                    <button
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Share">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>
                  </div>
>>>>>>> 012ee74 (chore: apply some changes)
                </div>

                {selectedJob.urgently_hiring && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">
                      Responded to 75% or more applications in the past 30 days, typically within 1 day.
                    </span>
                  </div>
                )}

<<<<<<< HEAD
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
                  <button
                    onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm sm:text-base"
                  >
                    Apply now
                  </button>
                  <button className="p-2.5 bg-white shadow-sm rounded-lg hover:bg-gray-50 transition" aria-label="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
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
                        ) || 'Competitive salary'}
                      </p>
=======
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Education</p>
                      <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Bachelor's</span>
                      </div>
>>>>>>> 012ee74 (chore: apply some changes)
                    </div>
                  </div>

<<<<<<< HEAD
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
=======
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Job details</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-gray-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Pay</p>
                        <p className="text-gray-700">
                          {formatSalary(
                            selectedJob.salary_min,
                            selectedJob.salary_max,
                            selectedJob.currency,
                            selectedJob.frequency
                          ) || "Competitive salary"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-gray-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Job type</p>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm text-green-700 font-medium">
                              {formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                            </span>
                          </div>
                          {selectedJob.is_remote && (
                            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm text-blue-700 font-medium">Remote</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-gray-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Location</p>
                        <p className="text-gray-700">{formatLocation(selectedJob)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Job Description</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: selectedJob.description?.replace(/<[^>]*>/g, "") || "No description available",
                      }}
                    />
                  </div>

                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {selectedJob.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.benefits.map((benefit, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
>>>>>>> 012ee74 (chore: apply some changes)
                </div>

                {/* Full Description */}
                <div className="border-t pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Full Job Description</h3>
                  <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                    {selectedJob.description
                      ? selectedJob.description
                          .replace(/<[^>]*>/g, '')
                          .split(/\n+/)
                          .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
                      : <p className="italic text-gray-400">No description available.</p>}
                  </div>
                </div>

                {/* Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm sm:text-base">
                      {selectedJob.requirements.map((req, idx) => <li key={idx}>{req}</li>)}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((benefit, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
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
    </div>
  );
};

<<<<<<< HEAD
export default Page
=======
export default Page;
>>>>>>> 012ee74 (chore: apply some changes)
