type UserSummary = {
  id: string
  display_name: string
  email: string
}

type MeResponse = UserSummary & {
  status: UserStatus
  created_at: string
  updated_at: string
}

type ClientContext = {
  client_id: string
  display_name: string
  logo_url: string | null
  registration_enabled: boolean
}

type SessionResponse =
  | { status: 'unauthenticated'; user: null }
  | { status: 'authenticated'; user: UserSummary }

type AuthOutcome =
  | { status: 'authenticated' }
  | { status: 'verification_required'; challenge_id: string }
  | { status: 'challenge_required'; challenge: { id: string; type: string } }

type ApiKeyEnvironment = 'live' | 'test'
type ApiKeyStatus = 'active' | 'revoked'
type UserStatus = 'active' | 'disabled'

type ApiKeySummary = {
  id: string
  name: string
  environment: ApiKeyEnvironment
  key_prefix: string
  status: ApiKeyStatus
  scopes: string[]
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

type Page<T> = {
  items: T[]
  limit: number
  next_cursor: string | null
}

type ApiKeyCreated = {
  id: string
  name: string
  key: string
  created_at: string
}

type SecurityResponse = {
  email_verified: boolean
  current_session: { created_at: string | null; expires_at: string | null }
}

type RegistrationRequest = {
  email: string
  password: string
  client_id: string
  terms_acknowledgements: { document_id: string; version: string }[]
}

type VerifyEmailRequest = { challenge_id: string; code: string }
type ResendVerificationRequest = { challenge_id: string }
type LoginRequest = {
  email: string
  password: string
  client_id: string | null
  state: string | null
}

export type {
  ApiKeyCreated,
  ApiKeyEnvironment,
  ApiKeySummary,
  ApiKeyStatus,
  AuthOutcome,
  ClientContext,
  LoginRequest,
  MeResponse,
  Page,
  RegistrationRequest,
  ResendVerificationRequest,
  SecurityResponse,
  SessionResponse,
  UserSummary,
  UserStatus,
  VerifyEmailRequest,
}
