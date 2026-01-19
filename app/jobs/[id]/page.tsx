"use client"
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Briefcase, Building2, Clock, Calendar, Send, CheckCircle2, DollarSign } from 'lucide-react'

interface JobDetail {
  id: number
  position_name: string
  location: string
  employment_type: string
  contract_details?: string
  description: string
  salary_min?: number
  salary_max?: number
  currency?: string
  frequency?: string
  company?: { name: string }
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // ADD THIS HELPER FUNCTION
  const renderJobDescription = (description: string) => {
    const text = description.replace(/<[^>]*>/g, "");
    const sections = text.split(/(?=JOB QUALIFICATIONS:|JOB DETAILS:)/);

    return sections.map((section, sectionIdx) => {
      if (!section.trim()) return null;

      if (section.startsWith('JOB QUALIFICATIONS:') || section.startsWith('JOB DETAILS:')) {
        const headerMatch = section.match(/^(JOB QUALIFICATIONS:|JOB DETAILS:)/);
        const header = headerMatch ? headerMatch[0] : '';
        const content = section.replace(header, '').trim();

        const items = content
          .split(/(?=[A-Z][a-z]{2,})/)
          .map(item => item.trim())
          .filter(item => {
            const wordCount = item.split(/\s+/).length;
            return wordCount >= 5;
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

      return <p key={sectionIdx} className="text-gray-700 mb-2">{section}</p>;
    });
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">⚠</span>
          </div>
          <p className="text-red-600 text-xl mb-6 font-semibold">{error || "Job not found"}</p>
          <Link 
            href="/Hero"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <Link 
            href="/Hero"
            className="text-white/80 hover:text-white mb-8 inline-flex items-center gap-2 text-base font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all jobs
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
            {job.position_name}
          </h1>

          <div className="flex flex-wrap gap-4 md:gap-6">
            {job.location && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg text-white border border-white/20">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{job.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg text-white border border-white/20">
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">{formatEmploymentType(job.contract_details, job.employment_type)}</span>
            </div>
            
            {formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency) && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg text-white border border-white/20">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">{formatSalary(job.salary_min, job.salary_max, job.currency, job.frequency)}</span>
              </div>
            )}
            
            {job.company?.name && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg text-white border border-white/20">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{job.company.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Job Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 mb-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
            </div>
            
            {/* REPLACE dangerouslySetInnerHTML with renderJobDescription */}
            <div className="text-gray-700">
              {renderJobDescription(job.description || '')}
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Application Process</h3>
                  <p className="text-gray-600 text-sm">We review applications on a rolling basis and will contact qualified candidates within 5-7 business days.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">What to Expect</h3>
                  <p className="text-gray-600 text-sm">Our hiring process includes an initial screening, technical interview, and final conversation with the team.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Apply CTA */}
          <div className="text-center bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-2xl shadow-lg p-10 md:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to Apply?
              </h2>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Take the next step in your career. We're excited to learn more about you!
              </p>
              
              <Link
                href={`/jobs/${jobId}/apply`}
                className="inline-flex items-center gap-2 px-10 py-4 bg-white text-indigo-700 font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Apply for this position
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}