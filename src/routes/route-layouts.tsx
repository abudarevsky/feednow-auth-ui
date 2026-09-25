import { Link } from 'react-router-dom'

import { AuthCard } from '@/components/auth-card'
import { AccountShell } from '@/components/account-shell'
import { Home } from '@/routes/home'
import { accountRouteDefinitions } from '@/routes/route-table'

function PublicRouteLayout({ path, label }: { path: string; label: string }) {
  if (path === '/login' || path === '/signup') {
    return <AuthCard title={label} description="Secure sign in and registration are handled by FeedNow and Cognito Managed Login."><a className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/api/oauth/login?select_account=true">Continue with FeedNow</a></AuthCard>
  }
  return (
    <AuthCard title={label} description="FeedNow account">
      <p>This page is not available yet.</p>
      <p className="mt-3 text-sm">Route: {path}</p>
      <nav className="mt-4" aria-label="Account access">
        <Link to="/login">Sign in</Link>
        {' · '}
        <Link to="/signup">Create account</Link>
      </nav>
    </AuthCard>
  )
}

function AccountRouteLayout({ label }: { path: string; label: string }) {
  return <AccountShell items={accountRouteDefinitions.map(({ path, label: itemLabel }) => ({ to: path, label: itemLabel }))}><Home pageTitle={label} /></AccountShell>
}

export { AccountRouteLayout, PublicRouteLayout }
