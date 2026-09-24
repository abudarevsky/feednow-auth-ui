import type { ApiClient, ApiResponse } from '@/api/client'
import type { MeResponse } from '@/types/browser-api'

function createAccountApi(client: ApiClient) {
  return {
    getProfile(signal?: AbortSignal): Promise<ApiResponse<MeResponse>> {
      return client.request('/api/v1/me', { signal })
    },
  }
}

export { createAccountApi }
