import { Link } from 'react-router-dom'
import { routeDefinitions } from '@/routes/route-table'

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
  return (
    <main>
      <h1>FeedNow account</h1>
      <p>Choose a page to continue.</p>
      <nav aria-label="Account pages">
        <ul>
          {routeDefinitions.map(({ path, label }) => (
            <li key={path}><Link to={path}>{label}</Link></li>
          ))}
        </ul>
      </nav>
    </main>
  )
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
