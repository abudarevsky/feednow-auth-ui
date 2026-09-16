// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// nodenext module resolution (tsconfig.node.json) requires the .ts extension
import { SPACING_STEPS, spacingVar, type SpacingStep } from '../lib/spacing.ts'

/**
 * Spacing token/test contract (Phase 02): src/index.css declares the FeedNow
 * spacing scale as literal rem `--spacing-*` custom properties in a Tailwind
 * v4 `@theme static` block, and src/lib/spacing.ts enumerates exactly those
 * step names for src/hooks/use-spacing.ts. This test parses the same custom
 * properties by name (no build pipeline) and cross-checks them against the
 * TypeScript metadata, so the stylesheet and the hook can never drift apart.
 */

const themeCss = readFileSync(
  fileURLToPath(new URL('../index.css', import.meta.url)),
  'utf8',
)

function escapeRegExp(value: string): string {
  return value.replace(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`)
}

/**
 * The `@theme static` block that declares the spacing scale. `static` is
 * load-bearing: without it Tailwind v4 tree-shakes theme variables that no
 * utility uses, and useSpacing() would silently lose those steps. Parsing is
 * scoped to this block so tokens cannot satisfy the contract from a plain
 * `:root` rule that generates no utilities.
 */
function spacingThemeBlock(): string {
  for (const match of themeCss.matchAll(/@theme\s+static\s*\{([^}]*)\}/g)) {
    if (match[1]?.includes('--spacing-')) {
      return match[1]
    }
  }
  throw new Error(
    'the --spacing-* scale must be declared in an @theme static block in src/index.css',
  )
}

/** Read a custom property's raw value from the spacing @theme block by exact name. */
function cssPropertyValue(customProperty: string): string {
  const pattern = new RegExp(
    String.raw`${escapeRegExp(customProperty)}(?![\w-])\s*:\s*([^;]+);`,
  )
  const match = spacingThemeBlock().match(pattern)
  if (!match?.[1]) {
    throw new Error(`${customProperty} must be defined in src/index.css`)
  }
  return match[1].trim()
}

/** Step names declared in the spacing @theme block as `--spacing-<name>` properties. */
function definedSpacingSteps(): Set<string> {
  const steps = new Set<string>()
  for (const match of spacingThemeBlock().matchAll(
    /--spacing-([\w-]+)\s*:/g,
  )) {
    steps.add(match[1]!)
  }
  return steps
}

function stepRem(step: SpacingStep): number {
  const value = cssPropertyValue(spacingVar(step))
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)rem$/)
  if (!match?.[1]) {
    throw new Error(
      `${spacingVar(step)} must be a literal rem value, got "${value}"`,
    )
  }
  return Number.parseFloat(match[1])
}

describe('Spacing scale tokens', () => {
  it('defines exactly the steps enumerated by src/lib/spacing.ts', () => {
    expect(definedSpacingSteps()).toEqual(new Set<string>(SPACING_STEPS))
  })

  it('does not override the Tailwind --spacing multiplier', () => {
    // Numeric utilities (p-4, gap-8, …) must keep deriving from the default
    // 0.25rem multiplier; only named steps belong to the FeedNow scale.
    expect(themeCss).not.toMatch(/--spacing(?![\w-])\s*:/)
  })

  it.each(SPACING_STEPS)('--spacing-%s is a literal rem value', (step) => {
    expect(stepRem(step)).toBeGreaterThan(0)
  })

  it.each(SPACING_STEPS)('--spacing-%s lands on the 4px grid', (step) => {
    expect(stepRem(step) * 16 % 4).toBeCloseTo(0, 6)
  })

  it('increases monotonically across the scale', () => {
    const sizes = SPACING_STEPS.map(stepRem)
    for (let index = 1; index < sizes.length; index += 1) {
      expect(sizes[index]).toBeGreaterThan(sizes[index - 1]!)
    }
  })
})
