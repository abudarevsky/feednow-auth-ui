import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'

describe('placeholder route', () => {
  it('renders the home placeholder heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'feednow-auth-ui' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Static React scaffold placeholder.')
    ).toBeInTheDocument()
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
