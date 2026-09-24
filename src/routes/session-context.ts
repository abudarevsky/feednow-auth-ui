import { createContext } from 'react'

import type { SessionState } from '@/types/session'

const SessionContext = createContext<SessionState>({ status: 'loading' })

export { SessionContext }
