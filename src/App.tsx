import { SessionProvider } from '@/routes/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import type { SessionState } from '@/types/session'

export default function App({ session = { status: 'loading' } }: { session?: SessionState }) {
  return (
    <SessionProvider value={session}>
      <RouterProvider router={router} />
      <Toaster />
    </SessionProvider>
  )
}
