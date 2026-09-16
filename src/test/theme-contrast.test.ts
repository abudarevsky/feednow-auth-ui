// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * Token/test contract (Phase 02, step 1; extended by the dark mode toggle):
 * src/index.css declares every palette color — light and dark — as a literal
 * 6-digit hex value in a Tailwind v4 `@theme` block, and every shadcn
 * semantic variable (in `:root` and in the `.dark` override block) references
 * exactly one of those hex custom properties. This test parses the same hex
 * literals by custom property name (no oklch conversion) so tokens and
 * assertions cannot drift, and verifies WCAG 2.1 AA (>= 4.5:1) for the
 * arbiter text pairs in both themes.
 */

// Parsed from the source file itself (no build/oklch pipeline involved).
const themeCss = readFileSync(
  fileURLToPath(new URL('../index.css', import.meta.url)),
  'utf8',
)

/**
 * The `.dark { ... }` semantic-override block, parsed separately so dark
 * variable references resolve inside it rather than colliding with `:root`.
 */
function extractDarkBlock(css: string): string {
  const match = css.match(/\.dark\s*\{[^}]*\}/)
  if (!match) {
    throw new Error(
      'src/index.css must declare a .dark block overriding the semantic variables',
    )
  }
  return match[0]
}

const darkCss = extractDarkBlock(themeCss)

const WCAG_AA_NORMAL_TEXT_RATIO = 4.5

/** A literal 6-digit lowercase hex color, e.g. `#047857`. */
type HexColor = `#${string}`

function escapeRegExp(value: string): string {
  return value.replace(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`)
}

/** Read a palette token's literal 6-digit hex value from src/index.css. */
function hexTokenValue(customProperty: string, source: string = themeCss): HexColor {
  const pattern = new RegExp(
    String.raw`${escapeRegExp(customProperty)}(?![\w-])\s*:\s*(#[0-9a-f]{6})(?![0-9a-f])`,
  )
  const match = source.match(pattern)
  if (!match?.[1]) {
    throw new Error(
      `${customProperty} must be defined as a literal 6-digit hex value in src/index.css`,
    )
  }
  return match[1] as HexColor
}

/** Resolve a semantic variable (e.g. `--primary`) to the palette token it references. */
function referencedPaletteToken(
  semanticVariable: string,
  source: string = themeCss,
): string {
  const pattern = new RegExp(
    String.raw`${escapeRegExp(semanticVariable)}(?![\w-])\s*:\s*var\((--[\w-]+)\)`,
  )
  const match = source.match(pattern)
  if (!match?.[1]) {
    throw new Error(
      `${semanticVariable} must reference a --color-feednow-* palette token in src/index.css`,
    )
  }
  return match[1]
}

/**
 * Hex color of the palette token a semantic variable ultimately resolves to.
 * `source` scopes where the variable reference is looked up (e.g. the .dark
 * block); palette tokens are declared once file-wide in `@theme` blocks.
 */
function resolvedHex(
  semanticVariable: string,
  source: string = themeCss,
): HexColor {
  return hexTokenValue(referencedPaletteToken(semanticVariable, source))
}

type Rgb = readonly [red: number, green: number, blue: number]

function parseHex(hex: HexColor): Rgb {
  const digits = hex.slice(1)
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ]
}

