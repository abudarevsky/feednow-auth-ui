import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster, toast, TOAST_AUTO_DISMISS_MS } from '@/components/ui/sonner'
import { ThemeProvider } from '@/hooks/use-theme'
import { THEME_STORAGE_KEY } from '@/lib/theme'

/*
 * Sonner toast system (Phase 02, shadcn set). These tests pin the two
 * contracts the task declares: accessibility (toasts live in a dedicated
 * polite live region, the toast is focusable, and dismissal is a named
 * button) and auto-dismissal (the default lifetime is TOAST_AUTO_DISMISS_MS
 * and the toast node leaves the DOM after it). TIME_BEFORE_UNMOUNT_MS
 * mirrors sonner 2.0.8's internal exit grace period between the dismiss
 * timer firing and the toast being unmounted. Sonner also defers adding a
 * toast to a setTimeout(0) macrotask ("prevent batching, temp solution" in
 * its source), so every test flushes one macrotask after calling toast().
 */
const TIME_BEFORE_UNMOUNT_MS = 200

afterEach(() => {
  vi.useRealTimers()
  // Sonner's toast store is module-level and replays active toasts to a
  // newly subscribed Toaster, so unmounting alone would leak one test's
  // toasts into the next; dismiss everything still on the slate.
  toast.dismiss()
})

/** Lets sonner's deferred add macrotask run under real timers. */
async function flushToastAddition() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

/** The toast <li> for a visible title, for attribute-level assertions. */
function toastNode(title: string) {
  return screen
    .getByText(title)
    .closest<HTMLElement>('[data-sonner-toast]')
}

describe('Toaster accessibility', () => {
  it('mounts a polite live region dedicated to notifications', () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )

    const region = screen.getByRole('region', { name: /notifications/i })
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-relevant', 'additions text')
  })

  it('renders toasts inside the live region as focusable elements', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    act(() => {
      toast('Profile updated')
    })
    await flushToastAddition()

    const region = screen.getByRole('region', { name: /notifications/i })
    const node = toastNode('Profile updated')
    expect(region).toContainElement(node)
    expect(node).toHaveAttribute('tabindex', '0')
  })

  it('gives every toast an accessible named close button', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    act(() => {
      toast('Check your inbox')
    })
    await flushToastAddition()

    expect(
      screen.getByRole('button', { name: 'Close toast' })
    ).toBeInTheDocument()
  })
})

describe('Toaster theme', () => {
  afterEach(() => {
    // The theme tests persist a stored choice; do not leak it into others.
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('follows the ThemeProvider light theme by default', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    act(() => {
      toast('Theme probe')
    })
    await flushToastAddition()

    // Sonner mirrors its active theme onto the toaster list element, which
    // only exists while a toast is rendered.
    const toaster = document.querySelector('[data-sonner-toaster]')
    expect(toaster).not.toBeNull()
    expect(toaster).toHaveAttribute('data-sonner-theme', 'light')
  })

  it('renders dark when the stored theme is dark', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    act(() => {
      toast('Theme probe')
    })
    await flushToastAddition()

    const toaster = document.querySelector('[data-sonner-toaster]')
    expect(toaster).not.toBeNull()
    expect(toaster).toHaveAttribute('data-sonner-theme', 'dark')
  })
})

describe('Toast auto-dismissal', () => {
  it('removes a toast automatically after the configured default duration', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    vi.useFakeTimers()

    act(() => {
      toast('See you soon')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText('See you soon')).toBeInTheDocument()

    // Still visible just before the lifetime elapses.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(TOAST_AUTO_DISMISS_MS - 1)
    })
    expect(screen.getByText('See you soon')).toBeInTheDocument()

    // The dismiss timer plus sonner's unmount grace period remove the node.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1 + TIME_BEFORE_UNMOUNT_MS)
    })
    expect(screen.queryByText('See you soon')).not.toBeInTheDocument()
  })

  it('honors a per-toast duration override', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    vi.useFakeTimers()

    act(() => {
      toast('Short lived', { duration: 1000 })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText('Short lived')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000 + TIME_BEFORE_UNMOUNT_MS)
    })
    expect(screen.queryByText('Short lived')).not.toBeInTheDocument()
  })
})

describe('Manual dismissal', () => {
  it('closes a toast through the named close button', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    )
    vi.useFakeTimers()

    act(() => {
      toast('Close me please')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Close toast' }).click()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(TIME_BEFORE_UNMOUNT_MS)
    })
    expect(screen.queryByText('Close me please')).not.toBeInTheDocument()
  })
})
