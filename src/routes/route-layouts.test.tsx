import { render, screen } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SessionProvider } from '@/routes/session-provider'
import { AccountRouteLayout, PublicRouteLayout } from '@/routes/route-layouts'

describe('route layouts', () => {
  it('places public pages in the shared auth card with one page heading', () => {
    render(<MemoryRouter><PublicRouteLayout path="/forgot-password" label="Forgot password" /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Forgot password' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Account access' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('shows account navigation links and marks the current account page', () => {
    const router = createMemoryRouter([
      { path: '/account/security', element: <AccountRouteLayout path="/account/security" label="Security" /> },
    ], { initialEntries: ['/account/security'] })
    render(
      <SessionProvider value={{ status: 'authenticated' }}>
        <RouterProvider router={router} />
      </SessionProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Security' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'API keys' })).toHaveAttribute('href', '/account/api-keys')
  })
})
