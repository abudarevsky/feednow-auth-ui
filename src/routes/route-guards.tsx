import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LoadingBlock } from '@/components/state-blocks'
import { useSession } from '@/routes/use-session'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useSession()

  if (session.status === 'loading') {
    return <LoadingBlock />
  }

  if (session.status === 'unauthenticated') {
    return (
      <main>
        <h1>Sign in required</h1>
        <p>Sign in to view this account page.</p>
        <Link to="/login">Go to sign in</Link>
      </main>
    )
  }

  return children
}

export { ProtectedRoute }
