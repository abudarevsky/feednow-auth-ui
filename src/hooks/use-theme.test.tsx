import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getInitialTheme, THEME_STORAGE_KEY } from '@/lib/theme'
import { ThemeProvider, useTheme } from '@/hooks/use-theme'

/*
 * Theme context (dark mode): pins the resolution order (stored choice →
 * system preference → light), the `.dark` class mirroring state on every
 * change while storage is written only by explicit user actions (a system
 * preference must never freeze into a stored choice), and graceful
 * degradation when storage throws (private browsing). A probe component
 * exercises the hook the same way consumers do; jsdom ships no matchMedia,
 * so system-preference tests stub it explicitly.
 */

function Probe() {
  const { theme, setTheme, toggleTheme } = useTheme()
  return (
    <>
      <p>Theme: {theme}</p>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Set dark
      </button>
    </>
  )
}

function stubMatchMedia(prefersDark: boolean) {
  // jsdom ships no matchMedia; the provider treats a missing one as "system
  // prefers light", so tests install an explicit stub when they care.
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: prefersDark && query.includes('prefers-color-scheme: dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  )
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('theme resolution', () => {
  it('defaults to light when nothing is stored and the system prefers light', () => {
    stubMatchMedia(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Theme: light')).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('hydrates an explicit stored dark choice, class and state together', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })

  it('falls back to the system preference when nothing is stored', () => {
    stubMatchMedia(true)

    expect(getInitialTheme()).toBe('dark')

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(document.documentElement).toHaveClass('dark')
  })

  it('never persists a mere system preference; only explicit choices', () => {
    stubMatchMedia(true)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()

    // The first user action is what turns the preference into a stored choice.
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('ignores a corrupt stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'neon')
    stubMatchMedia(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Theme: light')).toBeInTheDocument()
  })

  it('survives storage that throws on read and write', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('SecurityError')
      })
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('SecurityError')
      })

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Theme: light')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(getItem).toHaveBeenCalled()
    expect(setItem).toHaveBeenCalled()
  })
})

describe('theme mutation', () => {
  it('toggleTheme flips the class and persists both directions', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByText('Theme: light')).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('setTheme applies an explicit theme', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Set dark' }))
    expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })
})

describe('useTheme guard', () => {
  it('throws outside the provider so no component silently reads a default', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
    consoleError.mockRestore()
  })
})
