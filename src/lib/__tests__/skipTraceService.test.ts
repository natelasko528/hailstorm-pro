import { describe, it, expect } from 'vitest'
import {
  isSkipTraceConfigured,
  skipTraceProperty,
  batchSkipTrace,
  type SkipTraceRequest,
} from '../skipTraceService'

// In the test environment VITE_BATCHDATA_API_KEY is not set,
// so all paths that require the key will follow the "not configured" branch.

describe('isSkipTraceConfigured', () => {
  it('returns false when no API key is set', () => {
    expect(isSkipTraceConfigured()).toBe(false)
  })
})

describe('skipTraceProperty', () => {
  const baseRequest: SkipTraceRequest = {
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
  }

  it('returns a failure result when not configured', async () => {
    const result = await skipTraceProperty(baseRequest)

    expect(result.success).toBe(false)
    expect(result.error).toContain('API key not configured')
    expect(result.phones).toEqual([])
    expect(result.emails).toEqual([])
  })

  it('echoes the input address back', async () => {
    const result = await skipTraceProperty(baseRequest)
    expect(result.inputAddress).toBe('123 Main St')
  })

  it('returns failure result for request without names', async () => {
    const result = await skipTraceProperty({
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
    })
    expect(result.success).toBe(false)
    expect(result.inputAddress).toBe('456 Oak Ave')
  })
})

describe('batchSkipTrace', () => {
  it('returns failure results for every request when not configured', async () => {
    const requests: SkipTraceRequest[] = [
      { address: '100 First St', city: 'Dallas', state: 'TX', zip: '75201' },
      { address: '200 Second St', city: 'Dallas', state: 'TX', zip: '75202' },
      { address: '300 Third St', city: 'Dallas', state: 'TX', zip: '75203' },
    ]

    const result = await batchSkipTrace(requests)

    expect(result.totalCreditsUsed).toBe(0)
    expect(result.successCount).toBe(0)
    expect(result.failureCount).toBe(requests.length)
    expect(result.results).toHaveLength(requests.length)

    result.results.forEach((r, i) => {
      expect(r.success).toBe(false)
      expect(r.inputAddress).toBe(requests[i].address)
      expect(r.phones).toEqual([])
      expect(r.emails).toEqual([])
      expect(r.error).toContain('API key not configured')
    })
  })

  it('returns empty results array for empty input', async () => {
    const result = await batchSkipTrace([])
    expect(result.results).toEqual([])
    expect(result.totalCreditsUsed).toBe(0)
    expect(result.successCount).toBe(0)
    expect(result.failureCount).toBe(0)
  })
})

// ─── Helper function behavior (tested indirectly) ───────────────────────────
// parseOwnerName and formatPhoneNumber are private helpers.
// We can verify parseOwnerName behavior indirectly since skipTraceProperty
// would exercise it *if* the API were configured. Because it is not configured,
// we verify the service handles the various name input shapes gracefully.

describe('skipTraceProperty with various name inputs', () => {
  it('handles firstName only (no lastName)', async () => {
    const result = await skipTraceProperty({
      firstName: 'Smith, John',
      address: '123 Elm',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
    })
    // Even though the name has a comma (LAST, FIRST format),
    // the service should not crash
    expect(result.success).toBe(false)
    expect(result.inputAddress).toBe('123 Elm')
  })

  it('handles empty name fields', async () => {
    const result = await skipTraceProperty({
      address: '789 Pine',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
    })
    expect(result.success).toBe(false)
    expect(result.inputAddress).toBe('789 Pine')
  })
})
