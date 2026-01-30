/**
 * Skip Trace Service - BatchData API Integration
 * 
 * Enriches property owner data with phone numbers and email addresses
 * using BatchData's skip tracing API.
 * 
 * API Documentation: https://batchdata.io/api-solutions
 * 
 * IMPORTANT: This is a paid service. Only call when user explicitly
 * requests contact information for a property.
 */

// BatchData API configuration
const BATCHDATA_API_URL = 'https://api.batchdata.com/api/v1'
const BATCHDATA_API_KEY = import.meta.env.VITE_BATCHDATA_API_KEY || ''

// Skip trace request data
export interface SkipTraceRequest {
  firstName?: string
  lastName?: string
  address: string
  city: string
  state: string
  zip: string
}

// Skip trace response data
export interface SkipTraceResult {
  // Input echo
  inputAddress: string
  inputName?: string
  
  // Contact information
  phones: {
    number: string
    type: 'mobile' | 'landline' | 'voip' | 'unknown'
    score?: number // Confidence score 0-100
  }[]
  
  emails: {
    address: string
    type: 'personal' | 'business' | 'unknown'
    score?: number
  }[]
  
  // Additional owner info
  ownerInfo?: {
    firstName?: string
    lastName?: string
    fullName?: string
    age?: number
  }
  
  // Metadata
  success: boolean
  error?: string
  creditsUsed?: number
}

// Batch skip trace for multiple properties
export interface BatchSkipTraceResult {
  results: SkipTraceResult[]
  totalCreditsUsed: number
  successCount: number
  failureCount: number
}

/**
 * Check if BatchData API is configured
 */
export function isSkipTraceConfigured(): boolean {
  return Boolean(BATCHDATA_API_KEY && BATCHDATA_API_KEY.length > 0)
}

/**
 * Skip trace a single property owner
 */
