import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonPropertyPage,
  SkeletonDashboard,
} from '../ui/Skeleton'

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('applies the animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('accepts a custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    expect(container.firstChild).toHaveClass('h-4')
    expect(container.firstChild).toHaveClass('w-24')
  })
})

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('SkeletonTable', () => {
  it('renders without crashing with default rows', () => {
    const { container } = render(<SkeletonTable />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with custom row count', () => {
    const { container } = render(<SkeletonTable rows={3} />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('SkeletonList', () => {
  it('renders without crashing with default items', () => {
    const { container } = render(<SkeletonList />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with custom item count', () => {
    const { container } = render(<SkeletonList items={2} />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('SkeletonPropertyPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonPropertyPage />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('SkeletonDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonDashboard />)
    expect(container.firstChild).toBeTruthy()
  })
})
