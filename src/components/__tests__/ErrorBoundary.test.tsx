import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ui/ErrorBoundary'

// Mock dependencies
vi.mock('../../lib/errorMonitoring', () => ({
  captureError: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

// A component that deliberately throws
function ThrowingComponent({ message }: { message: string }): React.ReactElement {
  throw new Error(message)
}

// A normal component
function GoodComponent() {
  return <div>All is well</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Silence console.error for expected error boundary output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('All is well')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test crash" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows the error message in the default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Kaboom!" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Kaboom!')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error page</div>}>
        <ThrowingComponent message="oops" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error page')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('shows a Try Again button in the default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="fail" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('shows a Dashboard link in the default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="fail" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
