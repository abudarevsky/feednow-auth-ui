import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ProtectedRoute } from '@/routes/route-guards'
import { SessionProvider } from '@/routes/session-provider'

function renderRoute(status: 'loading' | 'unauthenticated' | 'authenticated', protectedRoute = true) {
  return render(
    <MemoryRouter>
      <SessionProvider value={{ status }}>
        {protectedRoute ? (
          <ProtectedRoute><h1>Account page</h1></ProtectedRoute>
        ) : <h1>Public page</h1>}
      </SessionProvider>
    </MemoryRouter>,
  )
}

describe('protected route session outcomes', () => {
  it('shows a stable loading state while session state is unresolved', () => {
    renderRoute('loading')
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Account page' })).not.toBeInTheDocument()
  })

  it('shows a safe sign-in prompt for an unauthenticated session', () => {
    renderRoute('unauthenticated')
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/login')
  })

  it('renders protected content for an authenticated session', () => {
    renderRoute('authenticated')
    expect(screen.getByRole('heading', { name: 'Account page' })).toBeInTheDocument()
  })

  it('keeps public routes available regardless of session state', () => {
    renderRoute('loading', false)
    expect(screen.getByRole('heading', { name: 'Public page' })).toBeInTheDocument()
  })
})
