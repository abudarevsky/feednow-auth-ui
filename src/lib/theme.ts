/*
 * Theme resolution helpers (dark mode), shared by the ThemeProvider
 * (src/hooks/use-theme.tsx) and the pre-paint script in index.html.
 *
 * The provider owns React state; this module owns the non-React contract:
 * the localStorage key, the `.dark` class name, the stored-choice →
 * system-preference → light resolution order, and mirroring a theme onto
 * <html> plus storage. localStorage access is guarded because
 * private-browsing modes can throw on read *and* write; an unavailable
 * store degrades to an in-memory theme, never a crash. The key, the two
 * values, and the fallback order must stay in sync with index.html.
 */

export type Theme = 'light' | 'dark'

/** localStorage key holding the explicit theme choice. Keep in sync with index.html. */
const THEME_STORAGE_KEY = 'feednow-theme'

/** Class toggled on <html>; the stylesheet's dark overrides key off it. */
const DARK_CLASS = 'dark'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** The explicitly stored choice, or null if absent, corrupt, or unreadable. */
function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    return null
  }
}

/** OS preference used only when no explicit choice is stored. */
function readSystemTheme(): Theme {
  if (typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * The theme a fresh document should paint with: stored choice, else system
 * preference, else light.
 */
function getInitialTheme(): Theme {
  return readStoredTheme() ?? readSystemTheme()
}

/**
 * Mirror the theme onto <html>. Class application happens on every state
 * change; only explicit user choices are persisted (see persistTheme), so
 * an OS preference is never frozen into storage.
 */
function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark')
}

/** Persist an explicit user choice; a storage write failure is non-fatal. */
function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* Private mode may reject writes; the in-memory theme still applies. */
  }
}

export {
  DARK_CLASS,
  THEME_STORAGE_KEY,
  applyThemeClass,
  getInitialTheme,
  persistTheme,
}
