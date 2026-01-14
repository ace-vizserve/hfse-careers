export async function GET() {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY
  
  if (!MANATAL_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }
  
  try {
    // Use the standard jobs endpoint instead of career-page
    const response = await fetch('https://api.manatal.com/open/v3/jobs/', {
      headers: {
        'Authorization': `Token ${MANATAL_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Manatal API error:', response.status, errorText)
      return Response.json({ 
        error: 'Failed to fetch jobs from Manatal',
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('Manatal API response:', data)
    
    // The standard API returns { count, next, previous, results }
    // Filter for only published/active jobs
    const jobs = data.results || []
    const activeJobs = jobs.filter(job => job.is_published || job.status === 'Published')
    
    return Response.json({ 
      results: activeJobs,
      count: activeJobs.length 
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ 
      error: 'Failed to fetch jobs',
      message: error.message 
    }, { status: 500 })
  }
}