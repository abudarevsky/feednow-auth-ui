import type { ApiErrorKind, BackendErrorEnvelope } from '@/types/api'

const SAFE_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'Check the information and try again.',
  unauthenticated: 'Please sign in again to continue.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'We could not find that information.',
  conflict: 'This request conflicts with the current account state. Refresh and try again.',
  rate_limited: 'Too many attempts. Wait a moment and try again.',
  server: 'Something went wrong. Please try again.',
  network: 'We could not connect. Check your connection and try again.',
  malformed_response: 'We could not process the server response. Please try again.',
  request: 'We could not complete your request. Please try again.',
}

const KNOWN_CODES = new Set([
  'validation_error',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'internal_error',
  'rate_limited',
])

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/
const SAFE_FIELD_PATH = /^[A-Za-z0-9_[\].-]{1,128}$/

class ApiRequestError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string | undefined
  readonly requestId: string | undefined
  readonly fields: readonly string[]

  constructor({
    kind,
    status,
    code,
    requestId,
    fields = [],
  }: {
    kind: ApiErrorKind
    status?: number
    code?: string
    requestId?: string
    fields?: readonly string[]
  }) {
    super(SAFE_MESSAGES[kind])
    this.name = 'ApiRequestError'
    this.kind = kind
    this.status = status
    this.code = code
    this.requestId = requestId
    this.fields = fields
  }
}

function kindForResponse(status: number, code?: string): ApiErrorKind {
  if (status === 401 || code === 'unauthenticated') return 'unauthenticated'
  if (status === 403 || code === 'forbidden') return 'forbidden'
  if (status === 404 || code === 'not_found') return 'not_found'
  if (status === 409 || code === 'conflict') return 'conflict'
  if (status === 429 || code === 'rate_limited') return 'rate_limited'
  if (status === 422 || status === 400 || code === 'validation_error') return 'validation'
  if (status >= 500 || code === 'internal_error') return 'server'
  return 'request'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeApiError(status: number, payload: unknown): ApiRequestError {
  const code = isRecord(payload) && typeof payload.code === 'string' && KNOWN_CODES.has(payload.code)
    ? payload.code
    : undefined
  const envelope = isRecord(payload) ? payload as Partial<BackendErrorEnvelope> : undefined
  const fields = Array.isArray(envelope?.field_errors)
    ? envelope.field_errors.flatMap((entry) =>
      typeof entry?.field === 'string' && SAFE_FIELD_PATH.test(entry.field) ? [entry.field] : [],
    )
    : []
  const requestId = typeof envelope?.request_id === 'string' && SAFE_REQUEST_ID.test(envelope.request_id)
    ? envelope.request_id
    : undefined

  return new ApiRequestError({
    kind: kindForResponse(status, code),
    status,
    code,
    requestId,
    fields: [...new Set(fields)],
  })
}

function createNetworkError(): ApiRequestError {
  return new ApiRequestError({ kind: 'network' })
}

function createMalformedResponseError(): ApiRequestError {
  return new ApiRequestError({ kind: 'malformed_response' })
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError'
}

export {
  ApiRequestError,
  createMalformedResponseError,
  createNetworkError,
  isAbortError,
  normalizeApiError,
}
