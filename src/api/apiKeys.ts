import type { ApiClient, ApiResponse } from '@/api/client'
import type { ApiKeyCreated, ApiKeyEnvironment, ApiKeySummary, Page } from '@/types/browser-api'

function organizationKeysPath(organizationId: string): string {
  return `/api/v1/organizations/${encodeURIComponent(organizationId)}/api-keys`
}

function createApiKeysApi(client: ApiClient) {
  return {
    list(organizationId: string, options: { limit?: number; cursor?: string; signal?: AbortSignal } = {}): Promise<ApiResponse<Page<ApiKeySummary>>> {
      const query = new URLSearchParams()
      if (options.limit !== undefined) query.set('limit', String(options.limit))
      if (options.cursor !== undefined) query.set('cursor', options.cursor)
      const suffix = query.size ? `?${query.toString()}` : ''
      return client.request(`${organizationKeysPath(organizationId)}${suffix}`, { signal: options.signal })
    },
    create(organizationId: string, body: { name: string; environment: ApiKeyEnvironment; scopes: string[] }, signal?: AbortSignal): Promise<ApiResponse<ApiKeyCreated>> {
      return client.request(organizationKeysPath(organizationId), { method: 'POST', body, signal })
    },
    revoke(organizationId: string, keyId: string, signal?: AbortSignal): Promise<ApiResponse<void>> {
      return client.request(`${organizationKeysPath(organizationId)}/${encodeURIComponent(keyId)}`, { method: 'DELETE', signal })
    },
  }
}

export { createApiKeysApi }
