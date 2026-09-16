import { render, screen } from '@testing-library/react'

import { describe, expect, it } from 'vitest'

import { StatusMessage } from '@/components/status-message'

/*
 * StatusMessage (Phase 02, step 3): the shared polite live region for
 * pending/success announcements. The region stays mounted even when empty
 * (so text changes inside it are announced), exposes role="status" plus an
 * explicit aria-live="polite", and is screen-reader-only by default.
 */
describe('StatusMessage', () => {
  it('exposes a polite status live region with its text', () => {
    render(<StatusMessage>Sending code…</StatusMessage>)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Sending code…')
    expect(status).toHaveClass('sr-only')
  })

  it('keeps the region mounted so later text changes announce', () => {
    const { rerender } = render(<StatusMessage />)
    const region = screen.getByRole('status')
    expect(region).toBeEmptyDOMElement()
    rerender(<StatusMessage>Profile saved</StatusMessage>)
    expect(region).toHaveTextContent('Profile saved')
  })

  it('lets callers make the text visible via a not-sr-only override', () => {
    render(
      <StatusMessage className="not-sr-only text-sm text-muted-foreground">
        Visible status
      </StatusMessage>
    )
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Visible status')
    expect(status).toHaveClass('not-sr-only')
    expect(status).not.toHaveClass('sr-only')
  })
})
