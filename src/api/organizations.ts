import type { ApiClient, ApiResponse } from '@/api/client'
import type { Page } from '@/types/browser-api'

type Organization = {
  id: string
  name: string
  type: string
  created_at: string
  name_status: 'placeholder' | 'confirmed'
  status: string
  suspended_at: string | null
}

function createOrganizationsApi(client: ApiClient) {
  return {
    list(options: { limit?: number; cursor?: string; signal?: AbortSignal } = {}): Promise<ApiResponse<Page<Organization>>> {
      const query = new URLSearchParams()
      if (options.limit !== undefined) query.set('limit', String(options.limit))
      if (options.cursor !== undefined) query.set('cursor', options.cursor)
      const suffix = query.size ? `?${query.toString()}` : ''
      return client.request(`/api/v1/organizations${suffix}`, { signal: options.signal })
    },
    rename(organizationId: string, name: string): Promise<ApiResponse<Organization>> {
      return client.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}`, {
        method: 'PATCH',
        body: { name },
      })
    },
  }
}

export { createOrganizationsApi }
export type { Organization }
