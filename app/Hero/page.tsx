"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

interface Job {
  id?: number
  position_name?: string
  title?: string
  location?: string
  employment_type?: string
  description?: string
}

const Page = () => {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch jobs from Manatal API
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
        
        // Handle different possible response structures
        let jobsList = []
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
        setLoading(false)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const talents = [
    {
      img: '/assets/talent-accounting.png',
      title: 'Accounting & Taxation',
      desc: 'Hire top accounting professionals skilled in leading software, regulations, and industry practices. Ready Talent connects you with the perfect match for your needs.'
    },
    {
      img: '/assets/talent-accounting.png',
      title: 'IT & Development',
      desc: 'From software engineers to system admins, find skilled IT professionals ready to elevate your digital infrastructure.'
    },
    {
      img: '/assets/talent-accounting.png',
      title: 'Marketing & Creative',
      desc: 'Engage audiences and grow your brand with creative minds experienced in strategy, design, and digital marketing.'
    },
    {
      img: '/assets/talent-accounting.png',
      title: 'HR & Recruitment',
      desc: 'Connect with HR professionals who can streamline hiring, boost engagement, and build high-performing teams.'
    },
    {
      img: '/assets/talent-accounting.png',
      title: 'Admin & Support',
      desc: 'Reliable administrative staff to keep operations running smoothly — from virtual assistants to office managers.'
    },
    {
      img: '/assets/talent-accounting.png',
      title: 'Sales & Customer Service',
      desc: 'Hire persuasive sales experts and customer support representatives who drive growth and satisfaction.'
    }
  ]

  const perfectMatches = [
    {
      img: '/assets/match-1.png',
      title: 'Collaborative Teams',
      desc: 'Empower your organization with high-performing teams built on trust, collaboration, and shared goals. We connect the right talents to achieve extraordinary results together.'
    },
    {
      img: '/assets/match-2.png',
      title: 'Tailored Talent Matching',
      desc: 'We go beyond resumes—our smart matching process ensures each team member complements the others\' strengths, creating a balanced and productive workforce.'
    },
    {
      img: '/assets/match-3.png',
      title: 'Sustainable Growth',
      desc: 'Build teams that grow with your business. Our approach focuses on long-term success through engagement, alignment, and continuous development.'
    }
  ]

  return (
    <div>
      <div className="mb-20 sm:mb-24 md:mb-32 lg:mb-35">
        <Navbar />
      </div>
      
      {/* Hero Section */}
      <div className="bg-white pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-blue-600 font-semibold text-lg mb-2">
                  Ready Talent
                </h2>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Workforce solutions that move with you
                </h1>
              </div>

              <p className="text-gray-600 text-lg">
                Top talent, zero hassle. Exactly what your team deserves.
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-2.5 bg-[#312B66] text-white rounded-lg font-semibold hover:bg-indigo-800 active:bg-indigo-900 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2">
                  Team builder
                </button>
                <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                  Talk to Sales
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative w-full h-full">
              <img
                src="/assets/landing.png"
                alt="Team meeting"
                className="w-full h-full object-cover rounded-2xl"
              />

              {/* Decorative elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Job Openings from Manatal */}
      <div className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#4359A5] mb-4">
              Current Job Openings
            </h2>
            <div className="flex justify-center">
              <div className="border-b-4 border-[#4359A5] w-32"></div>
            </div>
            <p className="text-gray-600 mt-4 text-lg">
              Browse our latest opportunities
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4359A5]"></div>
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Error loading jobs: {error}</p>
              <p className="text-sm text-gray-600 mt-2">Make sure your API endpoint is configured correctly</p>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              No jobs available at the moment.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <div 
                key={job.id || index} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {job.position_name || job.title || 'Position Title'}
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location || 'Location not specified'}
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {job.employment_type || 'Full-time'}
                  </p>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-3">
                  {job.description?.replace(/<[^>]*>/g, '').substring(0, 150) || 'No description available'}
                  {job.description && job.description.length > 150 && '...'}
                </p>
                <button 
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="w-full bg-[#312B66] text-white py-2 rounded-lg hover:bg-indigo-800 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Don't Wait Section */}
      <div className="bg-[#4359A5] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Don't wait
            </h2>
            <div className="flex justify-center">
              <div className="border-b-4 border-white w-32"></div>
            </div>
            <p className="text-white mt-4 text-lg">
              Our talent pool is updated weekly and in demand.
            </p>
          </div>

          {/* Talent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {talents.map((talent, index) => (
              <div key={index} className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-white">
                    <img
                      src={talent.img}
                      alt={talent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {talent.title}
                </h3>
                <p className="text-white text-sm leading-relaxed">
                  {talent.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg shadow-lg">
              Click to access Talents
            </button>
          </div>
        </div>
      </div>

      {/* Get the Perfect Match Section */}
      <div className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#4A5BA8] mb-4">
              Get the perfect match for lasting business success
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {perfectMatches.map((match, index) => (
              <div key={index} className="bg-[#4A5BA8] rounded-3xl p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={match.img}
                      alt={match.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {match.title}
                </h3>
                <p className="text-white text-sm leading-relaxed">
                  {match.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Page