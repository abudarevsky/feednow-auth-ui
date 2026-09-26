import type { ApiClient, ApiResponse } from '@/api/client'

type CurrentUser = { id: string; display_name: string; email: string; status: string; created_at: string; updated_at: string }

function createMeApi(client: ApiClient) {
  return {
    updateProfile(displayName: string): Promise<ApiResponse<CurrentUser>> {
      return client.request('/api/v1/me', { method: 'PATCH', body: { display_name: displayName } })
    },
  }
}

export { createMeApi }
export type { CurrentUser }
