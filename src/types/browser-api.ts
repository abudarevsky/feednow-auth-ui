type UserStatus = 'active' | 'disabled'

type UserSummary = {
  id: string
  display_name: string
  email: string
}

type BrowserSessionResponse =
  | { status: 'unauthenticated'; user: null }
  | { status: 'authenticated'; user: UserSummary }

type AuthClientContext = {
  client_id: string
  display_name: string
  logo_url: string | null
  registration_enabled: boolean
}

type MeResponse = UserSummary & {
  status: UserStatus
  created_at: string
  updated_at: string
}

type ApiKeyEnvironment = 'live' | 'test'
type ApiKeyStatus = 'active' | 'revoked'

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

export type {
  ApiKeyCreated,
  ApiKeyEnvironment,
  ApiKeySummary,
  ApiKeyStatus,
  AuthClientContext,
  BrowserSessionResponse,
  MeResponse,
  Page,
  UserStatus,
  UserSummary,
}
