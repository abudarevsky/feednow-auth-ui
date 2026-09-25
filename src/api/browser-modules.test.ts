import { describe, expect, it, vi } from 'vitest'

import { createAccountApi } from '@/api/account'
import { createApiClient } from '@/api/client'
import { createApiKeysApi } from '@/api/apiKeys'
import { createSessionApi } from '@/api/session'
import { createCsrfApi } from '@/api/csrf'
import { createHandoffApi } from '@/api/handoff'

function makeClient() {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{"status":"ok"}'))
  return { client: createApiClient({ fetchImpl }), fetchImpl }
}

describe('typed browser API modules', () => {
  it('uses the retained profile contract path for account reads', async () => {
    const { client, fetchImpl } = makeClient()
    const account = createAccountApi(client)

    expect(Object.keys(account)).toEqual(['getProfile'])
    await account.getProfile()
    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual(['/api/v1/me'])
  })

  it('reads backend session and registered client context through typed same-origin paths', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (input === '/api/v1/session') {
        return new Response('{"status":"authenticated","user":{"id":"usr_1","display_name":"Ada","email":"ada@example.test"}}')
      }

      return new Response('{"client_id":"vispector /?","display_name":"Vispector","logo_url":null,"registration_enabled":true}')
    })
    const session = createSessionApi(createApiClient({ fetchImpl }))

    const current = await session.getCurrent()
    const context = await session.getClientContext('vispector /?')

    expect(current.data).toEqual({
      status: 'authenticated',
      user: { id: 'usr_1', display_name: 'Ada', email: 'ada@example.test' },
    })
    expect(context.data).toEqual({
      client_id: 'vispector /?',
      display_name: 'Vispector',
      logo_url: null,
      registration_enabled: true,
    })
    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/session',
      '/api/v1/auth/context?client_id=vispector+%2F%3F',
    ])
    expect(fetchImpl.mock.calls.map(([, options]) => options?.method ?? 'GET')).toEqual(['GET', 'GET'])
  })

  it('models an unauthenticated backend session without inferring browser state', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"status":"unauthenticated","user":null}'))
    const session = createSessionApi(createApiClient({ fetchImpl }))

    const current = await session.getCurrent()

    expect(current.data).toEqual({ status: 'unauthenticated', user: null })
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/api/v1/session')
    expect(fetchImpl.mock.calls[0]?.[1]?.credentials).toBe('same-origin')
  })

  it('bootstraps CSRF and sends only backend-approved logout and handoff requests', async () => {
    const cookieReader = vi.fn(() => 'feednow_csrf=opaque-csrf')
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('{"redirect_url":"https://vispector.feednow.io/auth/callback?result=opaque"}'))
      .mockResolvedValueOnce(new Response('{"redirect_url":"https://vispector.feednow.io/auth/callback?result=opaque-2"}'))
    const client = createApiClient({
      fetchImpl,
      csrf: { cookieName: 'feednow_csrf', headerName: 'X-CSRF-Token', cookieReader },
    })
    const csrf = createCsrfApi(client)
    const session = createSessionApi(client)
    const handoff = createHandoffApi(client)

    const bootstrap = await csrf.bootstrap()
    const logout = await session.logout()
    const result = await handoff.start({ client_id: 'vispector', state: 'opaque-state' })
    const accountOnlyResult = await handoff.start({ client_id: 'vispector', state: null })

    expect(bootstrap.status).toBe(204)
    expect(bootstrap.data).toBeUndefined()
    expect(logout.status).toBe(204)
    expect(logout.data).toBeUndefined()
    expect(result.data).toEqual({ redirect_url: 'https://vispector.feednow.io/auth/callback?result=opaque' })
    expect(accountOnlyResult.data).toEqual({ redirect_url: 'https://vispector.feednow.io/auth/callback?result=opaque-2' })
    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/csrf',
      '/api/v1/logout',
      '/api/v1/auth/handoff',
      '/api/v1/auth/handoff',
    ])
    expect(fetchImpl.mock.calls.map(([, options]) => options?.method ?? 'GET')).toEqual(['GET', 'POST', 'POST', 'POST'])
    expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).has('X-CSRF-Token')).toBe(false)
    expect(fetchImpl.mock.calls.slice(1).map(([, options]) => new Headers(options?.headers).get('X-CSRF-Token')))
      .toEqual(['opaque-csrf', 'opaque-csrf', 'opaque-csrf'])
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe('{}')
    expect(fetchImpl.mock.calls[2]?.[1]?.body).toBe('{"client_id":"vispector","state":"opaque-state"}')
    expect(fetchImpl.mock.calls[3]?.[1]?.body).toBe('{"client_id":"vispector","state":null}')
  })

  it('uses the retained organization API-key contract paths and payloads', async () => {
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
