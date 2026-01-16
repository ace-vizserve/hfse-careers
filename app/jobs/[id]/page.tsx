"use client"
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface JobDetail {
  id: number
  position_name: string
  location: string
  employment_type: string
  description: string
  company?: { name: string }
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/jobs/${jobId}`)
        if (!res.ok) throw new Error('Failed to load job')
        const data = await res.json()
        setJob(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    if (jobId) fetchJob()
  }, [jobId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-6">{error || "Job not found"}</p>
          <Link 
            href="/Hero"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            href="/Hero"
            className="text-white/80 hover:text-white mb-8 inline-flex items-center gap-2 text-lg"
          >
            ← Back to all jobs
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {job.position_name}
          </h1>

          <div className="flex flex-wrap gap-6 text-white/90 text-lg">
            <div>📍 {job.location || 'Not specified'}</div>
            <div>💼 {job.employment_type || 'Full-time'}</div>
            {job.company?.name && <div>🏢 {job.company.name}</div>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-10 prose max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: job.description || '' }} />
          </div>

          <div className="text-center bg-white rounded-xl shadow-sm p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to Apply?
            </h2>
            <Link
              href={`/jobs/${jobId}/apply`}
              className="inline-block px-10 py-4 bg-indigo-700 text-white font-semibold text-lg rounded-lg hover:bg-indigo-800 transition shadow-md hover:shadow-lg"
            >
              Apply for this position →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}