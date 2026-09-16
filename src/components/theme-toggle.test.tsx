import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeProvider } from '@/hooks/use-theme'
import { THEME_STORAGE_KEY } from '@/lib/theme'

/*
 * ThemeToggle (dark mode): pins the accessible toggle-button contract — a
 * stable "Dark mode" name, aria-pressed mirroring the active theme, and an
 * icon swap that is decoration only (the sun/moon SVGs are aria-hidden) —
 * plus the wiring through useTheme: one click flips the `.dark` class and
 * persists the choice, a second click reverts both.
 */

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
  return screen.getByRole('button', { name: 'Dark mode' })
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle accessibility', () => {
  it('is a pressable toggle named "Dark mode", unpressed in light mode', () => {
    const button = renderToggle()

    expect(button).toHaveAttribute('aria-pressed', 'false')
    // The icon is decoration: state is carried by aria-pressed, not the SVG.
    expect(screen.getByTestId('theme-toggle-sun')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('announces the pressed state once dark is active', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const button = renderToggle()

    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-toggle-moon')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})

describe('ThemeToggle behavior', () => {
  it('flips the document class and persists the choice on each click', () => {
    const button = renderToggle()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})