export async function skipTraceProperty(request: SkipTraceRequest): Promise<SkipTraceResult> {
  if (!isSkipTraceConfigured()) {
    return {
      inputAddress: request.address,
      phones: [],
      emails: [],
      success: false,
      error: 'BatchData API key not configured. Set VITE_BATCHDATA_API_KEY in .env'
    }
  }

  try {
    // Parse owner name if provided
    const nameParts = request.firstName && request.lastName 
      ? { firstName: request.firstName, lastName: request.lastName }
      : parseOwnerName(request.firstName || '')

    const response = await fetch(`${BATCHDATA_API_URL}/skip-trace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      },
      body: JSON.stringify({
        requests: [{
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          address: {
            street: request.address,
            city: request.city,
            state: request.state,
            zip: request.zip
          }
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`BatchData API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Transform BatchData response to our format
    const result = data.results?.[0]
    
    if (!result) {
      return {
        inputAddress: request.address,
        phones: [],
        emails: [],
        success: false,
        error: 'No results returned from BatchData'
      }
    }

    return {
      inputAddress: request.address,
      inputName: `${nameParts.firstName} ${nameParts.lastName}`.trim(),
      phones: (result.phones || []).map((p: { phoneNumber: string; phoneType?: string; score?: number }) => ({
        number: formatPhoneNumber(p.phoneNumber),
        type: mapPhoneType(p.phoneType),
        score: p.score
      })),
      emails: (result.emails || []).map((e: { email: string; emailType?: string; score?: number }) => ({
        address: e.email,
        type: mapEmailType(e.emailType),
        score: e.score
      })),
      ownerInfo: result.person ? {
        firstName: result.person.firstName,
        lastName: result.person.lastName,
        fullName: result.person.fullName,
        age: result.person.age
      } : undefined,
      success: true,
      creditsUsed: 1
    }
  } catch (error) {
    console.error('Skip trace failed:', error)
    return {
      inputAddress: request.address,
      phones: [],
      emails: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Batch skip trace multiple properties
 * More cost-effective than individual requests
 */
export async function batchSkipTrace(requests: SkipTraceRequest[]): Promise<BatchSkipTraceResult> {
  if (!isSkipTraceConfigured()) {
    return {
      results: requests.map(r => ({
        inputAddress: r.address,
        phones: [],
        emails: [],
        success: false,
        error: 'BatchData API key not configured'
      })),
      totalCreditsUsed: 0,
      successCount: 0,
      failureCount: requests.length
    }
  }

  // BatchData supports up to 10,000 records per batch
  const BATCH_SIZE = 100
  const results: SkipTraceResult[] = []
  let totalCredits = 0
  let successCount = 0
  let failureCount = 0

  // Process in batches
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE)
    
    try {
      const response = await fetch(`${BATCHDATA_API_URL}/skip-trace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
        },
        body: JSON.stringify({
          requests: batch.map(r => {
            const nameParts = parseOwnerName(r.firstName || '')
            return {
              firstName: nameParts.firstName,
              lastName: nameParts.lastName,
              address: {
                street: r.address,
                city: r.city,
                state: r.state,
                zip: r.zip
              }
            }
          })
        })
      })

      if (!response.ok) {
        throw new Error(`BatchData API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Process each result in the batch
      for (let j = 0; j < batch.length; j++) {
        const batchResult = data.results?.[j]
        const request = batch[j]
        
        if (batchResult && batchResult.phones?.length > 0) {
          results.push({
            inputAddress: request.address,
            phones: (batchResult.phones || []).map((p: { phoneNumber: string; phoneType?: string; score?: number }) => ({
              number: formatPhoneNumber(p.phoneNumber),
              type: mapPhoneType(p.phoneType),
              score: p.score
            })),
            emails: (batchResult.emails || []).map((e: { email: string; emailType?: string; score?: number }) => ({
              address: e.email,
              type: mapEmailType(e.emailType),
              score: e.score
            })),
            success: true,
            creditsUsed: 1
          })
          successCount++
          totalCredits++
        } else {
          results.push({
            inputAddress: request.address,
            phones: [],
            emails: [],
            success: false,
            error: 'No contact information found'
          })
          failureCount++
        }
      }
    } catch (error) {
      // Mark entire batch as failed
      for (const request of batch) {
        results.push({
          inputAddress: request.address,
          phones: [],
          emails: [],
          success: false,
          error: error instanceof Error ? error.message : 'Batch request failed'
        })
        failureCount++
      }
    }
  }

  return {
    results,
    totalCreditsUsed: totalCredits,
    successCount,
    failureCount
  }
}

// Helper functions

/**
 * Parse owner name string into first/last name
 */
function parseOwnerName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' }
  
  const cleaned = fullName.trim()
  
  // Handle "LAST, FIRST" format
  if (cleaned.includes(',')) {
    const [last, first] = cleaned.split(',').map(s => s.trim())
    return { firstName: first || '', lastName: last || '' }
  }
  
  // Handle "FIRST LAST" format
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] }
  }
  
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

/**
 * Format phone number to standard format
 */
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  
  return phone
}

/**
 * Map BatchData phone type to our enum
 */
function mapPhoneType(type?: string): 'mobile' | 'landline' | 'voip' | 'unknown' {
  if (!type) return 'unknown'
  
  const t = type.toLowerCase()
  if (t.includes('mobile') || t.includes('cell')) return 'mobile'
  if (t.includes('landline') || t.includes('land')) return 'landline'
  if (t.includes('voip')) return 'voip'
  
  return 'unknown'
}

/**
 * Map BatchData email type to our enum
 */
function mapEmailType(type?: string): 'personal' | 'business' | 'unknown' {
  if (!type) return 'unknown'
  
  const t = type.toLowerCase()
  if (t.includes('personal')) return 'personal'
  if (t.includes('business') || t.includes('work')) return 'business'
  
  return 'unknown'
}

export const skipTraceService = {
  isConfigured: isSkipTraceConfigured,
  skipTrace: skipTraceProperty,
  batchSkipTrace
}
