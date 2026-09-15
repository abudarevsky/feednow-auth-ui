import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { afterEach, beforeAll, afterAll } from 'vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
