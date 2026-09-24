import { createBrowserRouter } from 'react-router-dom'

import { EntryPage, NotFoundPage, RoutePlaceholder } from '@/routes/route-placeholders'
import { routeDefinitions } from '@/routes/route-table'

const router = createBrowserRouter([
  { path: '/', element: <EntryPage /> },
  ...routeDefinitions.map(({ path, label }) => ({
    path,
    element: <RoutePlaceholder path={path} label={label} />,
  })),
  { path: '*', element: <NotFoundPage /> },
])

export { router }
