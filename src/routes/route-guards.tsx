import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LoadingBlock } from '@/components/state-blocks'
import { AuthCard } from '@/components/auth-card'
import { useSession } from '@/routes/use-session'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useSession()

  if (session.status === 'loading') {
    return (
      <AuthCard title="Account" description="Your account page is loading.">
        <LoadingBlock label="Loading account page" />
      </AuthCard>
    )
  }

  if (session.status === 'unauthenticated') {
    return (
      <AuthCard title="Sign in required" description="Sign in to view this account page.">
        <Link to="/login">Go to sign in</Link>
      </AuthCard>
    )
  }

  return children
}

export { ProtectedRoute }
