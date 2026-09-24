import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'

describe('Phase 03 route entry point', () => {
  it('renders the entry heading and canonical routes', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'FeedNow account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'API keys' })).toHaveAttribute('href', '/account/api-keys')
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
