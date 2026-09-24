import type { ApiClient, ApiResponse } from '@/api/client'
import type { MeResponse, SecurityResponse } from '@/types/browser-api'

function createAccountApi(client: ApiClient) {
  return {
    getProfile(signal?: AbortSignal): Promise<ApiResponse<MeResponse>> {
      return client.request('/api/v1/me', { signal })
    },
    updateProfile(body: { display_name?: string; email?: string }, signal?: AbortSignal): Promise<ApiResponse<MeResponse>> {
      return client.request('/api/v1/me', { method: 'PATCH', body, signal })
    },
    getSecurity(signal?: AbortSignal): Promise<ApiResponse<SecurityResponse>> {
      return client.request('/api/v1/account/security', { signal })
    },
    changePassword(body: { current_password: string; new_password: string }, signal?: AbortSignal): Promise<ApiResponse<void>> {
      return client.request('/api/v1/account/security/password', { method: 'POST', body, signal })
    },
  }
}

export { createAccountApi }
