import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Home } from '@/routes/home'
import { SessionProvider } from '@/routes/session-provider'

describe('account dashboard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the user organization, service catalog, and key list', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/services')) return Response.json({ items: [{ id: 'vispector', name: 'Vispector', description: 'Visual analysis and inspection', url: 'http://localhost:5173', status: 'active' }] })
      if (url.includes('/api-keys')) return Response.json({ items: [], limit: 100, next_cursor: null })
      return Response.json({ items: [{ id: 'org_01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Jordan Lee Organization', type: 'personal', created_at: '2026-09-25T00:00:00Z' }], limit: 1, next_cursor: null })
    }))
    render(<MemoryRouter><SessionProvider value={{ status: 'authenticated', user: { id: 'usr_01ARZ3NDEKTSV4RRFFQ69G5FAV', display_name: 'Jordan Lee', email: 'jordan@example.com', status: 'active', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><Home /></SessionProvider></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Jordan Lee Organization' })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Vispector' })).toBeInTheDocument()
    expect(screen.getByText('API Keys')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create test key' })).toBeInTheDocument()
  })
})
