import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Home } from '@/routes/home'
import { SessionProvider } from '@/routes/session-provider'

describe('account dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'feednow_csrf=; Max-Age=0; path=/'
  })

  it('lists all organizations as expandable cards and keeps API keys off the account page', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/services')) return Response.json({ items: [{ id: 'vispector', name: 'Vispector', description: 'Visual analysis and inspection', url: 'http://localhost:5173', status: 'active' }] })
      if (url.includes('/members')) return Response.json({ items: [{ user_id: 'usr_01ARZ3NDEKTSV4RRFFQ69G5FAV', role: 'owner', status: 'active', created_at: '2026-09-25T00:00:00Z' }], limit: 100, next_cursor: null })
      return Response.json({ items: [
        { id: 'org_01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Jordan Lee Organization', name_status: 'confirmed', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' },
        { id: 'org_01ARZ3NDEKTSV4RRFFQ69G5FAW', name: 'FeedNow.io', name_status: 'confirmed', status: 'disabled', suspended_at: '2026-09-26T10:00:00Z', type: 'customer', created_at: '2026-09-26T00:00:00Z' },
      ], limit: 100, next_cursor: null })
    }))
    render(<MemoryRouter><SessionProvider value={{ status: 'authenticated', user: { id: 'usr_01ARZ3NDEKTSV4RRFFQ69G5FAV', display_name: 'Jordan Lee', email: 'jordan@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><Home /></SessionProvider></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    const personalOrganization = await screen.findByText('Jordan Lee Organization (1)')
    expect(personalOrganization.tagName.toLowerCase()).toBe('summary')
    fireEvent.click(personalOrganization)
    expect(await screen.findByText('org_01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBeInTheDocument()
    expect(screen.getByText('FeedNow.io (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Suspended')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Vispector' })).toBeInTheDocument()
    expect(screen.queryByText('API Keys')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create test key' })).not.toBeInTheDocument()
  })

  it('renames an organization and displays the confirmed name status', async () => {
    document.cookie = 'feednow_csrf=csrf-test-token; path=/'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'PATCH') return Response.json({ id: 'org_01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Jordan Lee Workspace', name_status: 'confirmed', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' })
      if (url.includes('/services')) return Response.json({ items: [] })
      if (url.includes('/members')) return Response.json({ items: [], limit: 100, next_cursor: null })
      return Response.json({ items: [{ id: 'org_01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Jordan Lee Organization', name_status: 'confirmed', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' }], limit: 1, next_cursor: null })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><SessionProvider value={{ status: 'authenticated', user: { id: 'usr_01ARZ3NDEKTSV4RRFFQ69G5FAV', display_name: 'Jordan Lee', email: 'jordan@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><Home /></SessionProvider></MemoryRouter>)

    fireEvent.click(await screen.findByText('Jordan Lee Organization (0)'))
    fireEvent.click(await screen.findByRole('button', { name: 'Edit organization name' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Organization name' }), { target: { value: 'Jordan Lee Workspace' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }))
    expect(await screen.findByText('Confirmed name')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/organizations/'), expect.objectContaining({ method: 'PATCH' }))
    expect(new Headers(fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')?.[1]?.headers).get('X-CSRF-Token')).toBe('csrf-test-token')
  })

  it('labels first and last name fields in the profile editor', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/services')) return Response.json({ items: [] })
      if (url.includes('/members')) return Response.json({ items: [], limit: 100, next_cursor: null })
      return Response.json({ items: [{ id: 'org_profile', name: 'Jordan Workspace', name_status: 'confirmed', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' }], limit: 100, next_cursor: null })
    }))
    render(<MemoryRouter><SessionProvider value={{ status: 'authenticated', user: { id: 'usr_profile', display_name: 'Jordan Lee', email: 'jordan@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><Home /></SessionProvider></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }))

    expect(screen.getByLabelText('First name')).toHaveAttribute('id', 'profile-first-name')
    expect(screen.getByLabelText('Last name')).toHaveAttribute('id', 'profile-last-name')
    expect(screen.getByText('First name').tagName).toBe('LABEL')
    expect(screen.getByText('Last name').tagName).toBe('LABEL')
  })

  it('shows onboarding fields for a placeholder organization', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/services')) return Response.json({ items: [] })
      if (String(input).includes('/members')) return Response.json({ items: [], limit: 100, next_cursor: null })
      return Response.json({ items: [{ id: 'org_new', name: 'New user Workspace', name_status: 'placeholder', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' }], limit: 1, next_cursor: null })
    }))
    render(<MemoryRouter><SessionProvider value={{ status: 'authenticated', user: { id: 'usr_new', display_name: 'New user', email: 'new@example.com', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' } }}><Home /></SessionProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Welcome to FeedNow' })).toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument()
    expect(screen.getByText('Your email did not include a surname. You can continue with just your first name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
  })
})
