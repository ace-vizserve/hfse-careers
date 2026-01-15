// app/api/applications/route.ts

export async function POST(request: Request) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG

  if (!MANATAL_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  if (!MANATAL_CLIENT_SLUG) {
    return Response.json({ error: 'Client slug not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const jobId = formData.get('jobId')

    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log('📝 Processing application for job:', jobId)

    const applicationDataStr = formData.get('application_data')
    if (!applicationDataStr || typeof applicationDataStr !== 'string') {
      return Response.json({ error: 'Application data is required' }, { status: 400 })
    }

    let applicationData: Record<string, any>
    try {
      applicationData = JSON.parse(applicationDataStr)
    } catch (e) {
      return Response.json({ error: 'Invalid application data format' }, { status: 400 })
    }

    // Helper function to get nationality ID from Manatal API
    const getNationalityId = async (nationalityName: string): Promise<number | null> => {
      try {
        const response = await fetch(
          `https://api.manatal.com/open/v3/nationalities/?search=${encodeURIComponent(nationalityName)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            console.log(`✅ Found nationality ID for "${nationalityName}":`, data[0].id)
            return data[0].id
          }
        }
        console.warn(`⚠️ Nationality "${nationalityName}" not found`)
        return null
      } catch (error) {
        console.error('Error fetching nationality:', error)
        return null
      }
    }

    // Check if field 1742127 (Nationality) needs to be converted
    if (applicationData['1742127'] && typeof applicationData['1742127'] === 'string') {
      const nationalityName = applicationData['1742127']
      const nationalityId = await getNationalityId(nationalityName)
      if (nationalityId) {
        applicationData['1742127'] = String(nationalityId)
      } else {
        return Response.json({ 
          error: `Nationality "${nationalityName}" not found in Manatal system`,
          details: 'Please provide a valid nationality'
        }, { status: 400 })
      }
    }

    // Get expected_currency from formData
    const expectedCurrencyValue = formData.get('expected_currency')
    const expectedCurrency = typeof expectedCurrencyValue === 'string' ? expectedCurrencyValue : null
    
    // Add expected_currency directly to application_data at root level
    if (expectedCurrency) {
      applicationData.expected_currency = parseInt(expectedCurrency)
    } else {
      // Default to SGD (ID: 11) if not provided
      applicationData.expected_currency = 11
    }

    // Try multiple possible field names (including capital R "Resume" from Postman)
    const resume = formData.get('cv') || 
                   formData.get('resume') || 
                   formData.get('Resume') || 
                   formData.get('file')
    
    if (!resume) {
      console.error('❌ No resume file found')
      return Response.json({ 
        error: 'Resume file is required',
        details: 'Please upload a valid resume file',
        availableKeys: Array.from(formData.keys())
      }, { status: 400 })
    }

    // TypeScript type guard for File/Blob
    if (typeof resume === 'string') {
      console.error('❌ Resume is a string, not a file')
      return Response.json({ 
        error: 'Invalid file format',
        details: 'Expected File or Blob, got string'
      }, { status: 400 })
    }

    const isFile = resume instanceof File
    const isBlob = resume instanceof Blob

    if (!isFile && !isBlob) {
      console.error('❌ Resume is not a file or blob')
      return Response.json({ 
        error: 'Invalid file format',
        details: 'Expected File or Blob'
      }, { status: 400 })
    }

    const fileSize = resume.size
    if (fileSize === 0) {
      console.error('❌ Resume file is empty')
      return Response.json({ 
        error: 'Resume file is empty',
        details: 'Please upload a valid resume file'
      }, { status: 400 })
    }

    // Check file size (Manatal limit is typically 5-10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileSize > maxSize) {
      console.error('❌ File too large:', fileSize, 'bytes')
      return Response.json({ 
        error: 'File too large',
        details: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${maxSize / 1024 / 1024}MB`
      }, { status: 400 })
    }

    const fileName = isFile ? resume.name : 'resume.pdf'
    
    console.log('📄 Resume file detected:', {
      name: fileName,
      size: fileSize,
      type: resume.type || 'unknown'
    })

    // Convert file to base64
    console.log('🔄 Converting file to base64...')
    const arrayBuffer = await resume.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64String = buffer.toString('base64')
    
    console.log('✅ File converted to base64, length:', base64String.length)

    // Find the CV field ID in application_data (usually 1741683 based on your data)
    // Replace the URL with base64 string
    const cvFieldId = '1741683'
    if (applicationData[cvFieldId]) {
      console.log('🔄 Replacing CV URL with base64 string in field:', cvFieldId)
      applicationData[cvFieldId] = base64String
    } else {
      console.warn('⚠️ CV field not found in application data, adding it')
      applicationData[cvFieldId] = base64String
    }

    console.log('📦 Application data prepared with base64 CV')

    // Submit as JSON (not multipart)
    console.log('📤 Submitting application to Manatal...')

    const submitResponse = await fetch(
      `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ application_data: applicationData })
      }
    )

    const submitText = await submitResponse.text()
    console.log('📥 Manatal Response:', submitResponse.status)
    console.log('📥 Response body:', submitText)

    if (!submitResponse.ok) {
      console.error('❌ Manatal API Error:', submitText)
      return Response.json({ 
        error: 'Failed to submit application',
        details: submitText,
        status: submitResponse.status
      }, { status: submitResponse.status })
    }

    let result
    try {
      result = JSON.parse(submitText)
    } catch (e) {
      console.error('Failed to parse Manatal response:', submitText)
      return Response.json({ 
        error: 'Invalid response from Manatal',
        details: submitText
      }, { status: 500 })
    }

    return Response.json({ 
      success: true,
      candidateId: result.id,
      message: 'Application submitted successfully with resume'
    })

  } catch (error) {
    console.error('❌ Application submission error:', error)
    return Response.json({ 
      error: 'Failed to submit application',
      message: (error as Error).message 
    }, { status: 500 })
  }
}