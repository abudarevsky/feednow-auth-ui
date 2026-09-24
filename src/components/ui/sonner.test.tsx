import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Toaster, toast } from '@/components/ui/sonner'

afterEach(() => toast.dismiss())

describe('Sonner Toaster', () => {
  it('mounts the polite notifications region', () => {
    render(<Toaster />)
    expect(screen.getByRole('region', { name: /notifications/i })).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('renders a toast with an accessible named close button', async () => {
    render(<Toaster />)
    act(() => toast('Profile updated'))
    expect(await screen.findByText('Profile updated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close toast' })).toBeInTheDocument()
  })
})
