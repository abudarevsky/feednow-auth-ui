import { render, screen } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/routes/session-provider'
import { AccountRouteLayout, PublicRouteLayout } from '@/routes/route-layouts'

describe('route layouts', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('places public pages in the shared auth card with one page heading', () => {
    render(<MemoryRouter><PublicRouteLayout path="/forgot-password" label="Forgot password" /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Forgot password' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Account access' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('shows account navigation links and marks the current account page', () => {
    const router = createMemoryRouter([
      { path: '/account', element: <AccountRouteLayout path="/account" label="Account" /> },
    ], { initialEntries: ['/account'] })
    render(
      <SessionProvider value={{ status: 'authenticated' }}>
        <RouterProvider router={router} />
      </SessionProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'API keys' })).toHaveAttribute('href', '/account/api-keys')
    expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument()
  })

  it('shows administration navigation only for an application administrator', () => {
    const router = createMemoryRouter([
      { path: '/account', element: <AccountRouteLayout path="/account" label="Account" /> },
    ], { initialEntries: ['/account'] })
    render(
      <SessionProvider value={{ status: 'authenticated', user: { id: 'usr_admin', display_name: 'Admin', email: 'admin@example.test', status: 'active', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z', application_role: 'admin' } }}>
        <RouterProvider router={router} />
      </SessionProvider>,
    )
    expect(screen.getByRole('link', { name: 'Administration' })).toHaveAttribute('href', '/account/admin')
  })

  it('keeps billing available and displays suspension status for a suspended organization', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ id: 'org_suspended', name: 'FeedNow.io', type: 'business', created_at: '2026-09-26T00:00:00Z', name_status: 'confirmed', status: 'disabled', suspended_at: '2026-09-26T01:00:00Z' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    const router = createMemoryRouter([
      { path: '/account/billing', element: <AccountRouteLayout path="/account/billing" label="Billing" /> },
    ], { initialEntries: ['/account/billing'] })
    render(
      <SessionProvider value={{ status: 'authenticated' }}>
        <RouterProvider router={router} />
      </SessionProvider>,
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/FeedNow.io is suspended/)
    expect(screen.getByRole('heading', { level: 1, name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Billing' })).toHaveAttribute('aria-current', 'page')
  })
})
