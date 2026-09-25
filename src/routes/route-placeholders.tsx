import { Link, Navigate } from 'react-router-dom'
import { AuthCard } from '@/components/auth-card'
import { LoadingBlock } from '@/components/state-blocks'
import { useSession } from '@/routes/use-session'

function RoutePlaceholder({ path, label }: { path: string; label: string }) {
  return (
    <main>
      <h1>{label}</h1>
      <p>This page is not available yet.</p>
      <p>Route: {path}</p>
    </main>
  )
}

function EntryPage() {
  const session = useSession()
  if (session.status === 'loading') {
    return <AuthCard title="FeedNow account" description="Checking your account session."><LoadingBlock label="Checking account session" /></AuthCard>
  }
  if (session.status === 'authenticated') return <Navigate to="/account" replace />
  if (session.status === 'unauthenticated') return <Navigate to="/login" replace />
  return <AuthCard title="Account unavailable" description="FeedNow could not check your session."><p role="alert">Try again when the account service is available.</p><button className="mt-4 underline" onClick={() => window.location.reload()}>Try again</button></AuthCard>
}

function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link to="/login">Go to sign in</Link>
    </main>
  )
}

export { EntryPage, NotFoundPage, RoutePlaceholder }
