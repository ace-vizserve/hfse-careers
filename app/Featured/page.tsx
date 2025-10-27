"use client"

import React from 'react'
import { Settings, Calculator, FileText, LucideIcon, Users, Headphones, Laptop, TrendingUp } from 'lucide-react'

// Featured careers - curated job listings
const featuredJobs = [
  {
    icon: FileText,
    title: "Compliance Administration Assistant | WFO | Entec",
    location: "Philippines - Angeles (WFO)",
    timeAgo: "an hour ago",
    iconBgColor: "bg-green-50",
    iconColor: "text-green-500"
  },
  {
    icon: Settings,
    title: "Configuration Analyst",
    location: "Philippines - Ortigas, Angeles (WFO)",
    timeAgo: "8 hours ago",
    iconBgColor: "bg-green-50",
    iconColor: "text-green-500"
  },
  {
    icon: Calculator,
    title: "TAX ACCOUNTANT",
    location: "Philippines (WFH)",
    timeAgo: "9 hours ago",
    iconBgColor: "bg-red-50",
    iconColor: "text-red-500"
  },
  {
    icon: Calculator,
    title: "Accounts Receivable | WFO | ENTEC",
    location: "Philippines - Angeles (WFO)",
    timeAgo: "2 days ago",
    iconBgColor: "bg-red-50",
    iconColor: "text-red-500"
  }
]

// Newest job listings
const newestJobs = [
  {
    icon: Headphones,
    title: "Customer Support Specialist | WFH",
    location: "Philippines (WFH)",
    timeAgo: "30 minutes ago",
    iconBgColor: "bg-blue-50",
    iconColor: "text-blue-500"
  },
  {
    icon: Laptop,
    title: "Software Developer | Full Stack",
    location: "Philippines - Makati (Hybrid)",
    timeAgo: "2 hours ago",
    iconBgColor: "bg-purple-50",
    iconColor: "text-purple-500"
  },
  {
    icon: Users,
    title: "HR Coordinator | WFO | BGC",
    location: "Philippines - BGC (WFO)",
    timeAgo: "4 hours ago",
    iconBgColor: "bg-orange-50",
    iconColor: "text-orange-500"
  },
  {
    icon: TrendingUp,
    title: "Business Analyst | Remote",
    location: "Philippines (WFH)",
    timeAgo: "6 hours ago",
    iconBgColor: "bg-teal-50",
    iconColor: "text-teal-500"
  }
]

interface JobCardProps {
  icon: LucideIcon
  title: string
  location: string
  timeAgo: string
  iconBgColor: string
  iconColor: string
}

const JobCard = ({ icon: Icon, title, location, timeAgo, iconBgColor, iconColor }: JobCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center mb-6`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-6 min-h-[64px]">
        {title}
      </h3>
      
      <div className="mb-6 mt-auto">
        <p className="text-blue-500 font-medium mb-2">{location}</p>
        <p className="text-gray-400 text-sm">{timeAgo}</p>
      </div>
      
      <button className="w-full bg-cyan-400 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-full transition-colors">
        Apply
      </button>
    </div>
  )
}

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'featured' | 'newest'>('featured')

  // Get the appropriate jobs based on active tab
  const jobs = activeTab === 'featured' ? featuredJobs : newestJobs

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 justify-center mb-8">
          <button 
            onClick={() => setActiveTab('featured')}
            className={`font-medium py-2 px-6 rounded-full transition-colors ${
              activeTab === 'featured' 
                ? 'bg-cyan-400 text-white' 
                : 'bg-blue-100 text-blue-500'
            }`}
          >
            Featured Careers
          </button>
          <button 
            onClick={() => setActiveTab('newest')}
            className={`font-medium py-2 px-6 rounded-full transition-colors ${
              activeTab === 'newest' 
                ? 'bg-cyan-400 text-white' 
                : 'bg-blue-100 text-blue-500'
            }`}
          >
            Newest Listing
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobs.map((job, index) => (
            <JobCard key={index} {...job} />
          ))}
        </div>
      </div>
    </div>
  )
}