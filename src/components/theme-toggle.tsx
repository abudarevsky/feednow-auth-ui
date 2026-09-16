import * as React from 'react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

/*
 * ThemeToggle (dark mode): the single chrome control that flips the app
 * between the light and dark palettes declared in src/index.css.
 *
 * ARIA contract: a toggle button named "Dark mode" whose pressed state is
 * the theme itself (aria-pressed), so screen readers announce "Dark mode,
 * pressed/unpressed" without relying on the icon swap. The sun/moon icons
 * are aria-hidden decoration (state is never color- or icon-only), and the
 * `title` reflects the active theme as a hover hint, never as the name.
 *
 * Presentation only: it reads and mutates theme state exclusively through
 * useTheme; the provider owns persistence and the `.dark` class.
 */

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      data-testid="theme-toggle-sun"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      data-testid="theme-toggle-moon"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function ThemeToggle({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Dark mode"
      aria-pressed={isDark}
      title={isDark ? 'Dark theme active' : 'Light theme active'}
      data-slot="theme-toggle"
      data-theme={theme}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}

export { ThemeToggle }
