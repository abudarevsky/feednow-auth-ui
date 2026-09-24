import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Home } from '@/routes/home'

describe('Phase 02 home gallery', () => {
  it('mounts each primitive surface for local visual inspection', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: 'Phase 02 design system' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Account access' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revoke key' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.getByText('Could not load account details.')).toBeInTheDocument()
  })
})
