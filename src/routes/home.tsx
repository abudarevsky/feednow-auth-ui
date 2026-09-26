import { useCallback, useEffect, useMemo, useState } from 'react'

import { createFeedNowApiClient } from '@/api/client'
import { createOrganizationsApi, type Organization } from '@/api/organizations'
import { createMeApi } from '@/api/me'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/routes/use-session'
import type { Page } from '@/types/browser-api'
type Member = { user_id: string; role: string; status: string; created_at: string }
type Service = { id: string; name: string; description: string; url: string; status: string }

function Home({ pageTitle = 'Overview' }: { pageTitle?: string } = {}) {
  const session = useSession()
  const organizationsApi = useMemo(() => createOrganizationsApi(createFeedNowApiClient()), [])
  const meApi = useMemo(() => createMeApi(createFeedNowApiClient()), [])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [members, setMembers] = useState<Record<string, Member[]>>({})
  const [error, setError] = useState('')
  const [editingOrganizationId, setEditingOrganizationId] = useState<string>()
  const [organizationName, setOrganizationName] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [onboardingOrgName, setOnboardingOrgName] = useState('')
  const onboardingOrganization = organizations.find((organization) => organization.name_status === 'placeholder' && organization.status === 'active' && !organization.suspended_at)

  const load = useCallback(async () => {
    const servicesResponse = await fetch('/api/v1/services', { credentials: 'same-origin', cache: 'no-store' })
    if (!servicesResponse.ok) throw new Error('Could not load available services.')
    setServices((await servicesResponse.json() as { items: Service[] }).items)
    const allOrganizations: Organization[] = []
    let organizationCursor: string | undefined
    do {
      const page = await organizationsApi.list({ limit: 100, cursor: organizationCursor })
      if (!page.data) throw new Error('Could not load your organizations.')
      allOrganizations.push(...page.data.items)
      organizationCursor = page.data.next_cursor ?? undefined
    } while (organizationCursor)
    setOrganizations(allOrganizations)
    setOrganizationsLoaded(true)
    const membershipEntries = await Promise.all(allOrganizations.map(async (org) => {
      if (org.status !== 'active' || org.suspended_at) return [org.id, []] as const
      const allMembers: Member[] = []
      let cursor: string | undefined
      do {
        const query = new URLSearchParams({ limit: '100' })
        if (cursor) query.set('cursor', cursor)
        const response = await fetch(`/api/v1/organizations/${encodeURIComponent(org.id)}/members?${query}`, { credentials: 'same-origin', cache: 'no-store' })
        if (!response.ok) throw new Error('Could not load organization membership.')
        const page = await response.json() as Page<Member>
        allMembers.push(...page.items)
        cursor = page.next_cursor ?? undefined
      } while (cursor)
      return [org.id, allMembers] as const
    }))
    setMembers(Object.fromEntries(membershipEntries))
  }, [organizationsApi])

  async function saveOrganizationName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingOrganizationId || !organizationName.trim()) return
    setError('')
    try {
      const response = await organizationsApi.rename(editingOrganizationId, organizationName.trim())
      if (!response.data) throw new Error('Could not update organization name.')
      setOrganizations((current) => current.map((organization) => organization.id === response.data?.id ? response.data! : organization))
      setEditingOrganizationId(undefined)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update organization name.')
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!firstName.trim() || !lastName.trim() || (onboardingOrganization && !onboardingOrgName.trim())) return
    setError('')
    try {
      await meApi.updateProfile(displayName)
      if (onboardingOrganization) {
        await organizationsApi.rename(onboardingOrganization.id, onboardingOrgName.trim())
        window.location.reload()
      } else {
        setEditingProfile(false)
        window.location.reload()
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your profile.')
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load your account.'))
  }, [load])

  async function logout() {
    try {
      const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
      if (!response.ok) throw new Error('Sign-out request failed')
      const result = await response.json() as { logout_url: string }
      window.location.assign(result.logout_url)
    } catch {
      setError('Could not sign out. Please try again.')
    }
  }

  if (session.status !== 'authenticated') return null
  if (onboardingOrganization) return <main className="mx-auto min-h-screen max-w-xl space-y-5 p-6 md:p-10"><p className="text-sm font-medium text-emerald-700">FeedNow Account</p><h1 className="text-3xl font-semibold">Welcome to FeedNow</h1><p className="text-muted-foreground">Set up your profile and organization to finish creating your account.</p>{error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}<form onSubmit={saveProfile} className="space-y-4"><div><label htmlFor="onboard-first" className="mb-1 block text-sm font-medium">First name</label><Input id="onboard-first" autoComplete="given-name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div><div><label htmlFor="onboard-last" className="mb-1 block text-sm font-medium">Last name</label><Input id="onboard-last" autoComplete="family-name" required value={lastName} onChange={(event) => setLastName(event.target.value)} /></div><div><label htmlFor="onboard-org" className="mb-1 block text-sm font-medium">Organization name</label><Input id="onboard-org" required value={onboardingOrgName} onChange={(event) => setOnboardingOrgName(event.target.value)} /></div><Button disabled={!firstName.trim() || !lastName.trim() || !onboardingOrgName.trim()}>Complete setup</Button></form></main>
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-medium text-emerald-700">FeedNow Account</p><h1 className="mt-1 text-3xl font-semibold">{pageTitle}</h1></div>
        <Button variant="outline" onClick={logout}>Log out</Button>
      </header>
      {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Organizations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {organizations.length === 0 && !organizationsLoaded && <p role="status" className="text-sm text-muted-foreground">Loading organizations…</p>}
            {organizationsLoaded && organizations.length === 0 && <p className="text-sm text-muted-foreground">No organizations yet.</p>}
            {organizations.map((organization) => {
              const organizationMembers = members[organization.id] ?? []
              const activeMemberCount = organization.suspended_at || organization.status !== 'active'
                ? Math.max(1, organizationMembers.filter((member) => member.status === 'active').length)
                : organizationMembers.filter((member) => member.status === 'active').length
              return <details key={organization.id} className="rounded-lg border p-3">
                <summary className="cursor-pointer list-none font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{organization.name} ({activeMemberCount}){organization.suspended_at && <Badge variant="destructive" className="ml-2">Suspended</Badge>}</summary>
                <div className="space-y-3 pt-3">
                  <p className="break-all text-xs text-muted-foreground">{organization.id}</p>
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{organization.name_status === 'confirmed' ? 'Confirmed name' : 'Placeholder name'}</Badge>{organization.type === 'personal' && <Badge variant="secondary">Personal organization</Badge>}{organization.suspended_at && <Badge variant="destructive">Suspended</Badge>}</div>
                  <p className="text-sm text-muted-foreground">Created {new Date(organization.created_at).toLocaleDateString()} · Your role: {organizationMembers.find((member) => member.user_id === session.user?.id)?.role ?? '—'}</p>
                  {editingOrganizationId === organization.id ? <form onSubmit={saveOrganizationName} className="flex flex-wrap gap-2"><Input aria-label="Organization name" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /><Button disabled={!organizationName.trim()}>Save name</Button><Button type="button" variant="outline" onClick={() => setEditingOrganizationId(undefined)}>Cancel</Button></form> : <Button variant="outline" onClick={() => { setOrganizationName(organization.name); setEditingOrganizationId(organization.id) }}>Edit organization name</Button>}
                </div>
              </details>
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {session.user?.display_name ?? '—'}</p>
            {editingProfile ? <form onSubmit={saveProfile} className="space-y-3"><div><label htmlFor="profile-first-name" className="mb-1 block text-sm font-medium">First name</label><Input id="profile-first-name" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div><div><label htmlFor="profile-last-name" className="mb-1 block text-sm font-medium">Last name</label><Input id="profile-last-name" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></div><div className="flex flex-wrap gap-2"><Button disabled={!firstName.trim() || !lastName.trim()}>Save profile</Button><Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button></div></form> : <Button variant="outline" onClick={() => { const names = (session.user?.display_name ?? '').split(' '); setFirstName(names.shift() ?? ''); setLastName(names.join(' ')); setEditingProfile(true) }}>Edit profile</Button>}
            <p><span className="font-medium">Email:</span> {session.user?.email ?? '—'}</p>
            <p><span className="font-medium">Status:</span> {session.user?.status ?? 'active'}</p>
            <p><span className="font-medium">Registered:</span> {session.user ? new Date(session.user.created_at).toLocaleDateString() : '—'}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Your Services</CardTitle></CardHeader>
        <CardContent className="space-y-3">{services.map((service) => <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div><h2 className="font-semibold">{service.name}</h2><p className="text-sm text-muted-foreground">{service.description}</p></div><div className="flex items-center gap-3"><Badge>{service.status}</Badge><a className="text-sm font-medium text-primary underline" href={service.url}>Open {service.name}</a></div></div>)}</CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2"><Card><CardHeader><CardTitle>Subscription</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Subscription information is not available yet.</p></CardContent></Card><Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Usage information is not available yet.</p></CardContent></Card></div>
    </main>
  )
}

export { Home }
