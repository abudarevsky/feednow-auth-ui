import type { ApiClient, ApiResponse } from '@/api/client'
import type { Page } from '@/types/browser-api'

type AdminSummary = { organization_count: number; active_membership_count: number }
type AdminMember = {
  user_id: string
  display_name: string
  email: string
  account_status: string
  membership_status: string
  role: string
  registered_at: string
  joined_at: string
}
type AdminOrganization = {
  id: string
  name: string
  name_status: 'placeholder' | 'confirmed'
  status: string
  suspended_at: string | null
  created_at: string
  member_count: number
  members: AdminMember[]
}
type AdminOrganizationDetail = AdminOrganization & {
  type: string
  updated_at: string
  services: { id: string; name: string }[]
  api_keys: { id: string; name: string; service_id: string; status: string; created_at: string }[]
}

function createAdminApi(client: ApiClient) {
  return {
    summary(signal?: AbortSignal): Promise<ApiResponse<AdminSummary>> {
      return client.request('/api/v1/admin/summary', { signal })
    },
    organizations(query: string, options: { limit?: number; cursor?: string; signal?: AbortSignal } = {}): Promise<ApiResponse<Page<AdminOrganization>>> {
      const params = new URLSearchParams({ q: query, limit: String(options.limit ?? 20) })
      if (options.cursor) params.set('cursor', options.cursor)
      return client.request(`/api/v1/admin/organizations?${params}`, { signal: options.signal })
    },
    organization(id: string, signal?: AbortSignal): Promise<ApiResponse<AdminOrganizationDetail>> {
      return client.request(`/api/v1/admin/organizations/${encodeURIComponent(id)}`, { signal })
    },
    members(id: string, options: { limit?: number; cursor?: string; signal?: AbortSignal } = {}): Promise<ApiResponse<Page<AdminMember>>> {
      const params = new URLSearchParams({ limit: String(options.limit ?? 100) })
      if (options.cursor) params.set('cursor', options.cursor)
      return client.request(`/api/v1/admin/organizations/${encodeURIComponent(id)}/members?${params}`, { signal: options.signal })
    },
    suspend(id: string): Promise<ApiResponse<void>> {
      return client.request(`/api/v1/admin/organizations/${encodeURIComponent(id)}/suspend`, { method: 'POST', body: { confirmation: 'SUSPEND' } })
    },
    reactivate(id: string): Promise<ApiResponse<void>> {
      return client.request(`/api/v1/admin/organizations/${encodeURIComponent(id)}/reactivate`, { method: 'POST', body: { confirmation: 'REACTIVATE' } })
    },
    delete(id: string, organizationName: string): Promise<ApiResponse<void>> {
      return client.request(`/api/v1/admin/organizations/${encodeURIComponent(id)}/delete`, { method: 'POST', body: { organization_name: organizationName } })
    },
  }
}

export { createAdminApi }
export type { AdminMember, AdminOrganization, AdminOrganizationDetail, AdminSummary }
