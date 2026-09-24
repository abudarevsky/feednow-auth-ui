import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'

describe('Phase 02 primitives gallery', () => {
  it('renders the gallery heading and representative primitives', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Phase 02 design system' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Account access' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('Could not load account details.')).toBeInTheDocument()
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
