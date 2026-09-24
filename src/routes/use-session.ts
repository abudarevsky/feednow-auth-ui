import { useContext } from 'react'

import { SessionContext } from '@/routes/session-context'

function useSession() {
  return useContext(SessionContext)
}

export { useSession }
