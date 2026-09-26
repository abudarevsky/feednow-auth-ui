import { useCallback, useEffect, useMemo, useState } from 'react'

import { createApiKeysApi } from '@/api/apiKeys'
import { createFeedNowApiClient } from '@/api/client'
import { createOrganizationsApi, type Organization } from '@/api/organizations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/routes/use-session'
import type { ApiKeySummary } from '@/types/browser-api'

type OrganizationKeys = { organization: Organization; keys: ApiKeySummary[] }

function ApiKeysPage() {
  const session = useSession()
  const client = useMemo(() => createFeedNowApiClient(), [])
  const organizationsApi = useMemo(() => createOrganizationsApi(client), [client])
  const keysApi = useMemo(() => createApiKeysApi(client), [client])
  const [organizations, setOrganizations] = useState<OrganizationKeys[]>([])
  const [loaded, setLoaded] = useState(false)
  const [keyName, setKeyName] = useState<Record<string, string>>({})
  const [createdKey, setCreatedKey] = useState<string>()
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const allOrganizations: Organization[] = []
    let organizationCursor: string | undefined
    do {
      const page = await organizationsApi.list({ limit: 100, cursor: organizationCursor })
      if (!page.data) throw new Error('Could not load organizations.')
      allOrganizations.push(...page.data.items)
      organizationCursor = page.data.next_cursor ?? undefined
    } while (organizationCursor)
    const results = await Promise.all(allOrganizations.map(async (organization) => {
      if (organization.status !== 'active' || organization.suspended_at) return { organization, keys: [] }
      const keys: ApiKeySummary[] = []
      let cursor: string | undefined
      do {
        const page = await keysApi.list(organization.id, { limit: 100, cursor })
        if (!page.data) throw new Error('Could not load API keys.')
        keys.push(...page.data.items)
        cursor = page.data.next_cursor ?? undefined
      } while (cursor)
      return { organization, keys }
    }))
    setOrganizations(results)
    setLoaded(true)
  }, [keysApi, organizationsApi])

  useEffect(() => {
    void Promise.resolve().then(load).catch(() => setError('Could not load API keys.'))
  }, [load])

  async function createKey(event: React.FormEvent<HTMLFormElement>, organizationId: string) {
    event.preventDefault()
    const name = keyName[organizationId]?.trim()
    if (!name) return
    setError('')
    try {
      const response = await keysApi.create(organizationId, { name, environment: 'test', scopes: [] })
      if (!response.data) throw new Error('Could not create API key.')
      setCreatedKey(response.data.key)
      setKeyName((current) => ({ ...current, [organizationId]: '' }))
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create API key.')
    }
  }

  async function revokeKey(organizationId: string, keyId: string) {
    setError('')
    try {
      await keysApi.revoke(organizationId, keyId)
      await load()
    } catch {
      setError('Could not revoke this API key.')
    }
  }

  if (session.status !== 'authenticated') return null
  return <main className="space-y-6 p-2 md:p-4">
    <header><p className="text-sm font-medium text-emerald-700">FeedNow Account</p><h1 className="mt-1 text-3xl font-semibold">API keys</h1></header>
    {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {createdKey && <div role="status" className="rounded-md border border-emerald-700 p-4"><p className="font-medium">Copy this key now. It cannot be retrieved again.</p><code className="mt-2 block break-all">{createdKey}</code><Button className="mt-2" variant="outline" onClick={() => navigator.clipboard.writeText(createdKey)}>Copy key</Button><Button className="ml-2 mt-2" variant="ghost" onClick={() => setCreatedKey(undefined)}>Dismiss</Button></div>}
    {organizations.length === 0 && !loaded && !error && <p role="status">Loading API keys…</p>}
    {organizations.length === 0 && loaded && <p>No organizations available for API keys.</p>}
    {organizations.map(({ organization, keys }) => <Card key={organization.id}>
      <CardHeader><CardTitle>{organization.name}</CardTitle><p className="break-all text-xs text-muted-foreground">{organization.id}</p></CardHeader>
      <CardContent className="space-y-4">
        {organization.suspended_at || organization.status !== 'active' ? <p className="text-sm text-muted-foreground">API key management is unavailable while this organization is suspended.</p> : <form onSubmit={(event) => void createKey(event, organization.id)} className="flex flex-wrap gap-2"><Input aria-label={`Key name for ${organization.name}`} placeholder="Development integration" value={keyName[organization.id] ?? ''} onChange={(event) => setKeyName((current) => ({ ...current, [organization.id]: event.target.value }))} /><Button disabled={!keyName[organization.id]?.trim()}>Create test key</Button></form>}
        {keys.length === 0 ? <p className="text-sm text-muted-foreground">No API keys for this organization.</p> : <ul className="divide-y">{keys.map((key) => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{key.name}</p><p className="text-sm text-muted-foreground">{key.service_id} · {key.key_prefix} · Created {new Date(key.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><Badge variant={key.status === 'active' ? 'default' : 'secondary'}>{key.status}</Badge>{key.status === 'active' && <Button variant="destructive" size="sm" onClick={() => void revokeKey(organization.id, key.id)}>Revoke</Button>}</div></li>)}</ul>}
      </CardContent>
    </Card>)}
  </main>
}

export { ApiKeysPage }
