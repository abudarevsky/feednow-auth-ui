import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiKeysPage } from '@/routes/api-keys'
import { SessionProvider } from '@/routes/session-provider'

describe('API keys page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads keys under their organization and remains the only account key surface', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api-keys')) return Response.json({ items: [{ id: 'key_1', name: 'Local proof', service_id: 'vispector', environment: 'test', key_prefix: 'fn_test_', status: 'active', scopes: [], created_at: '2026-09-25T00:00:00Z', last_used_at: null, expires_at: null, revoked_at: null }], limit: 100, next_cursor: null })
      return Response.json({ items: [{ id: 'org_1', name: 'FeedNow.io', name_status: 'confirmed', status: 'active', suspended_at: null, type: 'customer', created_at: '2026-09-25T00:00:00Z' }], limit: 100, next_cursor: null })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<SessionProvider value={{ status: 'authenticated', user: { id: 'usr_1', display_name: 'Jordan', email: 'jordan@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><ApiKeysPage /></SessionProvider>)

    expect(await screen.findByText('Local proof')).toBeInTheDocument()
    expect(screen.getByText('FeedNow.io')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create test key' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/organizations?limit=100', expect.objectContaining({ cache: 'no-store' }))
  })
})
