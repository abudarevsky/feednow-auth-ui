import { Link } from 'react-router-dom'

import { AccountShell } from '@/components/account-shell'
import { AuthCard } from '@/components/auth-card'
import { accountRouteDefinitions } from '@/routes/route-table'

function PublicRouteLayout({ path, label }: { path: string; label: string }) {
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

function AccountRouteLayout({ path, label }: { path: string; label: string }) {
  return (
    <AccountShell
      items={accountRouteDefinitions.map(({ path: to, label: itemLabel }) => ({
        to,
        label: itemLabel,
      }))}
    >
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">{label}</h1>
        <p>This account page is not available yet.</p>
        <p className="text-sm text-muted-foreground">Route: {path}</p>
      </div>
    </AccountShell>
  )
}

export { AccountRouteLayout, PublicRouteLayout }
