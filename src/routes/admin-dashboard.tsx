import { useEffect, useMemo, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { createFeedNowApiClient } from '@/api/client'
import { createAdminApi, type AdminOrganization, type AdminOrganizationDetail, type AdminSummary } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useSession } from '@/routes/use-session'
import type { Page } from '@/types/browser-api'

function formatSuspendedAt(timestamp: string | null) {
  return timestamp ? ` · ${new Date(timestamp).toLocaleDateString()}` : ''
}

function AdminDashboard() {
  const session = useSession()
  const isAdmin = session.status === 'authenticated' && session.user?.application_role === 'admin'
  const api = useMemo(() => createAdminApi(createFeedNowApiClient()), [])
  const [summary, setSummary] = useState<AdminSummary>()
  const [organizations, setOrganizations] = useState<Page<AdminOrganization>>()
  const [details, setDetails] = useState<Record<string, AdminOrganizationDetail>>({})
  const [memberCursors, setMemberCursors] = useState<Record<string, string | null>>({})
  const [refreshingOrganizationId, setRefreshingOrganizationId] = useState<string>()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    const controller = new AbortController()
    void api.summary(controller.signal)
      .then((summaryResponse) => setSummary(summaryResponse.data))
      .catch(() => { if (!controller.signal.aborted) setError('Could not load administration data.') })
    return () => controller.abort()
  }, [api, isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void api.organizations(query, { signal: controller.signal })
        .then((response) => setOrganizations(response.data))
        .catch(() => { if (!controller.signal.aborted) setError('Could not search organizations.') })
    }, 200)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [api, isAdmin, query])

  async function refreshOrganization(id: string) {
    setError('')
    setRefreshingOrganizationId(id)
    try {
      const [organization, members] = await Promise.all([api.organization(id), api.members(id)])
      if (!organization.data || !members.data) throw new Error('Missing organization details.')
      setDetails((current) => ({ ...current, [id]: { ...organization.data!, members: members.data!.items } }))
      setMemberCursors((current) => ({ ...current, [id]: members.data!.next_cursor }))
      setOrganizations((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === id ? {
          ...item,
          name: organization.data!.name,
          name_status: organization.data!.name_status,
          status: organization.data!.status,
          suspended_at: organization.data!.suspended_at,
          created_at: organization.data!.created_at,
          member_count: organization.data!.member_count,
          members: organization.data!.members,
        } : item),
      } : current)
    }
    catch { setError('Could not refresh organization details.') }
    finally { setRefreshingOrganizationId(undefined) }
  }

  async function loadMoreMembers(organizationId: string) {
    const detail = details[organizationId]
    const memberCursor = memberCursors[organizationId]
    if (!detail || !memberCursor) return
    try {
      const page = await api.members(detail.id, { cursor: memberCursor })
      if (!page.data) throw new Error('Missing membership page.')
      setDetails((current) => ({ ...current, [organizationId]: { ...current[organizationId]!, members: [...current[organizationId]!.members, ...page.data!.items] } }))
      setMemberCursors((current) => ({ ...current, [organizationId]: page.data!.next_cursor }))
    } catch { setError('Could not load more organization members.') }
  }

  async function suspendOrganization(organization: AdminOrganization) {
    if (!window.confirm(`Suspend ${organization.name}? Organization operations will be blocked and all organization API keys will be revoked.`)) return
    try {
      await api.suspend(organization.id)
      await refreshOrganization(organization.id)
      const refreshedSummary = await api.summary()
      if (refreshedSummary.data) setSummary(refreshedSummary.data)
    } catch { setError('Could not suspend this organization.') }
  }

  async function reactivateOrganization(organization: AdminOrganization) {
    if (!window.confirm(`Reactivate ${organization.name}? Members will regain organization access. Previously revoked API keys stay revoked.`)) return
    try {
      await api.reactivate(organization.id)
      await refreshOrganization(organization.id)
      const refreshedSummary = await api.summary()
      if (refreshedSummary.data) setSummary(refreshedSummary.data)
    } catch { setError('Could not reactivate this organization.') }
  }

  async function deleteOrganization(organization: AdminOrganization) {
    if (!window.confirm(`Permanently delete ${organization.name} and its organization resources? This cannot be undone.`)) return
    const confirmation = window.prompt(`Type the exact organization name to confirm deletion: ${organization.name}`)
    if (confirmation !== organization.name) return
    try {
      await api.delete(organization.id, confirmation)
      setOrganizations((current) => current ? { ...current, items: current.items.filter((item) => item.id !== organization.id) } : current)
      setDetails((current) => { const next = { ...current }; delete next[organization.id]; return next })
      setSummary((current) => current ? { ...current, organization_count: Math.max(0, current.organization_count - 1) } : current)
    } catch { setError('Could not delete this organization.') }
  }

  if (!isAdmin) {
    return <main className="p-6"><h1 className="text-2xl font-semibold">Administration unavailable</h1><p className="mt-2">You do not have access to this area.</p></main>
  }

  return (
    <main className="space-y-6 p-2 md:p-4">
      <header><p className="text-sm font-medium text-emerald-700">FeedNow</p><h1 className="text-3xl font-semibold">Administration</h1></header>
      {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader><CardTitle>Organizations</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{summary?.organization_count ?? '—'}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active memberships</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{summary?.active_membership_count ?? '—'}</CardContent></Card>
      </div>
      <section aria-labelledby="organizations-title" className="space-y-3">
        <h2 id="organizations-title" className="text-xl font-semibold">Organizations</h2>
        <Input aria-label="Search organizations" placeholder="Search organizations" value={query} onChange={(event) => setQuery(event.target.value)} />
        {!organizations && <p role="status">Loading organizations…</p>}
        {organizations?.items.map((organization) => (
          <Card className="gap-2 py-2" key={organization.id}>
            <details>
              <summary aria-label={`${organization.name} (${organization.member_count})`} className="cursor-pointer list-none px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{organization.name} ({organization.member_count}){organization.suspended_at && <Badge variant="destructive" className="ml-2">Suspended</Badge>}</summary>
              <CardContent className="space-y-3 border-t p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="secondary">{organization.name_status}</Badge><div className="flex items-center gap-3">{organization.is_current_user_owner ? <Badge variant="outline">Your Organization</Badge> : details[organization.id] && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${organization.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{organization.suspended_at || organization.status !== 'active' ? <DropdownMenuItem onSelect={() => void reactivateOrganization(organization)}>Reactivate</DropdownMenuItem> : <DropdownMenuItem onSelect={() => void suspendOrganization(organization)}>Suspend</DropdownMenuItem>}<DropdownMenuItem className="text-destructive" onSelect={() => void deleteOrganization(organization)}>Delete organization</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}<button type="button" className={`text-sm hover:underline disabled:opacity-60 ${details[organization.id] ? 'text-muted-foreground hover:text-foreground' : 'font-medium text-primary'}`} disabled={refreshingOrganizationId === organization.id} onClick={() => void refreshOrganization(organization.id)}>{refreshingOrganizationId === organization.id ? 'Loading details…' : details[organization.id] ? 'Refresh details' : 'View full details'}</button></div></div>
                <p className="text-sm text-muted-foreground">Created {new Date(organization.created_at).toLocaleDateString()}</p>
                <ul className="grid gap-2 sm:grid-cols-2">{organization.members.map((member) => <li key={member.user_id} className="text-sm"><span className="font-medium">{member.display_name}</span><br />{member.email} · {member.role}</li>)}</ul>
                {details[organization.id] && <div className="space-y-3 rounded-md bg-muted/40 p-3"><div className="flex items-center justify-between"><h3 className="font-medium">Organization details</h3>{details[organization.id].suspended_at && <Badge variant="destructive">Suspended{formatSuspendedAt(details[organization.id].suspended_at)}</Badge>}</div><p className="break-all text-sm">Name: {details[organization.id].name} · {details[organization.id].id} · {details[organization.id].name_status} · {details[organization.id].status} · Created {new Date(details[organization.id].created_at).toLocaleDateString()}</p><h4 className="font-medium">Members</h4><ul>{details[organization.id].members.map((member) => <li key={member.user_id} className="py-1 text-sm">{member.display_name} · {member.email} · {member.role} · account {member.account_status} · membership {member.membership_status} · Registered {new Date(member.registered_at).toLocaleDateString()} · Joined {new Date(member.joined_at).toLocaleDateString()}</li>)}</ul>{memberCursors[organization.id] && <button className="text-sm text-primary underline" onClick={() => void loadMoreMembers(organization.id)}>Load more members</button>}<h4 className="font-medium">Services</h4><p className="text-sm">{details[organization.id].services.map((service) => service.name).join(', ') || 'No services'}</p></div>}
              </CardContent>
            </details>
          </Card>
        ))}
        {organizations?.items.length === 0 && <p>No organizations found.</p>}
        {organizations?.next_cursor && <button className="text-sm text-primary underline" onClick={() => { void api.organizations(query, { cursor: organizations.next_cursor ?? undefined }).then((response) => setOrganizations((current) => current ? ({ ...response.data!, items: [...current.items, ...response.data!.items] }) : response.data)) }}>Load more</button>}
      </section>
    </main>
  )
}

export { AdminDashboard }