function linearize(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.03928
    ? srgb / 12.92
    : ((srgb + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: HexColor): number {
  const [red, green, blue] = parseHex(hex)
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  )
}

/** WCAG 2.1 contrast ratio between two hex colors (1..21). */
function contrastRatio(a: HexColor, b: HexColor): number {
  const luminanceA = relativeLuminance(a)
  const luminanceB = relativeLuminance(b)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

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

const darkPaletteTokens = [
  '--color-feednow-dark-background',
  '--color-feednow-dark-on-primary',
  '--color-feednow-dark-foreground',
  '--color-feednow-dark-secondary-text',
  '--color-feednow-dark-tertiary-text',
  '--color-feednow-dark-surface-subtle',
  '--color-feednow-dark-surface-muted',
  '--color-feednow-dark-border',
  '--color-feednow-dark-primary',
  '--color-feednow-dark-primary-hover',
  '--color-feednow-dark-accent-strong',
  '--color-feednow-dark-accent-subtle',
  '--color-feednow-dark-accent-soft',
  '--color-feednow-dark-destructive',
  '--color-feednow-dark-destructive-hover',
  '--color-feednow-dark-destructive-subtle',
  '--color-feednow-dark-on-destructive',
] as const

/** Same variable set as :root, remapped onto dark tokens inside `.dark { … }`. */
const darkSemanticMappings: Readonly<Record<string, string>> = {
  '--background': '--color-feednow-dark-background',
  '--foreground': '--color-feednow-dark-foreground',
  '--card': '--color-feednow-dark-background',
  '--card-foreground': '--color-feednow-dark-foreground',
  '--popover': '--color-feednow-dark-background',
  '--popover-foreground': '--color-feednow-dark-foreground',
  '--primary': '--color-feednow-dark-primary',
  '--primary-foreground': '--color-feednow-dark-on-primary',
  '--secondary': '--color-feednow-dark-surface-muted',
  '--secondary-foreground': '--color-feednow-dark-foreground',
  '--muted': '--color-feednow-dark-surface-subtle',
  '--muted-foreground': '--color-feednow-dark-secondary-text',
  '--accent': '--color-feednow-dark-accent-subtle',
  '--accent-foreground': '--color-feednow-dark-foreground',
  '--destructive': '--color-feednow-dark-destructive',
  '--destructive-foreground': '--color-feednow-dark-on-destructive',
  '--border': '--color-feednow-dark-border',
  '--input': '--color-feednow-dark-border',
  '--ring': '--color-feednow-dark-accent-strong',
}

interface ContrastPair {
  readonly label: string
  readonly foreground: string
  readonly background: string
}

const aaContrastPairs: readonly ContrastPair[] = [
  {
    label: 'slate-900 primary text on white',
    foreground: '--foreground',
    background: '--background',
  },
  {
    label: 'slate-600 secondary text on white',
    foreground: '--muted-foreground',
    background: '--background',
  },
  {
    label: 'red-600 error text on white',
    foreground: '--destructive',
    background: '--background',
  },
  {
    label: 'white text on primary button',
    foreground: '--primary-foreground',
    background: '--primary',
  },
]

/** Same arbiter roles as the light pairs, resolved inside the .dark block. */
const darkAaContrastPairs: readonly ContrastPair[] = [
  {
    label: 'slate-50 primary text on slate-900',
    foreground: '--foreground',
    background: '--background',
  },
  {
    label: 'slate-300 secondary text on slate-900',
    foreground: '--muted-foreground',
    background: '--background',
  },
  {
    label: 'red-400 error text on slate-900',
    foreground: '--destructive',
    background: '--background',
  },
  {
    label: 'emerald-950 text on emerald-400 primary button',
    foreground: '--primary-foreground',
    background: '--primary',
  },
  {
    label: 'slate-900 text on red-400 destructive button',
    foreground: '--destructive-foreground',
    background: '--destructive',
  },
]

describe('FeedNow theme token contract', () => {
  it.each(paletteTokens)(
    '%s is a literal 6-digit hex value',
    (token) => {
      expect(hexTokenValue(token)).toMatch(/^#[0-9a-f]{6}$/)
    },
  )

  it.each(darkPaletteTokens)(
    '%s is a literal 6-digit hex value',
    (token) => {
      expect(hexTokenValue(token)).toMatch(/^#[0-9a-f]{6}$/)
    },
  )

  it('maps every shadcn semantic variable onto a literal-hex palette token', () => {
    for (const [semanticVariable, token] of Object.entries(semanticMappings)) {
      expect(referencedPaletteToken(semanticVariable), semanticVariable).toBe(
        token,
      )
    }
  })

  it('remaps every semantic variable onto a dark palette token inside .dark', () => {
    for (const [semanticVariable, token] of Object.entries(
      darkSemanticMappings,
    )) {
      expect(
        referencedPaletteToken(semanticVariable, darkCss),
        semanticVariable,
      ).toBe(token)
    }
  })
})

describe('WCAG 2.1 AA contrast (normal text >= 4.5:1)', () => {
  it.each(aaContrastPairs)('$label meets AA', ({ label, foreground, background }) => {
    const ratio = contrastRatio(resolvedHex(foreground), resolvedHex(background))
    expect(ratio, `${label} measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_RATIO,
    )
  })

  it.each(darkAaContrastPairs)(
    'dark: $label meets AA',
    ({ label, foreground, background }) => {
      const ratio = contrastRatio(
        resolvedHex(foreground, darkCss),
        resolvedHex(background, darkCss),
      )
      expect(ratio, `dark ${label} measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_RATIO,
      )
    },
  )
})
