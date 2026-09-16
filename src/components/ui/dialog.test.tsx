import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/*
 * Modal Dialog (Phase 02, shadcn set). Radix owns the keyboard and focus
 * contract; these tests pin the observable behavior so a later refactor
 * cannot silently drop it: opening moves focus inside and aria-hides the
 * page behind (Radix 1.6.7's better-supported equivalent of aria-modal),
 * Tab/Shift+Tab wrap within the content, Escape and outside pointer
 * interactions dismiss, and every close path restores focus to the trigger.
 * The restore is scheduled asynchronously by Radix's FocusScope, so those
 * assertions wait for it.
 */
function renderDialog() {
  const result = render(
    <div data-testid="page">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Edit profile</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Changes apply to your account.</DialogDescription>
          </DialogHeader>
          <label htmlFor="profile-name">Name</label>
          <input id="profile-name" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
  )
  const trigger = screen.getByRole('button', { name: 'Edit profile' })
  return { ...result, trigger }
}

/** Tabbable elements inside the open dialog, in DOM order. */
function tabbablesIn(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>('input, button'))
}

/** jsdom types activeElement as Element; matchers want HTMLElement. */
function activeElement() {
  return document.activeElement as HTMLElement | null
}

function open(dialogTrigger: HTMLElement) {
  fireEvent.click(dialogTrigger)
  return screen.getByRole('dialog')
}

/** Asserts the closed dialog no longer exists and focus returns to `trigger`. */
async function expectClosedAndFocusRestored(trigger: HTMLElement) {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger)
  })
}

describe('Dialog modal semantics', () => {
  it('opens from the trigger as a labelled dialog', () => {
    const { trigger } = renderDialog()
    const dialog = open(trigger)

    expect(dialog).toHaveAccessibleName('Edit profile')
    expect(dialog).toHaveDescription('Changes apply to your account.')
  })

  it('moves focus into the dialog on open and aria-hides the page behind', () => {
    const { container, trigger } = renderDialog()
    const dialog = open(trigger)

    expect(dialog).toContainElement(activeElement())
    // Modal-ness: everything outside the portal leaves the a11y tree.
    expect(container).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Dialog keyboard navigation', () => {
  it('traps Tab inside the dialog, wrapping from the last control to the first', () => {
    const { trigger } = renderDialog()
    const dialog = open(trigger)
    const focusables = tabbablesIn(dialog)
    expect(focusables.length).toBeGreaterThan(1)

    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    // Navigation never left the dialog.
    expect(dialog).toContainElement(activeElement())
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const { trigger } = renderDialog()
    const dialog = open(trigger)

    fireEvent.keyDown(dialog, { key: 'Escape' })

    await expectClosedAndFocusRestored(trigger)
  })
})

describe('Dialog dismissal paths', () => {
  it('closes on an outside pointer interaction over the overlay and restores focus', async () => {
    const { trigger } = renderDialog()
    open(trigger)
    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    )!
    expect(overlay).toBeTruthy()

    // Radix attaches its outside-pointer listener on a macrotask after open
    // and defers the outside interaction to the click that follows the down.
    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(overlay, { button: 0 })
    fireEvent.pointerUp(overlay, { button: 0 })
    fireEvent.click(overlay)

    await expectClosedAndFocusRestored(trigger)
  })

  it('closes via the explicit close button and restores focus', async () => {
    const { trigger } = renderDialog()
    open(trigger)

    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    await expectClosedAndFocusRestored(trigger)
  })

  it('closes via the icon close button, which carries an accessible name', async () => {
    const { trigger } = renderDialog()
    open(trigger)

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await expectClosedAndFocusRestored(trigger)
  })
})
