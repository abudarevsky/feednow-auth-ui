import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'

describe('Phase 03 route entry point', () => {
  it('shows session discovery while the root route resolves', () => {
    render(<App session={{ status: 'loading' }} />)
    expect(screen.getByRole('heading', { name: 'FeedNow account' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Checking account session' })).toBeInTheDocument()
  })
})

describe('MSW API-boundary interception', () => {
  it('intercepts a relative /api/... fetch so tests never touch the network', async () => {
    const response = await fetch('/api/placeholder')

    expect(response.ok).toBe(true)
    await expect(response.json()).resolves.toEqual({
      status: 'intercepted',
    })
  })
})
