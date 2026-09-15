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
]
