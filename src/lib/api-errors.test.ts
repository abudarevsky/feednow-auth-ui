import { describe, expect, it } from 'vitest'

import { ApiRequestError, createNetworkError, normalizeApiError } from '@/lib/api-errors'

describe('safe API error normalization', () => {
  it('keeps the frozen code and safe field paths but drops raw server text', () => {
    const error = normalizeApiError(422, {
      code: 'validation_error',
      message: 'password=do-not-retain',
      field_errors: [
        { field: 'body.password', message: 'invalid secret value=do-not-retain' },
        { field: 'token=do-not-retain', message: 'untrusted path' },
      ],
      request_id: 'req-123:abc',
    })

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error).toMatchObject({
      kind: 'validation',
      status: 422,
      code: 'validation_error',
      requestId: 'req-123:abc',
      fields: ['body.password'],
    })
    expect(error.message).toBe('Check the information and try again.')
    expect(JSON.stringify(error)).not.toContain('do-not-retain')
  })

  it.each([
    [400, 'validation_error', 'validation'],
    [401, 'unauthenticated', 'unauthenticated'],
    [403, 'forbidden', 'forbidden'],
    [404, 'not_found', 'not_found'],
    [409, 'conflict', 'conflict'],
    [429, 'rate_limited', 'rate_limited'],
    [503, 'internal_error', 'server'],
  ] as const)('maps status %s/code %s to %s', (status, code, kind) => {
    expect(normalizeApiError(status, { code, message: 'raw backend detail' })).toMatchObject({ kind, status })
  })

  it('uses generic safe copy for unknown codes and malformed envelopes', () => {
    expect(normalizeApiError(418, { code: 'future_code', message: 'raw future detail' })).toMatchObject({
      kind: 'request',
      code: undefined,
      message: 'We could not complete your request. Please try again.',
    })
    expect(normalizeApiError(503, '<html>secret server failure</html>').message)
      .toBe('Something went wrong. Please try again.')
  })

  it('does not retain network exception text', () => {
    const error = createNetworkError()
    expect(error.message).toBe('We could not connect. Check your connection and try again.')
    expect(JSON.stringify(error)).not.toContain('password')
  })
})
