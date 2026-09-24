import { createServer as createHttpServer, request as httpRequest } from 'node:http'

import { createServer as createViteServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

import { createApiProxy } from '@/lib/dev-proxy'
import { server as mswServer } from '@/test/mocks/server'

function request(url: string) {
  return new Promise<{ statusCode: number | undefined; contentType: string | undefined; body: string }>((resolve, reject) => {
    httpRequest(url, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk: string) => { body += chunk })
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        body,
      }))
    }).on('error', reject).end()
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
    let forwardedUrl = ''
    upstream = createHttpServer((request, response) => {
      forwardedUrl = request.url ?? ''
      response.writeHead(429, { 'content-type': 'application/json' })
      response.end('{"error":"rate_limited"}')
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

    const apiResponse = await request(`http://127.0.0.1:${viteAddress.port}/api/v1/test?source=ui`)
    expect(forwardedUrl).toBe('/v1/test?source=ui')
    expect(apiResponse.statusCode).toBe(429)
    expect(apiResponse.contentType).toContain('application/json')
    expect(JSON.parse(apiResponse.body)).toEqual({ error: 'rate_limited' })

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
