// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * Pre-paint bootstrap/test contract (dark mode): the inline script in
 * index.html must mirror `getInitialTheme` in src/lib/theme.ts — same
 * storage key, same two values, same resolution order (valid stored choice
 * → system preference → light, with a failed storage *read* degrading to the
 * system fallback rather than skipping it). A drift here reintroduces the
 * light→dark flash the script exists to prevent. This test parses both
 * sources by text (same pattern as theme-contrast.test.ts).
 */

function read(relativeUrl: string): string {
  return readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8')
}

const html = read('../../index.html')
const themeLib = read('../lib/theme.ts')

const bootstrapScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]
const storageKey = themeLib.match(
  /const THEME_STORAGE_KEY = '([^']+)'/,
)?.[1]
const darkClass = themeLib.match(/const DARK_CLASS = '([^']+)'/)?.[1]

describe('index.html pre-paint theme bootstrap', () => {
  it('defines the contract sources it pins', () => {
    expect(bootstrapScript, 'index.html must contain the bootstrap script').toBeTruthy()
    expect(storageKey, 'src/lib/theme.ts must declare THEME_STORAGE_KEY').toBeTruthy()
    expect(darkClass, 'src/lib/theme.ts must declare DARK_CLASS').toBeTruthy()
  })

  it('reads the same localStorage key as src/lib/theme.ts', () => {
    expect(bootstrapScript).toContain(
      `localStorage.getItem('${storageKey}')`,
    )
  })

  it('mirrors the stored-choice → system → light resolution order', () => {
    const script = bootstrapScript ?? ''
    // Only these two stored values count as an explicit choice, exactly
    // like isTheme() in src/lib/theme.ts.
    expect(script).toContain("stored === 'dark' || stored === 'light'")
    // Anything else consults the system preference, guarded for parity
    // with readSystemTheme's typeof check.
    expect(script).toContain("matchMedia('(prefers-color-scheme: dark)')")
    // A throwing storage read must not skip the system fallback: only the
    // getItem call sits inside its try/catch, and the read result defaults
    // to null (the absent-value path).
    expect(script).toMatch(
      /var stored = null;[\s\S]*?try \{[\s\S]*?localStorage\.getItem[\s\S]*?\} catch/,
    )
  })

  it('toggles the same class the stylesheet overrides on', () => {
    expect(darkClass).toBe('dark')
    expect(bootstrapScript).toContain(`classList.toggle('${darkClass}'`)
    expect(read('../index.css')).toContain(`.${darkClass} {`)
  })
})
