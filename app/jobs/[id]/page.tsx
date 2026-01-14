"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface JobDetail {
  id: number
  position_name: string
  location: string
  employment_type: string
  description: string
  responsibilities?: string
  requirements?: string
  qualifications?: string
  status: string
  created_at: string
  company?: { name: string }
}

interface FormField {
  id: string
  slug?: string
  name?: string
  label: string
  type: string
  is_required?: boolean
  required?: boolean
  field_category?: string
  options?: string[]
  placeholder?: string
}

interface Experience {
  position_name: string
  employer: string
  salary?: string
  currency?: string
  frequency?: string
  start_date: string
  end_date?: string | null
  currently_work_here: boolean
  location: string
  description: string
}

interface Education {
  school: string
  degree: string
  specialization?: string
  start_date: string
  end_date?: string | null
  final_grade?: string
  grade_type?: string
  location: string
  description?: string
}

const JobApplicationForm = () => {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [simpleFormData, setSimpleFormData] = useState<Record<string, string | File>>({})
  
  // Add currency state for expected salary - store per field ID
  const [salaryCurrencies, setSalaryCurrencies] = useState<Record<string, string>>({})
  
  const [experiences, setExperiences] = useState<Experience[]>([{
    position_name: '',
    employer: '',
    salary: '',
    currency: '',
    frequency: '',
    start_date: '',
    end_date: null,
    currently_work_here: false,
    location: '',
    description: ''
  }])

  const [educations, setEducations] = useState<Education[]>([{
    school: '',
    degree: '',
    specialization: '',
    start_date: '',
    end_date: null,
    final_grade: '',
    grade_type: 'GPA',
    location: '',
    description: ''
  }])

  const defaultFields: FormField[] = [
    { id: 'full_name', slug: 'full_name', label: 'Full Name', type: 'text', required: true },
    { id: 'email', slug: 'email', label: 'Email Address', type: 'email', required: true },
    { id: 'phone', slug: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { id: 'linkedin', slug: 'linkedin', label: 'LinkedIn Profile', type: 'url', required: false },
    { id: 'resume', slug: 'resume', label: 'Resume/CV', type: 'file', required: true },
    { id: 'cover_letter', slug: 'cover_letter', label: 'Cover Letter', type: 'textarea', required: false },
  ]

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        const jobRes = await fetch(`/api/jobs/${jobId}`)
        if (!jobRes.ok) throw new Error('Failed to fetch job')
        const jobData = await jobRes.json()
        setJob(jobData)

        try {
          const fieldsRes = await fetch(`/api/jobs/${jobId}/form-fields`)
          if (fieldsRes.ok) {
            const data = await fieldsRes.json()
            const fields = data.fields?.length > 0 ? data.fields : defaultFields
            setFormFields(fields)

            const initialData: Record<string, string> = {}
            const initialCurrencies: Record<string, string> = {}
            
            fields.forEach((field: FormField) => {
              if (field.type !== 'file') {
                const fieldName = field.slug || field.name || field.id
                initialData[fieldName] = ''
                
                // Initialize currency for salary fields
                const isExpectedSalary = 
                  field.slug?.toLowerCase().includes('expected_salary') ||
                  field.name?.toLowerCase().includes('expected_salary') ||
                  field.slug?.toLowerCase().includes('expectedsalary') ||
                  (field.label?.toLowerCase().includes('expected') &&
                   field.label?.toLowerCase().includes('salary'))
                
                if (isExpectedSalary) {
                  initialCurrencies[field.id] = 'SGD'
                }
              }
            })
            
            setSimpleFormData(initialData)
            setSalaryCurrencies(initialCurrencies)
          } else {
            setFormFields(defaultFields)
          }
        } catch {
          setFormFields(defaultFields)
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    if (jobId) fetchJobDetails()
  }, [jobId])

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSimpleFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSimpleFormData(prev => ({ ...prev, [e.target.name]: file }))
    }
  }

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setExperiences(prev => prev.map((exp, i) => i === index ? { ...exp, [field]: value } : exp))
  }

  const addExperience = () => {
    setExperiences(prev => [...prev, {
      position_name: '',
      employer: '',
      salary: '',
      currency: '',
      frequency: '',
      start_date: '',
      end_date: null,
      currently_work_here: false,
      location: '',
      description: ''
    }])
  }

  const removeExperience = (index: number) => {
    if (experiences.length <= 1) return
    setExperiences(prev => prev.filter((_, i) => i !== index))
  }

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setEducations(prev => prev.map((edu, i) => i === index ? { ...edu, [field]: value } : edu))
  }

  const addEducation = () => {
    setEducations(prev => [...prev, {
      school: '',
      degree: '',
      specialization: '',
      start_date: '',
      end_date: null,
      final_grade: '',
      grade_type: 'GPA',
      location: '',
      description: ''
    }])
  }

  const removeEducation = (index: number) => {
    if (educations.length <= 1) return
    setEducations(prev => prev.filter((_, i) => i !== index))
  }

  const isExperienceField = (field: FormField) => {
    const fieldName = (field.name || '').toLowerCase()
    const fieldSlug = (field.slug || '').toLowerCase()
    return fieldName === 'experiences' || fieldSlug === 'experiences' || 
           field.label?.toLowerCase() === 'experiences' || 
           field.label?.toLowerCase() === 'work experience'
  }

  const isEducationField = (field: FormField) => {
    const fieldName = (field.name || '').toLowerCase()
    const fieldSlug = (field.slug || '').toLowerCase()
    const label = (field.label || '').toLowerCase()
    return fieldName === 'education' || fieldSlug === 'education' || 
           label === 'educational profile' || label === 'education'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      const applicationData: Record<string, any> = {}

      const expField = formFields.find(isExperienceField)
      const eduField = formFields.find(isEducationField)

      formFields.forEach(field => {
        const fieldName = field.slug || field.name || field.id

        if (field.id === expField?.id || field.id === eduField?.id) {
          return
        }

        if (field.type === 'file') return

        const value = simpleFormData[fieldName]
        let finalValue: string | number | null = ''

        if (value && typeof value === 'string' && value.trim()) {
          const isDateField = field.label?.toLowerCase().includes('date') || 
                            field.label?.toLowerCase().includes('birth') || 
                            field.name?.toLowerCase().includes('date')

          const isExpectedSalary = field.slug?.toLowerCase().includes('expected_salary') ||
                                  field.name?.toLowerCase().includes('expected_salary') ||
                                  field.slug?.toLowerCase().includes('expectedsalary') ||
                                  field.slug?.toLowerCase() === 'salary_expected' ||
                                  (field.label?.toLowerCase().includes('expected') && 
                                   field.label?.toLowerCase().includes('salary'))

          if (isExpectedSalary) {
            const cleaned = value.trim().replace(/[^0-9]/g, '')
            if (cleaned && cleaned.length <= 10) {
              const numValue = Number(cleaned)
              const currency = salaryCurrencies[field.id] || 'SGD'
              
              // Store as object with amount and currency
              finalValue = JSON.stringify({
                amount: numValue,
                currency: currency
              })
            }
          } else if (isDateField) {
            finalValue = value.trim()
          } else {
            finalValue = value.trim()
          }
        } else if (field.required || field.is_required) {
          const isDateField = field.label?.toLowerCase().includes('date') || 
                            field.label?.toLowerCase().includes('birth') || 
                            field.name?.toLowerCase().includes('date')
          if (isDateField) {
            finalValue = null
          } else {
            finalValue = ''
          }
        }

        applicationData[field.id] = finalValue
      })

      if (expField) {
        const valid = experiences.filter(e => e.position_name.trim() || e.employer.trim())
        const formatted = valid.map(exp => {
          let cleanSalary: string | undefined = undefined
          if (exp.salary?.trim()) {
            const digitsOnly = exp.salary.trim().replace(/[^0-9]/g, '')
            if (digitsOnly) cleanSalary = digitsOnly
          }

          const expData: any = {
            position_name: exp.position_name.trim(),
            company_name: exp.employer.trim(),
            location: exp.location.trim(),
            start_date: exp.start_date || null,
            end_date: exp.end_date || null,
            currently_working_here: exp.currently_work_here,
            description: exp.description.trim(),
          }

          if (cleanSalary) expData.salary = cleanSalary
          if (exp.currency?.trim()) expData.salary_currency = exp.currency.trim()
          if (exp.frequency?.trim()) expData.salary_frequency = exp.frequency.trim()

          return expData
        })

        if (formatted.length > 0) {
          applicationData[expField.id] = formatted
        }
      }

      if (eduField) {
        const valid = educations.filter(e => e.school.trim() || e.degree.trim())
        const formatted = valid.map(edu => ({
          school_name: edu.school.trim(),
          degree_name: edu.degree.trim(),
          field_of_study: edu.specialization?.trim() || '',
          start_date: edu.start_date || null,
          end_date: edu.end_date || null,
          grade: edu.final_grade?.trim() || '',
          grade_type: edu.grade_type || 'GPA',
          location: edu.location.trim(),
          description: edu.description?.trim() || '',
        }))

        if (formatted.length > 0) {
          applicationData[eduField.id] = formatted
        }
      }

      console.log('Sending application_data:', JSON.stringify(applicationData, null, 2))

      formDataToSend.append('application_data', JSON.stringify(applicationData))

      const resumeFile = simpleFormData.resume || simpleFormData.cv || simpleFormData.file
      if (resumeFile instanceof File) {
        formDataToSend.append('cv', resumeFile)
      }

      formDataToSend.append('jobId', jobId)

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.message || 'Failed to submit application')
      }

      setSubmitSuccess(true)
    } catch (err: any) {
      alert(`Failed to submit application: ${err.message || 'Unknown error'}`)
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const renderSimpleField = (field: FormField) => {
    const common = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    const isRequired = field.is_required ?? field.required ?? false
    const fieldName = field.slug || field.name || field.id

    const isDateField = field.label?.toLowerCase().includes('date') || 
                       field.label?.toLowerCase().includes('birth') || 
                       field.name?.toLowerCase().includes('date')

    const isExpectedSalary = field.slug?.toLowerCase().includes('expected_salary') ||
                            field.name?.toLowerCase().includes('expected_salary') ||
                            field.slug?.toLowerCase().includes('expectedsalary') ||
                            field.slug?.toLowerCase() === 'salary_expected' ||
                            (field.label?.toLowerCase().includes('expected') && 
                             field.label?.toLowerCase().includes('salary'))

    if (field.type === 'file') {
      return (
        <div>
          <input
            type="file"
            name={fieldName}
            required={isRequired}
            onChange={handleFileChange}
            className={common}
          />
          {simpleFormData[fieldName] instanceof File && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {(simpleFormData[fieldName] as File).name}
            </p>
          )}
        </div>
      )
    }

    if (field.type === 'textarea' || field.type === 'longtext') {
      return (
        <textarea
          name={fieldName}
          required={isRequired}
          value={(simpleFormData[fieldName] as string) || ''}
          onChange={handleSimpleChange}
          placeholder={field.placeholder}
          rows={4}
          className={common}
        />
      )
    }

    if (isExpectedSalary) {
      return (
        <div className="flex gap-2">
          <select
            value={salaryCurrencies[field.id] || 'SGD'}
            onChange={(e) => setSalaryCurrencies(prev => ({ ...prev, [field.id]: e.target.value }))}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SGD">SGD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="PHP">PHP</option>
          </select>
          <input
            type="text"
            name={fieldName}
            required={isRequired}
            value={(simpleFormData[fieldName] as string) || ''}
            onChange={handleSimpleChange}
            placeholder="e.g., 5000"
            className={`flex-1 ${common}`}
          />
        </div>
      )
    }

    const inputType = isDateField ? 'date' : field.type

    return (
      <input
        type={inputType}
        name={fieldName}
        required={isRequired}
        value={(simpleFormData[fieldName] as string) || ''}
        onChange={handleSimpleChange}
        placeholder={field.placeholder}
        className={common}
      />
    )
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600">Loading job details...</p>
    </div>
  )

  if (error || !job) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg w-full">
        <p className="text-red-600 text-lg">{error || 'Job not found'}</p>
        <button
          onClick={() => router.push('/jobs')}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Jobs
        </button>
      </div>
    </div>
  )

  const hasExperienceField = formFields.some(isExperienceField)
  const hasEducationField = formFields.some(isEducationField)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <button
            onClick={() => router.back()}
            className="text-white/90 hover:text-white mb-6 flex items-center gap-2"
          >
            ← Back to Jobs
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">{job.position_name}</h1>
          <div className="flex flex-wrap gap-6 text-white/90">
            <div>📍 {job.location || 'Not specified'}</div>
            <div>💼 {job.employment_type || 'Full-time'}</div>
            {job.company?.name && <div>🏢 {job.company.name}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            {job.description && (
              <div dangerouslySetInnerHTML={{ __html: job.description }} />
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Apply?</h3>
            <button
              onClick={() => setShowModal(true)}
              className="w-full max-w-md mx-auto py-3.5 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">Apply for {job.position_name}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-3xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Application Submitted!</h3>
                <p className="text-gray-600">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {formFields
                  .filter(f => !isExperienceField(f) && !isEducationField(f))
                  .map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {(field.is_required || field.required) && <span className="text-red-600">*</span>}
                      </label>
                      {renderSimpleField(field)}
                    </div>
                  ))}

                {hasExperienceField && (
                  <div className="border rounded-xl p-6 bg-gray-50">
                    <h3 className="text-xl font-bold mb-5">Work Experience</h3>
                    {experiences.map((exp, index) => (
                      <div key={index} className="mb-6 p-4 border rounded-lg bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Job Title</label>
                            <input
                              type="text"
                              value={exp.position_name}
                              onChange={e => updateExperience(index, 'position_name', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Company</label>
                            <input
                              type="text"
                              value={exp.employer}
                              onChange={e => updateExperience(index, 'employer', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={e => updateExperience(index, 'location', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exp.currently_work_here}
                              onChange={e => updateExperience(index, 'currently_work_here', e.target.checked)}
                              className="mr-2"
                            />
                            <label className="text-sm">I currently work here</label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                              type="date"
                              value={exp.start_date}
                              onChange={e => updateExperience(index, 'start_date', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                              type="date"
                              value={exp.end_date || ''}
                              onChange={e => updateExperience(index, 'end_date', e.target.value)}
                              disabled={exp.currently_work_here}
                              className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <textarea
                            value={exp.description}
                            onChange={e => updateExperience(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        {experiences.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExperience(index)}
                            className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Experience
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExperience}
                      className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + Add Another Experience
                    </button>
                  </div>
                )}

                {hasEducationField && (
                  <div className="border rounded-xl p-6 bg-gray-50">
                    <h3 className="text-xl font-bold mb-5">Education</h3>
                    {educations.map((edu, index) => (
                      <div key={index} className="mb-6 p-4 border rounded-lg bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">School</label>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={e => updateEducation(index, 'school', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Degree</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={e => updateEducation(index, 'degree', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Field of Study</label>
                            <input
                              type="text"
                              value={edu.specialization}
                              onChange={e => updateEducation(index, 'specialization', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <input
                              type="text"
                              value={edu.location}
                              onChange={e => updateEducation(index, 'location', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                              type="date"
                              value={edu.start_date}
                              onChange={e => updateEducation(index, 'start_date', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                              type="date"
                              value={edu.end_date || ''}
                              onChange={e => updateEducation(index, 'end_date', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Grade</label>
                            <input
                              type="text"
                              value={edu.final_grade}
                              onChange={e => updateEducation(index, 'final_grade', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                              placeholder="e.g., 3.8"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <textarea
                            value={edu.description}
                            onChange={e => updateEducation(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        {educations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Education
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEducation}
                      className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + Add Another Education
                    </button>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="flex-1 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 font-semibold"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobApplicationForm