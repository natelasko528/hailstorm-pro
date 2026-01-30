import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  truncate,
  debounce,
  formatNumber,
  getDateRangeFromDays,
  formatDateForInput,
} from '../utils'

// ─── cn (class name merging) ────────────────────────────────────────────────

describe('cn', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes via clsx syntax', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('merges tailwind conflicting classes (last wins)', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('returns empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null inputs', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

// ─── formatCurrency ─────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a whole number as USD without decimals', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('rounds down fractional cents', () => {
    // maximumFractionDigits: 0 means rounding to nearest integer
    const result = formatCurrency(99.49)
    expect(result).toBe('$99')
  })

  it('rounds up when fractional part >= 0.5', () => {
    const result = formatCurrency(99.5)
    expect(result).toBe('$100')
  })

  it('formats large values with commas', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('formats negative numbers', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date('2024-03-15T00:00:00Z')
    const result = formatDate(date)
    // en-US short month format: "Mar 15, 2024"
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats an ISO date string', () => {
    const result = formatDate('2023-12-25')
    expect(result).toContain('Dec')
    expect(result).toContain('25')
    expect(result).toContain('2023')
  })
})

// ─── formatDateTime ─────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('includes time in formatted output', () => {
    const result = formatDateTime('2024-06-01T14:30:00Z')
    // Should contain date parts and time
    expect(result).toContain('Jun')
    expect(result).toContain('2024')
    // Should include some time component (hour:minute)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

// ─── truncate ────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns the original string when shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns the original string when exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and adds ellipsis when longer than limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('handles limit of zero', () => {
    expect(truncate('hello', 0)).toBe('...')
  })
})

// ─── debounce ────────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call function immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls function after the wait time', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets the timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    // Should not have fired yet (timer was reset)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a', 'b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b')
  })

  it('uses the last call arguments when called multiple times', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('first')
    debounced('second')
    debounced('third')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('third')
  })
})

// ─── formatNumber ────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('returns the number as-is when below 1000', () => {
    expect(formatNumber(500)).toBe('500')
  })

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K')
  })

  it('formats thousands with one decimal', () => {
    expect(formatNumber(2500)).toBe('2.5K')
  })

  it('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
  })

  it('formats millions with one decimal', () => {
    expect(formatNumber(2500000)).toBe('2.5M')
  })

  it('returns "0" for zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats 999 without suffix', () => {
    expect(formatNumber(999)).toBe('999')
  })
})

// ─── getDateRangeFromDays ────────────────────────────────────────────────────

describe('getDateRangeFromDays', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns start and end as ISO strings', () => {
    const range = getDateRangeFromDays(7)
    expect(range.start).toBeDefined()
    expect(range.end).toBeDefined()
    // Should be valid ISO strings
    expect(new Date(range.start).toISOString()).toBe(range.start)
    expect(new Date(range.end).toISOString()).toBe(range.end)
  })

  it('computes start date correctly for 7 days', () => {
    const range = getDateRangeFromDays(7)
    const start = new Date(range.start)
    const end = new Date(range.end)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(7, 0)
  })

  it('computes start date correctly for 30 days', () => {
    const range = getDateRangeFromDays(30)
    const start = new Date(range.start)
    const end = new Date(range.end)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(30, 0)
  })

  it('returns end date as current time', () => {
    const range = getDateRangeFromDays(1)
    const end = new Date(range.end)
    expect(end.toISOString()).toBe('2024-06-15T12:00:00.000Z')
  })
})

// ─── formatDateForInput ──────────────────────────────────────────────────────

describe('formatDateForInput', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2024-03-05T00:00:00Z')
    expect(formatDateForInput(date)).toBe('2024-03-05')
  })

  it('pads single-digit months and days', () => {
    const date = new Date('2024-01-09T00:00:00Z')
    const result = formatDateForInput(date)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
