import { describe, expect, it, vi } from 'vitest'

import { createApiClient } from '@/api/client'
import { ApiRequestError } from '@/lib/api-errors'

describe('typed API transport', () => {
  it('uses same-origin credentials and JSON headers/body', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"accepted":true}', {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }))
    const client = createApiClient({ fetchImpl })

    const result = await client.request<{ accepted: boolean }>('/api/example', {
      method: 'POST',
      body: { displayName: 'A User' },
    })

    expect(fetchImpl).toHaveBeenCalledOnce()
    const [path, init] = fetchImpl.mock.calls[0]!
    expect(path).toBe('/api/example')
    expect(init?.credentials).toBe('same-origin')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('accept')).toBe('application/json')
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
    expect(init?.body).toBe('{"displayName":"A User"}')
    expect(result).toMatchObject({ ok: true, status: 201, data: { accepted: true } })
  })

  it('accepts caller cancellation signals without replacing them', async () => {
    const controller = new AbortController()
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"status":"ok"}'))
    const client = createApiClient({ fetchImpl })

    await client.request<{ status: string }>('/api/example', { signal: controller.signal })

    expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })

  it.each(['https://api.example.test/v1/me', '//api.example.test/api/me', '/login', '/api\\me'])(
    'rejects unsafe API path %s before calling fetch', async (path) => {
      const fetchImpl = vi.fn<typeof fetch>()
      const client = createApiClient({ fetchImpl })

      await expect(client.request(path)).rejects.toThrow('same-origin /api/ path')
      expect(fetchImpl).not.toHaveBeenCalled()
    },
  )

  it('returns an empty payload for a no-content response', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    const result = await createApiClient({ fetchImpl }).request<void>('/api/example', { method: 'DELETE' })

    expect(result).toMatchObject({ ok: true, status: 204, data: undefined })
  })

  it('throws safe mapped errors without retaining backend message text', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      code: 'unauthenticated',
      message: 'token=must-not-leak',
    }), { status: 401, headers: { 'content-type': 'application/json' } }))

    await expect(createApiClient({ fetchImpl }).request('/api/private'))
      .rejects.toMatchObject({
        name: 'ApiRequestError',
        kind: 'unauthenticated',
        message: 'Please sign in again to continue.',
      })
    try {
      await createApiClient({ fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(
        JSON.stringify({ code: 'unauthenticated', message: 'token=must-not-leak' }),
        { status: 401 },
      )) }).request('/api/private')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError)
      expect(JSON.stringify(error)).not.toContain('must-not-leak')
    }
  })

  it('normalizes network and malformed successful response failures', async () => {
    const failedFetch = vi.fn<typeof fetch>().mockRejectedValue(new Error('socket password=secret'))
    await expect(createApiClient({ fetchImpl: failedFetch }).request('/api/example'))
      .rejects.toMatchObject({ kind: 'network', message: 'We could not connect. Check your connection and try again.' })

    const malformedFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>internal</html>'))
    await expect(createApiClient({ fetchImpl: malformedFetch }).request('/api/example'))
      .rejects.toMatchObject({ kind: 'malformed_response', message: 'We could not process the server response. Please try again.' })
  })

  it.each([
    [401, 'invalid_credentials', 'validation'],
    [403, 'account_disabled', 'forbidden'],
  ] as const)('normalizes Phase 00 auth error %s/%s safely', async (status, code, kind) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      code,
      message: 'private backend detail',
    }), { status }))

    await expect(createApiClient({ fetchImpl }).request('/api/v1/auth/login', { method: 'POST', body: { password: 'secret' } }))
      .rejects.toMatchObject({ kind, code, message: kind === 'validation'
        ? 'Check the information and try again.'
        : 'You do not have permission to do that.' })
  })

  it('preserves request cancellation', async () => {
    const abortError = new DOMException('cancelled', 'AbortError')
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(abortError)

    await expect(createApiClient({ fetchImpl }).request('/api/example'))
      .rejects.toBe(abortError)
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
    'copies the configured CSRF cookie into the header for %s only', async (method) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":true}'))
      const cookieReader = vi.fn(() => 'other=x; ui-csrf=opaque%20token')
      const client = createApiClient({
        fetchImpl,
        csrf: { cookieName: 'ui-csrf', headerName: 'X-Test-CSRF', cookieReader },
      })

      await client.request('/api/write', { method, body: {} })

      expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get('X-Test-CSRF'))
        .toBe('opaque token')
      expect(cookieReader).toHaveBeenCalledOnce()
    },
  )

  it.each(['GET', 'HEAD'] as const)('does not read or send CSRF for %s', async (method) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    const cookieReader = vi.fn(() => 'ui-csrf=opaque-token')
    const client = createApiClient({
      fetchImpl,
      csrf: { cookieName: 'ui-csrf', headerName: 'X-Test-CSRF', cookieReader },
    })

    await client.request('/api/read', { method })

    expect(cookieReader).not.toHaveBeenCalled()
    expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).has('X-Test-CSRF')).toBe(false)
  })

  it('blocks configured unsafe requests when the CSRF cookie is missing', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    const client = createApiClient({
      fetchImpl,
      csrf: { cookieName: 'ui-csrf', headerName: 'X-Test-CSRF', cookieReader: () => '' },
    })

    await expect(client.request('/api/write', { method: 'POST', body: {} }))
      .rejects.toMatchObject({
        kind: 'csrf',
        message: 'Your request could not be verified. Reload the page and try again.',
      })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
