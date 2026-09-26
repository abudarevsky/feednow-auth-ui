import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountShell } from '@/components/account-shell'

describe('AccountShell navigation', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('exposes the navigation landmark and active item state', () => {
    render(
      <AccountShell
        items={[
          { label: 'Profile', onSelect: vi.fn(), active: true },
          { label: 'Security', onSelect: vi.fn() },
        ]}
      >
        <h1>Account</h1>
      </AccountShell>,
    )

    const nav = screen.getAllByRole('navigation', { name: 'Account' })[0]!
    expect(nav).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Profile' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('moves focus into the mobile Sheet and restores it to the trigger on Escape', async () => {
    render(
      <AccountShell items={[{ label: 'Profile', onSelect: vi.fn() }]}>
        <h1>Account</h1>
      </AccountShell>,
    )

    const trigger = screen.getByRole('button', { name: 'Open account navigation' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    )
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
