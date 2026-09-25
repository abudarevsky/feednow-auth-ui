import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { EntryPage, NotFoundPage, RoutePlaceholder } from '@/routes/route-placeholders'
import { routeDefinitions } from '@/routes/route-table'
import { SessionProvider } from '@/routes/session-provider'

describe('account route table', () => {
  it('renders a named page for every canonical auth and account path', async () => {
    for (const { path, label } of routeDefinitions) {
      const router = createMemoryRouter([
        { path, element: <RoutePlaceholder path={path} label={label} /> },
      ], { initialEntries: [path] })
      const { unmount } = render(<RouterProvider router={router} />)
      expect(await screen.findByRole('heading', { name: label })).toBeInTheDocument()
      expect(screen.getByText(`Route: ${path}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('provides a deliberate entry page and unknown-route fallback', () => {
    const entryRouter = createMemoryRouter([{ path: '/', element: <EntryPage /> }])
    const { unmount } = render(<SessionProvider value={{ status: 'loading' }}><RouterProvider router={entryRouter} /></SessionProvider>)
    expect(screen.getByRole('heading', { name: 'FeedNow account' })).toBeInTheDocument()
    unmount()

    const fallbackRouter = createMemoryRouter([{ path: '*', element: <NotFoundPage /> }], {
      initialEntries: ['/unknown'],
    })
    render(<RouterProvider router={fallbackRouter} />)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
