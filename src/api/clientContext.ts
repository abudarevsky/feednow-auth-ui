import type { ApiClient, ApiResponse } from '@/api/client'
import type { ClientContext } from '@/types/browser-api'

function createClientContextApi(client: ApiClient) {
  return {
    get(clientId: string, signal?: AbortSignal): Promise<ApiResponse<ClientContext>> {
      const query = new URLSearchParams({ client_id: clientId })
      return client.request(`/api/v1/auth/context?${query.toString()}`, { signal })
    },
  }
}

export { createClientContextApi }
