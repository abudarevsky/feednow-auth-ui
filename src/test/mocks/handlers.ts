import { HttpResponse, http } from 'msw'

/**
 * Placeholder handlers only. Real `/api/*` contracts arrive with the
 * feednow-auth browser contract phases; tests must never call a real
 * backend, AWS, or Cognito.
 */
export const handlers = [
  http.get('/api/placeholder', () =>
    HttpResponse.json({ status: 'intercepted' })
  ),
  http.get('/api/v1/me', () => HttpResponse.json({ code: 'unauthenticated' }, { status: 401 })),
  http.get('/api/v1/services', () => HttpResponse.json({ items: [] })),
  http.get('/api/v1/organizations', () => HttpResponse.json({ items: [], limit: 1, next_cursor: null })),
  http.get('/api/v1/organizations/:organizationId/api-keys', () => HttpResponse.json({ items: [], limit: 100, next_cursor: null })),
  http.get('/api/v1/organizations/:organizationId/members', () => HttpResponse.json({ items: [], limit: 100, next_cursor: null })),
]
