import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthCard } from '@/components/auth-card'

describe('AuthCard', () => {
  it('renders title, description, content, and footer slots with one h1', () => {
    render(
      <AuthCard
        title="Sign in"
        description="Use your account"
        footer={<button type="button">Create account</button>}
      >
        <p>Email field</p>
      </AuthCard>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Use your account')).toBeInTheDocument()
    expect(screen.getByText('Email field')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeInTheDocument()
    const card = document.querySelector('[data-slot="card"]')
    expect(card).toHaveClass('w-full', 'max-w-md')
    expect(card?.className).not.toMatch(/\bh-\S+/)
  })
})
