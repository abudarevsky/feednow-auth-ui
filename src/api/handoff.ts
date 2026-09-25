import type { ApiClient, ApiResponse } from '@/api/client'
import type { HandoffRequest, HandoffResponse } from '@/types/browser-api'

function createHandoffApi(client: ApiClient) {
  return {
    start(body: HandoffRequest, signal?: AbortSignal): Promise<ApiResponse<HandoffResponse>> {
      return client.request('/api/v1/auth/handoff', { method: 'POST', body, signal })
    },
  }
}

export { createHandoffApi }
