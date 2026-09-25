import { createServer as createHttpServer, request as httpRequest } from 'node:http'

import { createServer as createViteServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

import { createApiProxy } from '@/lib/dev-proxy'
import { server as mswServer } from '@/test/mocks/server'

function request(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new Promise<{ statusCode: number | undefined; contentType: string | undefined; body: string }>((resolve, reject) => {
    const outgoing = httpRequest(url, options, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk: string) => { body += chunk })
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        body,
      }))
    })
    outgoing.on('error', reject).end(options.body)
  })
}

describe('local API proxy', () => {
  let upstream: ReturnType<typeof createHttpServer> | undefined
  let vite: Awaited<ReturnType<typeof createViteServer>> | undefined

  afterEach(async () => {
    await vite?.close()
    vite = undefined
    await new Promise<void>((resolve) => upstream?.close(() => resolve()) ?? resolve())
    upstream = undefined
  })

  it('strips the browser API prefix, preserves backend errors, and keeps frontend routes on the SPA shell', async () => {
    mswServer.close()
    mswServer.listen({ onUnhandledRequest: 'bypass' })
    try {
    const forwardedRequests: Array<{
      url: string
      method: string
      body: string
      cookie: string | undefined
      contractHeader: string | string[] | undefined
    }> = []
    upstream = createHttpServer((request, response) => {
      let body = ''
      request.setEncoding('utf8')
      request.on('data', (chunk: string) => { body += chunk })
      request.on('end', () => {
        forwardedRequests.push({
          url: request.url ?? '',
          method: request.method ?? '',
          body,
          cookie: request.headers.cookie,
          contractHeader: request.headers['x-contract-test'],
        })
        const isOAuthCallback = request.url?.startsWith('/oauth/callback')
        response.writeHead(isOAuthCallback ? 401 : 429, { 'content-type': 'application/json' })
        response.end(isOAuthCallback ? '{"code":"unauthenticated"}' : '{"code":"rate_limited"}')
      })
    })
    await new Promise<void>((resolve) => upstream?.listen(0, '127.0.0.1', resolve))
    const upstreamAddress = upstream.address()
    if (!upstreamAddress || typeof upstreamAddress === 'string') throw new Error('Upstream did not bind a TCP port')

    vite = await createViteServer({
      configFile: false,
      root: process.cwd(),
      server: {
        host: '127.0.0.1',
        port: 0,
        proxy: createApiProxy(`http://127.0.0.1:${upstreamAddress.port}`),
      },
    })
    await vite.listen()
    const viteAddress = vite.httpServer?.address()
    if (!viteAddress || typeof viteAddress === 'string') throw new Error('Vite did not bind a TCP port')

    const apiResponse = await request(`http://127.0.0.1:${viteAddress.port}/api/v1/test?source=ui`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'feednow_session=opaque-cookie',
        'x-contract-test': 'preserved-header',
      },
      body: '{"probe":true}',
    })
    expect(forwardedRequests[0]).toEqual({
      url: '/v1/test?source=ui',
      method: 'POST',
      body: '{"probe":true}',
      cookie: 'feednow_session=opaque-cookie',
      contractHeader: 'preserved-header',
    })
    expect(apiResponse.statusCode).toBe(429)
    expect(apiResponse.contentType).toContain('application/json')
    expect(JSON.parse(apiResponse.body)).toEqual({ code: 'rate_limited' })

    const loginResponse = await request(`http://127.0.0.1:${viteAddress.port}/api/oauth/login?next=%2Faccount`)
    expect(forwardedRequests[1]).toEqual({
      url: '/oauth/login?next=%2Faccount',
      method: 'GET',
      body: '',
      cookie: undefined,
      contractHeader: undefined,
    })
    expect(loginResponse.statusCode).toBe(429)
    expect(loginResponse.contentType).toContain('application/json')
    expect(JSON.parse(loginResponse.body)).toEqual({ code: 'rate_limited' })

    const callbackResponse = await request(`http://127.0.0.1:${viteAddress.port}/api/oauth/callback?error=access_denied`)
    expect(forwardedRequests[2]).toEqual({
      url: '/oauth/callback?error=access_denied',
      method: 'GET',
      body: '',
      cookie: undefined,
      contractHeader: undefined,
    })
    expect(callbackResponse.statusCode).toBe(401)
    expect(callbackResponse.contentType).toContain('application/json')
    expect(JSON.parse(callbackResponse.body)).toEqual({ code: 'unauthenticated' })

    const frontendResponse = await request(`http://127.0.0.1:${viteAddress.port}/login`)
    expect(frontendResponse.statusCode).toBe(200)
    expect(frontendResponse.contentType).toContain('text/html')
    expect(frontendResponse.body).toContain('<div id="root"></div>')
    } finally {
      mswServer.close()
      mswServer.listen({ onUnhandledRequest: 'error' })
    }
  })
})
