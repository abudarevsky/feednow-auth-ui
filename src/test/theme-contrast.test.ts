// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8')

const paletteTokens = [
  '--color-feednow-background',
  '--color-feednow-on-primary',
  '--color-feednow-foreground',
  '--color-feednow-secondary-text',
  '--color-feednow-tertiary-text',
  '--color-feednow-surface-subtle',
  '--color-feednow-surface-muted',
  '--color-feednow-border',
  '--color-feednow-primary',
  '--color-feednow-primary-hover',
  '--color-feednow-accent-strong',
  '--color-feednow-accent-subtle',
  '--color-feednow-accent-soft',
  '--color-feednow-destructive',
  '--color-feednow-destructive-hover',
  '--color-feednow-destructive-subtle',
] as const

const semanticMappings: Readonly<Record<string, string>> = {
  '--background': '--color-feednow-background',
  '--foreground': '--color-feednow-foreground',
  '--card': '--color-feednow-background',
  '--card-foreground': '--color-feednow-foreground',
  '--popover': '--color-feednow-background',
  '--popover-foreground': '--color-feednow-foreground',
  '--primary': '--color-feednow-primary',
  '--primary-foreground': '--color-feednow-on-primary',
  '--secondary': '--color-feednow-surface-muted',
  '--secondary-foreground': '--color-feednow-foreground',
  '--muted': '--color-feednow-surface-subtle',
  '--muted-foreground': '--color-feednow-secondary-text',
  '--accent': '--color-feednow-accent-subtle',
  '--accent-foreground': '--color-feednow-foreground',
  '--destructive': '--color-feednow-destructive',
  '--destructive-foreground': '--color-feednow-on-primary',
  '--border': '--color-feednow-border',
  '--input': '--color-feednow-border',
  '--ring': '--color-feednow-accent-strong',
}

function tokenValue(name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const value = css.match(new RegExp(`${escaped}\\s*:\\s*(#[0-9a-f]{6})(?![0-9a-f])`, 'i'))?.[1]
  if (!value) throw new Error(`${name} must be a literal six-digit hex token in src/index.css`)
  return value
}

function semanticToken(name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const value = css.match(new RegExp(`${escaped}\\s*:\\s*var\\((--[\\w-]+)\\)`))?.[1]
  if (!value) throw new Error(`${name} must reference a palette token`)
  return value
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

describe('FeedNow light theme tokens', () => {
  it.each(paletteTokens)('%s is a literal six-digit hex value', (token) => {
    expect(tokenValue(token)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('maps every shadcn semantic variable to its declared palette token', () => {
    for (const [name, token] of Object.entries(semanticMappings)) {
      expect(semanticToken(name), name).toBe(token)
    }
  })

  it('does not declare a dark palette variant in Phase 02', () => {
    expect(css).not.toMatch(/\.dark\s*\{/)
    expect(css).not.toContain('--color-feednow-dark-')
  })

  it.each([
    ['slate-900 primary text on white', '--foreground', '--background'],
    ['slate-600 secondary text on white', '--muted-foreground', '--background'],
    ['red-600 error text on white', '--destructive', '--background'],
    ['white text on primary button', '--primary-foreground', '--primary'],
  ])('%s meets WCAG AA', (_label, foreground, background) => {
    const ratio = contrast(tokenValue(semanticToken(foreground)), tokenValue(semanticToken(background)))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})
