import { describe, expect, it, vi } from 'vitest'

import { createAccountApi } from '@/api/account'
import { createApiClient } from '@/api/client'
import { createApiKeysApi } from '@/api/apiKeys'

function makeClient() {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{"status":"ok"}'))
  return { client: createApiClient({ fetchImpl }), fetchImpl }
}

describe('typed browser API modules', () => {
  it('uses only the source-backed current-user path for account reads', async () => {
    const { client, fetchImpl } = makeClient()
    const account = createAccountApi(client)

    expect(Object.keys(account)).toEqual(['getProfile'])
    await account.getProfile()
    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual(['/api/v1/me'])
  })

  it('uses source-backed organization API-key paths and payloads', async () => {
    const { client, fetchImpl } = makeClient()
    const account = createAccountApi(client)
    const keys = createApiKeysApi(client)

    await account.getProfile()
    await keys.list('org/opaque', { limit: 10, cursor: 'cursor +/=' })
    await keys.create('org/opaque', { name: 'CI', environment: 'live', scopes: ['read'] })
    await keys.revoke('org/opaque', 'key/opaque')

    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/me',
      '/api/v1/organizations/org%2Fopaque/api-keys?limit=10&cursor=cursor+%2B%2F%3D',
      '/api/v1/organizations/org%2Fopaque/api-keys',
      '/api/v1/organizations/org%2Fopaque/api-keys/key%2Fopaque',
    ])
    expect(fetchImpl.mock.calls[1]?.[1]?.method ?? 'GET').toBe('GET')
    expect(fetchImpl.mock.calls[2]?.[1]?.body).toBe('{"name":"CI","environment":"live","scopes":["read"]}')
    expect(fetchImpl.mock.calls[3]?.[1]?.method).toBe('DELETE')
  })

  it('sends the fixed Phase 00 CSRF header on unsafe browser operations', async () => {
    const cookieReader = vi.fn(() => 'feednow_csrf=opaque-token')
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    const client = createApiClient({ fetchImpl, csrf: { cookieName: 'feednow_csrf', headerName: 'X-CSRF-Token', cookieReader } })
    await createApiKeysApi(client).create('org-1', { name: 'CI', environment: 'live', scopes: [] })

    expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get('X-CSRF-Token')).toBe('opaque-token')
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/api/v1/organizations/org-1/api-keys')
  })
})
