import { useEffect, useState } from 'react'

import { SessionProvider } from '@/routes/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import type { SessionState } from '@/types/session'

export default function App({ session: initialSession }: { session?: SessionState }) {
  const [session, setSession] = useState<SessionState>(initialSession ?? { status: 'loading' })

  useEffect(() => {
    if (initialSession) return
    const controller = new AbortController()
    fetch('/api/v1/me', { credentials: 'same-origin', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setSession({ status: 'unauthenticated' })
          return
        }
        if (!response.ok) {
          setSession({ status: 'error' })
          return
        }
        const user = await response.json()
        setSession({ status: 'authenticated', user })
      })
      .catch(() => {
        if (!controller.signal.aborted) setSession({ status: 'error' })
      })
    return () => controller.abort()
  }, [initialSession])

  return (
    <SessionProvider value={session}>
      <RouterProvider router={router} />
      <Toaster />
    </SessionProvider>
  )
}
