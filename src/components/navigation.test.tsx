import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { describe, expect, it, vi } from 'vitest'

import { Navigation } from '@/components/navigation'

/*
 * Navigation (Phase 02): pins the observable ARIA and keyboard contract of
 * the navigation bar and its dropdown menu. Radix owns the mechanics (see
 * ui/dropdown-menu.tsx); these tests prove the component wires them
 * correctly and cannot silently drop them: a named landmark, list semantics,
 * aria-current on the active item only, trigger aria-haspopup/aria-expanded/
 * aria-controls wiring, a menu labelled by its trigger with role="menuitem"
 * children, focus entering the menu on open, keyboard entry highlighting the
 * first item, roving arrow-key focus, Escape and activation both closing and
 * restoring focus to the trigger, and a disabled item that cannot be invoked.
 * Focus restoration is scheduled asynchronously by Radix's FocusScope, so
 * those assertions wait for it (same pattern as ui/dialog.test.tsx).
 */

function renderNavigation() {
  const home = vi.fn()
  const profile = vi.fn()
  const appearance = vi.fn()
  const notifications = vi.fn()
  const danger = vi.fn()

  render(
    <Navigation
      label="Account"
      items={[
        { id: 'home', label: 'Home', onSelect: home, active: true },
        { id: 'profile', label: 'Profile', onSelect: profile },
      ]}
      menu={{
        label: 'Settings',
        items: [
          { id: 'appearance', label: 'Appearance', onSelect: appearance },
          { id: 'notifications', label: 'Notifications', onSelect: notifications },
          { id: 'danger', label: 'Danger zone', onSelect: danger, disabled: true },
        ],
      }}
    />,
  )

  return { home, profile, appearance, notifications, danger }
}

/**
 * Opens the dropdown the way a mouse press does (the Radix trigger toggles on
 * pointerdown) and returns the trigger plus the now-mounted menu. The trigger
 * is captured before opening because modal dismissal aria-hides the rest of
 * the page while the menu is open.
 */
function openMenu() {
  const trigger = screen.getByRole('button', { name: 'Settings' })
  fireEvent.pointerDown(trigger, { button: 0 })
  return { trigger, menu: screen.getByRole('menu') }
}

function activeElement() {
  return document.activeElement as HTMLElement | null
}

describe('Navigation landmark and items', () => {
  it('renders a named navigation landmark containing the item list', () => {
    renderNavigation()

    const nav = screen.getByRole('navigation', { name: 'Account' })
    expect(within(nav).getByRole('list')).toBeInTheDocument()
    // Two plain items plus the dropdown trigger entry.
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3)
  })

  it('marks only the active item with aria-current="page"', () => {
    renderNavigation()

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Profile' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('invokes onSelect when a plain item is activated', () => {
    const { profile } = renderNavigation()

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }))

    expect(profile).toHaveBeenCalledTimes(1)
  })
})

describe('Dropdown trigger and menu ARIA wiring', () => {
  it('exposes the collapsed menu state on the trigger', () => {
    renderNavigation()

    const trigger = screen.getByRole('button', { name: 'Settings' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens a menu labelled by the trigger and wires aria-expanded/aria-controls', () => {
    renderNavigation()
    const { trigger, menu } = openMenu()

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
    expect(menu).toHaveAccessibleName('Settings')
    expect(menu).toHaveAttribute('aria-orientation', 'vertical')

    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Appearance',
      'Notifications',
      'Danger zone',
    ])
    expect(items[2]).toHaveAttribute('aria-disabled', 'true')
  })

  it('moves focus into the menu on open', () => {
    renderNavigation()
    const { menu } = openMenu()

    expect(menu).toContainElement(activeElement())
  })
})

describe('Dropdown keyboard interaction', () => {
  it('opens from the keyboard on the first item and arrows move roving focus', async () => {
    renderNavigation()
    const trigger = screen.getByRole('button', { name: 'Settings' })

    fireEvent.keyDown(trigger, { key: 'Enter' })

    const menu = screen.getByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    await waitFor(() => {
      expect(document.activeElement).toBe(items[0])
    })

    fireEvent.keyDown(items[0]!, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(document.activeElement).toBe(items[1])
    })
    expect(menu).toContainElement(activeElement())
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    renderNavigation()
    const { trigger, menu } = openMenu()

    fireEvent.keyDown(menu, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  it('activates the selected item, closes the menu, and returns focus to the trigger', async () => {
    const { appearance } = renderNavigation()
    const { trigger, menu } = openMenu()
    const [first] = within(menu).getAllByRole('menuitem')

    fireEvent.click(first!)

    expect(appearance).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  it('does not invoke or dismiss on a disabled item', () => {
    const { danger } = renderNavigation()
    const { menu } = openMenu()

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Danger zone' }))

    expect(danger).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})
