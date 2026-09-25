import type { ApiClient, ApiResponse } from '@/api/client'
import type { AuthClientContext, BrowserSessionResponse } from '@/types/browser-api'

function createSessionApi(client: ApiClient) {
  return {
    getCurrent(signal?: AbortSignal): Promise<ApiResponse<BrowserSessionResponse>> {
      return client.request('/api/v1/session', { signal })
    },
    getClientContext(clientId: string, signal?: AbortSignal): Promise<ApiResponse<AuthClientContext>> {
      const query = new URLSearchParams({ client_id: clientId })
      return client.request(`/api/v1/auth/context?${query.toString()}`, { signal })
    },
    logout(signal?: AbortSignal): Promise<ApiResponse<void>> {
      return client.request('/api/v1/logout', { method: 'POST', body: {}, signal })
    },
  }
}

export { createSessionApi }
