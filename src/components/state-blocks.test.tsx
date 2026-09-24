import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState, ErrorState, LoadingBlock } from '@/components/state-blocks'

describe('state blocks', () => {
  it('announces loading while keeping skeletons decorative', () => {
    render(<LoadingBlock />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  })

  it('pairs the empty state icon with visible text', () => {
    render(<EmptyState title="No sessions" description="New sessions appear here." />)
    expect(screen.getByRole('heading', { name: 'No sessions' })).toBeInTheDocument()
    expect(screen.getByText('New sessions appear here.')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'No sessions' }).parentElement,
    ).toContainElement(screen.getByText('New sessions appear here.'))
  })

  it('renders only the caller-supplied safe error copy', () => {
    render(<ErrorState message="Please try again." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Please try again.')
    expect(screen.queryByText(/AWS|Cognito|stack trace/i)).not.toBeInTheDocument()
  })
})
