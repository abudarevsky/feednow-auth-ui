type BackendFieldError = {
  field: string
  message: string
}

type BackendErrorEnvelope = {
  code: string
  message: string
  field_errors?: BackendFieldError[]
  request_id?: string | null
}

type ApiErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'malformed_response'
  | 'request'

export type { ApiErrorKind, BackendErrorEnvelope, BackendFieldError }
