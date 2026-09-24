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

  it('preserves request cancellation', async () => {
    const abortError = new DOMException('cancelled', 'AbortError')
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(abortError)

    await expect(createApiClient({ fetchImpl }).request('/api/example'))
      .rejects.toBe(abortError)
  })
})
