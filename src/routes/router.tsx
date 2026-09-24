import { createBrowserRouter } from 'react-router-dom'

import { EntryPage, NotFoundPage } from '@/routes/route-placeholders'
import { AccountRouteLayout, PublicRouteLayout } from '@/routes/route-layouts'
import { routeDefinitions } from '@/routes/route-table'
import { ProtectedRoute } from '@/routes/route-guards'

const router = createBrowserRouter([
  { path: '/', element: <EntryPage /> },
  ...routeDefinitions.map(({ path, label }) => ({
    path,
    element: path.startsWith('/account') ? (
      <ProtectedRoute><AccountRouteLayout path={path} label={label} /></ProtectedRoute>
    ) : <PublicRouteLayout path={path} label={label} />,
  })),
  { path: '*', element: <NotFoundPage /> },
])

export { router }
