import { asApiPath, type ApiPath } from '@/api/path'

type ApiMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiRequestOptions = {
  method?: ApiMethod
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}

type ApiResponse<T> = {
  ok: boolean
  status: number
  data: T | undefined
  headers: Headers
}

type ApiClientOptions = {
  fetchImpl?: typeof fetch
}

type ApiClient = {
  request<TResponse>(path: ApiPath | string, options?: ApiRequestOptions): Promise<ApiResponse<TResponse>>
}

function createApiClient({ fetchImpl = fetch }: ApiClientOptions = {}): ApiClient {
  return {
    async request<TResponse>(path: ApiPath | string, options: ApiRequestOptions = {}) {
      const safePath = asApiPath(path)
      const method = options.method ?? 'GET'
      const headers = new Headers(options.headers)
      headers.set('Accept', 'application/json')

      let body: string | undefined
      if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(options.body)
      }

      const response = await fetchImpl(safePath, {
        method,
        headers,
        body,
        signal: options.signal,
        credentials: 'same-origin',
      })
      const text = await response.text()
      const data = text.length > 0 ? JSON.parse(text) as TResponse : undefined

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: response.headers,
      }
    },
  }
}

export { createApiClient }
export type { ApiClient, ApiMethod, ApiRequestOptions, ApiResponse, ApiClientOptions }
