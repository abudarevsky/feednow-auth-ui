import { useEffect, useState } from 'react'

import { SessionProvider } from '@/routes/session-provider'
import { createApiClient } from '@/api/client'
import { createCsrfApi } from '@/api/csrf'
import { BrandHeader } from '@/components/brand-header'
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
        // Writes use the backend's readable, same-origin CSRF cookie. Bootstrap
        // it before exposing the authenticated routes, so their first mutation
        // cannot fail locally just because no write has happened yet.
        try {
          await createCsrfApi(createApiClient()).bootstrap(controller.signal)
        } catch (error) {
          if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return
          // Keep the authenticated session visible if CSRF bootstrap is
          // temporarily unavailable. Unsafe requests still fail closed in the
          // API client until a readable token is available.
        }
        setSession({ status: 'authenticated', user })
      })
      .catch(() => {
        if (!controller.signal.aborted) setSession({ status: 'error' })
      })
    return () => controller.abort()
  }, [initialSession])

  return (
    <SessionProvider value={session}>
      <BrandHeader />
      <RouterProvider router={router} />
      <Toaster />
    </SessionProvider>
  )
}
