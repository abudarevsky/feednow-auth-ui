import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'

afterEach(() => vi.unstubAllGlobals())

describe('Phase 03 route entry point', () => {
  it('shows session discovery while the root route resolves', () => {
    render(<App session={{ status: 'loading' }} />)
    expect(screen.getByRole('heading', { name: 'FeedNow account' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Checking account session' })).toBeInTheDocument()
  })
})

describe('authenticated session startup', () => {
  it('keeps the session available when CSRF bootstrap is temporarily down', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'usr_test', display_name: 'Test User', email: 'test@example.test',
        status: 'active', application_role: 'user',
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Account unavailable' })).not.toBeInTheDocument()
  })

  it('bootstraps CSRF before exposing authenticated routes', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'usr_test', display_name: 'Test User', email: 'test@example.test',
        status: 'active', application_role: 'user',
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/csrf', expect.anything()))
    expect(fetchMock.mock.calls.slice(0, 2).map(([url]) => url)).toEqual([
      '/api/v1/me',
      '/api/v1/csrf',
    ])
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
