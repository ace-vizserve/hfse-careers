// app/api/applications/route.js

export async function POST(request: Request) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG

  if (!MANATAL_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  if (!MANATAL_CLIENT_SLUG) {
    return Response.json({ error: 'Client slug not configured. Add MANATAL_CLIENT_SLUG to your .env file' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const jobId = formData.get('jobId')

    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log('📝 Processing application for job:', jobId)

    // Optional: Fetch form fields if you want to validate or map (but not required anymore)
    const formFieldsResponse = await fetch(
      `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    )

    let formFields = []
    if (formFieldsResponse.ok) {
      formFields = await formFieldsResponse.json()
    }

    // The frontend already sends application_data as JSON string + cv file
    const applicationDataStr = formData.get('application_data') as string
    if (!applicationDataStr) {
      return Response.json({ error: 'Application data is required' }, { status: 400 })
    }

    let applicationData
    try {
      applicationData = JSON.parse(applicationDataStr)
    } catch (e) {
      return Response.json({ error: 'Invalid application data format' }, { status: 400 })
    }

    const resume = formData.get('cv') || formData.get('resume') || formData.get('file')

    if (resume && resume instanceof File) {
      // Submit with file (multipart)
      const submitFormData = new FormData()
      submitFormData.append('application_data', JSON.stringify(applicationData))
      submitFormData.append('cv', resume)

      console.log('📤 Submitting with resume...')

      const submitResponse = await fetch(
        `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
        {
          method: 'POST',
          body: submitFormData,
        }
      )

      const submitText = await submitResponse.text()
      console.log('Submit Response:', submitResponse.status, submitText)

      if (!submitResponse.ok) {
        return Response.json({ 
          error: 'Failed to submit application',
          details: submitText
        }, { status: submitResponse.status })
      }

      const result = JSON.parse(submitText)
      return Response.json({ 
        success: true,
        candidateId: result.id,
        message: 'Application submitted successfully'
      })
    } else {
      // Submit without file (JSON)
      console.log('📤 Submitting without resume...')

      const submitResponse = await fetch(
        `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_data: applicationData })
        }
      )

      const submitText = await submitResponse.text()
      console.log('Submit Response:', submitResponse.status, submitText)

      if (!submitResponse.ok) {
        return Response.json({ 
          error: 'Failed to submit application',
          details: submitText
        }, { status: submitResponse.status })
      }

      const result = JSON.parse(submitText)
      return Response.json({ 
        success: true,
        candidateId: result.id,
        message: 'Application submitted successfully'
      })
    }

  } catch (error) {
    console.error('❌ Application submission error:', error)
    return Response.json({ 
      error: 'Failed to submit application',
      message: (error as Error).message 
    }, { status: 500 })
  }
}