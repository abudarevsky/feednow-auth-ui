import { describe, expect, it, vi } from 'vitest'

import { createAccountApi } from '@/api/account'
import { createApiClient } from '@/api/client'
import { createAuthApi } from '@/api/auth'
import { createApiKeysApi } from '@/api/apiKeys'
import { createClientContextApi } from '@/api/clientContext'

function makeClient() {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{"status":"ok"}'))
  return { client: createApiClient({ fetchImpl }), fetchImpl }
}

describe('typed browser API modules', () => {
  it('uses the canonical context/session/login/challenge and recovery paths', async () => {
    const { client, fetchImpl } = makeClient()
    const context = createClientContextApi(client)
    const auth = createAuthApi(client)

    await context.get('vispector app')
    await auth.getSession()
    await auth.login({ email: 'a@example.test', password: 'pass', client_id: 'vispector', state: null })
    await auth.completeChallenge('challenge/opaque', { response: '123456' })
    await auth.handoff({ client_id: 'vispector', state: 'opaque-state' })
    await auth.startFederation({ provider: 'google', client_id: 'vispector', state: null })
    await auth.register({
      email: 'a@example.test', password: 'pass', client_id: 'vispector',
      terms_acknowledgements: [{ document_id: 'terms', version: '1' }],
    })
    await auth.verifyEmail({ challenge_id: 'challenge-1', code: '123456' })
    await auth.resendVerification({ challenge_id: 'challenge-1' })
    await auth.requestPasswordReset({ email: 'a@example.test' })
    await auth.confirmPasswordReset({ challenge_id: 'reset-1', code: '654321', new_password: 'next' })
    await auth.logout()

    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/auth/context?client_id=vispector+app',
      '/api/v1/session',
      '/api/v1/auth/login',
      '/api/v1/auth/challenges/challenge%2Fopaque',
      '/api/v1/auth/handoff',
      '/api/v1/auth/federation',
      '/api/v1/auth/registrations',
      '/api/v1/auth/email-verifications',
      '/api/v1/auth/email-verifications/resend',
      '/api/v1/auth/password-resets',
      '/api/v1/auth/password-resets/confirm',
      '/api/v1/logout',
    ])
    expect(JSON.parse(String(fetchImpl.mock.calls[2]?.[1]?.body))).toEqual({
      email: 'a@example.test', password: 'pass', client_id: 'vispector', state: null,
    })
  })

  it('uses typed profile/security and organization key contracts', async () => {
    const { client, fetchImpl } = makeClient()
    const account = createAccountApi(client)
    const keys = createApiKeysApi(client)

    await account.getProfile()
    await account.updateProfile({ display_name: 'Ada' })
    await account.getSecurity()
    await account.changePassword({ current_password: 'old', new_password: 'new' })
    await keys.list('org/opaque', { limit: 10, cursor: 'cursor +/=' })
    await keys.create('org/opaque', { name: 'CI', environment: 'live', scopes: ['read'] })
    await keys.revoke('org/opaque', 'key/opaque')

    expect(fetchImpl.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/me',
      '/api/v1/me',
      '/api/v1/account/security',
      '/api/v1/account/security/password',
      '/api/v1/organizations/org%2Fopaque/api-keys?limit=10&cursor=cursor+%2B%2F%3D',
      '/api/v1/organizations/org%2Fopaque/api-keys',
      '/api/v1/organizations/org%2Fopaque/api-keys/key%2Fopaque',
    ])
    expect(fetchImpl.mock.calls[4]?.[1]?.method ?? 'GET').toBe('GET')
    expect(fetchImpl.mock.calls[6]?.[1]?.method).toBe('DELETE')
  })

  it('sends the fixed Phase 00 CSRF header on unsafe browser operations', async () => {
    const cookieReader = vi.fn(() => 'feednow_csrf=opaque-token')
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    const client = createApiClient({ fetchImpl, csrf: { cookieName: 'feednow_csrf', headerName: 'X-CSRF-Token', cookieReader } })
    await createAuthApi(client).logout()

    expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get('X-CSRF-Token')).toBe('opaque-token')
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/api/v1/logout')
  })
})
