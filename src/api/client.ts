import { asApiPath, type ApiPath } from '@/api/path'
import { FEEDNOW_CSRF_OPTIONS, isUnsafeMethod, readCsrfToken, type CsrfOptions } from '@/api/csrf'
import {
  createCsrfError,
  createMalformedResponseError,
  createNetworkError,
  isAbortError,
  normalizeApiError,
} from '@/lib/api-errors'

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
  csrf?: CsrfOptions
}

type ApiClient = {
  request<TResponse>(path: ApiPath | string, options?: ApiRequestOptions): Promise<ApiResponse<TResponse>>
}

function createApiClient({ fetchImpl = fetch, csrf }: ApiClientOptions = {}): ApiClient {
  return {
    async request<TResponse>(path: ApiPath | string, options: ApiRequestOptions = {}) {
      const safePath = asApiPath(path)
      const method = options.method ?? 'GET'
      const headers = new Headers(options.headers)
      headers.set('Accept', 'application/json')

      if (csrf && isUnsafeMethod(method)) {
        const token = readCsrfToken(csrf)
        if (!token) throw createCsrfError()
        try {
          headers.set(csrf.headerName, token)
        } catch {
          throw createCsrfError()
        }
      }

      let body: string | undefined
      if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(options.body)
      }

      let response: Response
      try {
        response = await fetchImpl(safePath, {
          method,
          headers,
          body,
          signal: options.signal,
          cache: 'no-store',
          credentials: 'same-origin',
        })
      } catch (error) {
        if (isAbortError(error)) throw error
        throw createNetworkError()
      }

      let text: string
      try {
        text = await response.text()
      } catch (error) {
        if (isAbortError(error)) throw error
        throw createNetworkError()
      }

      let data: TResponse | undefined
      if (text.length > 0) {
        try {
          data = JSON.parse(text) as TResponse
        } catch {
          if (response.ok) throw createMalformedResponseError()
        }
      }

      if (!response.ok) throw normalizeApiError(response.status, data)

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: response.headers,
      }
    },
  }
}

function createFeedNowApiClient(options: Omit<ApiClientOptions, 'csrf'> = {}): ApiClient {
  return createApiClient({ ...options, csrf: FEEDNOW_CSRF_OPTIONS })
}

export { createApiClient, createFeedNowApiClient }
export type { ApiClient, ApiMethod, ApiRequestOptions, ApiResponse, ApiClientOptions }
