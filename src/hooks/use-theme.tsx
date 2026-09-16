import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  applyThemeClass,
  getInitialTheme,
  persistTheme,
  type Theme,
} from '@/lib/theme'

/*
 * Theme context (dark mode): one authoritative theme for the whole document.
 *
 * The provider owns the light/dark React state, delegates the resolution
 * order and the storage/class side effects to src/lib/theme.ts (shared with
 * the index.html pre-paint script), and exposes them through `useTheme`.
 * Route-independent (src/hooks/ per the layout contract): no component reads
 * the class or storage directly — screens and chrome use `useTheme`.
 */

type ThemeContextValue = {
  /** The active theme; the single source of truth for `.dark` and storage. */
  theme: Theme
  /** Set an explicit theme (persisted; survives storage failures). */
  setTheme: (theme: Theme) => void
  /** Flip light ↔ dark (persisted). */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // The `.dark` class always mirrors the state (this also re-syncs it if the
  // pre-paint script and hydration disagreed). Storage is deliberately NOT
  // written here: the mount-time value may be a mere system preference, and
  // persisting it would freeze that preference into an explicit choice and
  // stop following automatic day/night OS themes. StrictMode's
  // double-invoked effect is idempotent by construction.
  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  // Persistence happens only on explicit user actions, in the event handler
  // (never inside a state updater, which StrictMode may re-invoke).
  const setTheme = useCallback(
    (next: Theme) => {
      persistTheme(next)
      setThemeState(next)
    },
    [],
  )
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    persistTheme(next)
    setThemeState(next)
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

/** Active theme plus its mutators; throws outside the provider by design. */
function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// The provider component and its hook are one cohesive module; the rule is
// suppressed narrowly instead of splitting the contract apart.
// eslint-disable-next-line react-refresh/only-export-components
export { ThemeProvider, useTheme }
export type { Theme }
