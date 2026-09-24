import type { ReactNode } from 'react'

import { SessionContext } from '@/routes/session-context'
import type { SessionState } from '@/types/session'

function SessionProvider({ value, children }: { value: SessionState; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export { SessionProvider }
