import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/routes/use-session'
import type { ApiKeySummary, Page } from '@/types/browser-api'

type Organization = {
  id: string
  name: string
  type: string
  created_at: string
}
type Member = { user_id: string; role: string; status: string; created_at: string }
type Service = { id: string; name: string; description: string; url: string; status: string }

function Home({ pageTitle = 'Overview' }: { pageTitle?: string } = {}) {
  const session = useSession()
  const [organization, setOrganization] = useState<Organization>()
  const [keys, setKeys] = useState<ApiKeySummary[]>([])
  const [keyName, setKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string>()
  const [services, setServices] = useState<Service[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [error, setError] = useState('')

  async function load() {
    const servicesResponse = await fetch('/api/v1/services', { credentials: 'same-origin' })
    if (!servicesResponse.ok) throw new Error('Could not load available services.')
    setServices((await servicesResponse.json() as { items: Service[] }).items)
    const response = await fetch('/api/v1/organizations?limit=1', { credentials: 'same-origin' })
    if (!response.ok) throw new Error('Could not load your organization.')
    const page = await response.json() as Page<Organization>
    const current = page.items[0]
    setOrganization(current)
    if (current) {
      const keyResponse = await fetch(`/api/v1/organizations/${encodeURIComponent(current.id)}/api-keys?limit=100`, { credentials: 'same-origin' })
      if (!keyResponse.ok) throw new Error('Could not load API keys.')
      const keyPage = await keyResponse.json() as Page<ApiKeySummary>
      setKeys(keyPage.items)
      const memberResponse = await fetch(`/api/v1/organizations/${encodeURIComponent(current.id)}/members?limit=100`, { credentials: 'same-origin' })
      if (!memberResponse.ok) throw new Error('Could not load organization membership.')
      setMembers((await memberResponse.json() as Page<Member>).items)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load your account.'))
  }, [])

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organization || !keyName.trim()) return
    setError('')
    try {
      const response = await fetch(`/api/v1/organizations/${encodeURIComponent(organization.id)}/api-keys`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim(), environment: 'test', scopes: [] }),
      })
      if (!response.ok) throw new Error('Could not create API key.')
      const result = await response.json() as { key: string }
      setCreatedKey(result.key)
      setKeyName('')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create API key.')
    }
  }

  async function revokeKey(id: string) {
    if (!organization) return
    const response = await fetch(`/api/v1/organizations/${encodeURIComponent(organization.id)}/api-keys/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' })
    if (!response.ok) setError('Could not revoke this API key.')
    else await load()
  }

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
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-medium text-emerald-700">FeedNow Account</p><h1 className="mt-1 text-3xl font-semibold">{pageTitle}</h1></div>
        <Button variant="outline" onClick={logout}>Log out</Button>
      </header>
      {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <h2 className="text-xl font-semibold">{organization?.name ?? 'Loading organization…'}</h2>
            {organization?.type === 'personal' && <Badge variant="secondary">Personal organization</Badge>}
            {organization && <p className="text-sm text-muted-foreground">Created {new Date(organization.created_at).toLocaleDateString()}</p>}
            {organization && <p className="text-sm">Members: {members.filter((member) => member.status === 'active').length}</p>}
            {session.user && <p className="text-sm">Your role: {members.find((member) => member.user_id === session.user?.id)?.role ?? '—'}</p>}
            <Button variant="outline" disabled>Edit organization name</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {session.user?.display_name ?? '—'}</p>
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
      <Card>
        <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {createdKey && <div role="status" className="rounded-md border border-emerald-700 p-4"><p className="font-medium">Copy this key now. It cannot be retrieved again.</p><code className="mt-2 block break-all">{createdKey}</code><Button className="mt-2" variant="outline" onClick={() => navigator.clipboard.writeText(createdKey)}>Copy key</Button><Button className="ml-2 mt-2" variant="ghost" onClick={() => setCreatedKey(undefined)}>Dismiss</Button></div>}
          <form onSubmit={createKey} className="flex flex-wrap gap-2"><Input aria-label="Key name" placeholder="Development integration" value={keyName} onChange={(event) => setKeyName(event.target.value)} /><Button disabled={!organization || !keyName.trim()}>Create test key</Button></form>
          {keys.length === 0 ? <p className="text-sm text-muted-foreground">No API keys yet.</p> : <ul className="divide-y">{keys.map((key) => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{key.name}</p><p className="text-sm text-muted-foreground">{key.key_prefix} · Created {new Date(key.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><Badge variant={key.status === 'active' ? 'default' : 'secondary'}>{key.status}</Badge>{key.status === 'active' && <Button variant="destructive" size="sm" onClick={() => revokeKey(key.id)}>Revoke</Button>}</div></li>)}</ul>}
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2"><Card><CardHeader><CardTitle>Subscription</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Subscription information is not available yet.</p></CardContent></Card><Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Usage information is not available yet.</p></CardContent></Card></div>
    </main>
  )
}

export { Home }
