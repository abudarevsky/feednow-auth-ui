import type { MeResponse } from '@/types/browser-api'

type SessionState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error' }
  | { status: 'authenticated'; user?: MeResponse }

export type { SessionState }
