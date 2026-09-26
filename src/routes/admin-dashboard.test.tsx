import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminDashboard } from '@/routes/admin-dashboard'
import { SessionProvider } from '@/routes/session-provider'

describe('admin dashboard', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('loads real summary and organization search results for an admin', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/summary')) return Response.json({ organization_count: 2, active_membership_count: 3 })
      if (url.endsWith('/org_1')) return Response.json({ id: 'org_1', name: 'Acme Updated', name_status: 'confirmed', status: 'active', suspended_at: null, created_at: '2026-09-25T00:00:00Z', member_count: 2, members: [], services: [], api_keys: [] })
      if (url.includes('/members')) return Response.json({ items: [{ user_id: 'usr_1', display_name: 'Jordan Lee', email: 'jordan@example.com', role: 'owner', account_status: 'active', registered_at: '2026-09-25T00:00:00Z', joined_at: '2026-09-25T00:00:00Z' }], limit: 20, next_cursor: null })
      return Response.json({ items: [{ id: 'org_1', name: 'Acme', name_status: 'confirmed', status: 'active', suspended_at: null, created_at: '2026-09-25T00:00:00Z', member_count: 1, members: [{ user_id: 'usr_1', display_name: 'Jordan Lee', email: 'jordan@example.com', account_status: 'active', role: 'owner', registered_at: '2026-09-25T00:00:00Z', joined_at: '2026-09-25T00:00:00Z' }] }], limit: 20, next_cursor: null })
    }))
    render(<SessionProvider value={{ status: 'authenticated', user: { id: 'usr_1', display_name: 'Admin', email: 'admin@example.com', status: 'active', application_role: 'admin', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><AdminDashboard /></SessionProvider>)
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
    const summary = await screen.findByLabelText('Acme (1)')
    fireEvent.click(summary)
    expect(screen.getByText(/jordan@example.com/)).toBeInTheDocument()
    const viewDetails = screen.getByRole('button', { name: 'View full details' })
    expect(viewDetails).toHaveClass('text-primary')
    fireEvent.click(viewDetails)
    const details = await screen.findByText('Organization details')
    expect(summary.closest('details')).toContainElement(details)
    expect(await screen.findByLabelText('Acme Updated (2)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh details' })).toHaveClass('text-muted-foreground')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Acme Updated' }), { button: 0 })
    expect(await screen.findByRole('menuitem', { name: 'Suspend' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete organization' })).toBeInTheDocument()
  })

  it('shows suspension badges in the organization list and loaded details', async () => {
    let suspended = true
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/reactivate') && init?.method === 'POST') {
        suspended = false
        return new Response(null, { status: 204 })
      }
      if (url.endsWith('/summary')) return Response.json({ organization_count: 1, active_membership_count: 0 })
      if (url.includes('/members')) return Response.json({ items: [], limit: 20, next_cursor: null })
      const organization = { id: 'org_1', name: 'Suspended Co', name_status: 'confirmed', status: suspended ? 'disabled' : 'active', suspended_at: suspended ? '2026-09-26T10:00:00Z' : null, created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-26T10:00:00Z', member_count: 0, members: [], services: [], api_keys: [] }
      return Response.json(url.endsWith('/org_1') ? organization : { items: [organization], limit: 20, next_cursor: null })
    })
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'feednow_csrf=test-csrf; path=/'
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SessionProvider value={{ status: 'authenticated', user: { id: 'usr_admin', display_name: 'Admin', email: 'admin@example.com', status: 'active', application_role: 'admin', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><AdminDashboard /></SessionProvider>)
    expect(await screen.findByText('Suspended')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View full details' }))
    await waitFor(() => expect(screen.getAllByText(/Suspended/)).toHaveLength(2))
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Suspended Co' }), { button: 0 })
    expect(await screen.findByRole('menuitem', { name: 'Reactivate' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Suspend' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reactivate' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/admin/organizations/org_1/reactivate', expect.objectContaining({ method: 'POST' })))
    await waitFor(() => expect(screen.queryByText('Suspended')).not.toBeInTheDocument())
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Suspended Co' }), { button: 0 })
    expect(await screen.findByRole('menuitem', { name: 'Suspend' })).toBeInTheDocument()
  })

  it('does not call administration APIs for ordinary users', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<SessionProvider value={{ status: 'authenticated', user: { id: 'usr_1', display_name: 'User', email: 'user@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><AdminDashboard /></SessionProvider>)
    expect(screen.getByRole('heading', { name: 'Administration unavailable' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
