"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  company?: { name: string }
  requirements?: string[]
  benefits?: string[]
  urgently_hiring?: boolean
  easily_apply?: boolean
}

const Page = () => {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/jobs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }

        const data = await response.json()
        
        let jobsList: Job[] = []
        if (Array.isArray(data)) {
          jobsList = data
        } else if (data.results && Array.isArray(data.results)) {
          jobsList = data.results
        } else if (data.data && Array.isArray(data.data)) {
          jobsList = data.data
        } else if (data.jobs && Array.isArray(data.jobs)) {
          jobsList = data.jobs
        }

        setJobs(jobsList)
        if (jobsList.length > 0) {
          setSelectedJob(jobsList[0])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const formatEmploymentType = (contractDetails?: string, employmentType?: string) => {
    if (contractDetails) {
      const formatted = contractDetails.replace(/_/g, '-')
      return formatted.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('-')
    }
    return employmentType || 'Full-time'
  }

  const formatLocation = (job: Job) => {
    if (job.is_remote) {
      return 'Remote'
    }
    return job.country || 'On-site'
  }

  const getCompanyName = (job: Job) => {
    if (job.company?.name) {
      return job.company.name
    }
    return job.is_remote ? 'Remote' : 'On-site'
  }

  const formatSalary = (min?: number, max?: number, currency?: string, frequency?: string) => {
    const currencyCode = currency || 'PHP'
    const freq = frequency || 'month'
    const freqText = freq === 'hour' ? 'an hour' : 'a month'
    
    if (min && max) {
      return `${currencyCode} ${min.toLocaleString()} - ${currencyCode} ${max.toLocaleString()} ${freqText}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Jobs for you</h1>
          <p className="text-sm text-gray-600 mt-1">Jobs based on your activity on Indeed</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <div className="flex h-[calc(100vh-100px)]">
          <div className="w-[45%] border-r bg-white overflow-y-auto">
            <div className="p-4">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
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
                    onClick={() => setSelectedJob(job)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id 
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {job.urgently_hiring && (
                          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mb-2">
                            Urgently hiring
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:underline">
                          {job.position_name || job.title || 'Position Title'}
                        </h3>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (job.id) toggleSaveJob(job.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Save job"
                        >
                          <svg 
                            className={`w-5 h-5 ${savedJobs.has(job.id!) ? 'fill-indigo-600' : 'fill-none'}`}
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Not interested"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {job.company?.name && (
                      <p className="text-gray-700 font-medium mb-1">
                        {job.company.name}
                      </p>
                    )}
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
                      {job.is_remote && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Remote
                        </span>
                      )}
                    </div>

                    {job.easily_apply && (
                      <div className="flex items-center gap-1 text-sm text-indigo-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="font-medium">Easily apply</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {selectedJob ? (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-4 border border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedJob.position_name || selectedJob.title}
                  </h1>
                  {selectedJob.company?.name && (
                    <a 
                      href="#"
                      className="text-indigo-600 hover:underline font-medium text-lg mb-3 inline-block"
                    >
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
                    {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency, selectedJob.frequency) && (
                      <p className="font-semibold text-gray-900 text-lg">
                        {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency, selectedJob.frequency)}
                      </p>
                    )}
                  </div>

                  {selectedJob.urgently_hiring && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span>Responded to 75% or more applications in the past 30 days, typically within 1 day.</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button
                      onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                      Apply now
                    </button>
                    <button
                      onClick={() => selectedJob.id && toggleSaveJob(selectedJob.id)}
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Save job"
                    >
                      <svg 
                        className={`w-5 h-5 ${savedJobs.has(selectedJob.id!) ? 'fill-indigo-600' : 'fill-none'}`}
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Not interested"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      aria-label="Share"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-4 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Profile insights</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Here's how the job qualifications align with your profile.
                  </p>

                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Education</p>
                      <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Bachelor's</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Job details</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Pay</p>
                        <p className="text-gray-700">
                          {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency, selectedJob.frequency) || 'Competitive salary'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Job type</p>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-green-700 font-medium">
                              {formatEmploymentType(selectedJob.contract_details, selectedJob.employment_type)}
                            </span>
                          </div>
                          {selectedJob.is_remote && (
                            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-blue-700 font-medium">Remote</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                        __html: selectedJob.description?.replace(/<[^>]*>/g, '') || 'No description available' 
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
                          <span 
                            key={idx}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
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
                <p className="text-gray-500 text-lg">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page