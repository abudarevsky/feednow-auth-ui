// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * Typography token/test contract (Phase 02): src/index.css declares the
 * FeedNow type scale as literal rem `--text-*` custom properties in a
 * Tailwind v4 `@theme` block, each paired with an explicit unitless
 * `--text-*--line-height` and a `--text-*--letter-spacing` value, plus
 * `--font-sans`/`--font-mono` stacks. This test parses the same custom
 * properties by name (no build pipeline) and cross-checks every scale
 * utility used by src/components/typography.tsx against the declared steps,
 * so components and tokens cannot drift.
 */

const themeCss = readFileSync(
  fileURLToPath(new URL('../index.css', import.meta.url)),
  'utf8',
)

const typographyCss = readFileSync(
  fileURLToPath(new URL('../components/typography.tsx', import.meta.url)),
  'utf8',
)

/** Ordered scale steps from smallest to largest. */
const scaleSteps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const

type ScaleStep = (typeof scaleSteps)[number]

function escapeRegExp(value: string): string {
  return value.replace(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`)
}

/** Read a custom property's raw value from src/index.css by exact name. */
function cssPropertyValue(customProperty: string): string {
  const pattern = new RegExp(
    String.raw`${escapeRegExp(customProperty)}(?![\w-])\s*:\s*([^;]+);`,
  )
  const match = themeCss.match(pattern)
  if (!match?.[1]) {
    throw new Error(`${customProperty} must be defined in src/index.css`)
  }
  return match[1].trim()
}

function sizeRem(step: ScaleStep): number {
  const value = cssPropertyValue(`--text-${step}`)
  const match = value.match(/^([0-9.]+)rem$/)
  if (!match?.[1]) {
    throw new Error(`--text-${step} must be a literal rem value, got "${value}"`)
  }
  return Number.parseFloat(match[1])
}

/** Scale steps declared in src/index.css as literal rem `--text-*` values. */
function definedScaleSteps(): Set<string> {
  const steps = new Set<string>()
  for (const match of themeCss.matchAll(/--text-([\w-]+)\s*:\s*[0-9.]+rem/g)) {
    steps.add(match[1]!)
  }
  return steps
}

/** Names usable as `text-<name>` color utilities (`--color-<name>`). */
function definedColorUtilities(): Set<string> {
  const names = new Set<string>()
  for (const match of themeCss.matchAll(/--color-([\w-]+)\s*:/g)) {
    names.add(match[1]!)
  }
  return names
}

describe('Typography scale tokens', () => {
  it('defines exactly the declared scale steps', () => {
    expect(definedScaleSteps()).toEqual(new Set<string>(scaleSteps))
  })

  it('defines the sans and mono font stacks as tokens', () => {
    expect(cssPropertyValue('--font-sans')).toContain('ui-sans-serif')
    expect(cssPropertyValue('--font-mono')).toContain('ui-monospace')
  })

  it.each(scaleSteps)('--text-%s has a literal rem size', (step) => {
    expect(sizeRem(step)).toBeGreaterThan(0)
  })

  it.each(scaleSteps)('--text-%s pairs a unitless line-height', (step) => {
    expect(cssPropertyValue(`--text-${step}--line-height`)).toMatch(
      /^[0-9.]+$/,
    )
  })

  it.each(scaleSteps)('--text-%s pairs a letter-spacing value', (step) => {
    expect(cssPropertyValue(`--text-${step}--letter-spacing`)).toMatch(
      /^-?(?:0|[0-9.]+(?:rem|em))$/,
    )
  })

  it('increases monotonically across the scale', () => {
    const sizes = scaleSteps.map(sizeRem)
    for (let index = 1; index < sizes.length; index += 1) {
      expect(sizes[index]).toBeGreaterThan(sizes[index - 1])
    }
  })
})

describe('Base layer and component usage', () => {
  it('drives html and body off the typography tokens', () => {
    expect(themeCss).toMatch(/font-family:\s*var\(--font-sans\)/)
    expect(themeCss).toMatch(/font-size:\s*var\(--text-base\)/)
    expect(themeCss).toMatch(/line-height:\s*var\(--text-base--line-height\)/)
  })

  it('only uses text utilities that the stylesheet defines', () => {
    const scale = definedScaleSteps()
    const colors = definedColorUtilities()
    // Every `text-<name>` token in the components file, including arbitrary
    // values like text-[13px], which must never appear.
    const used = [
      ...typographyCss.matchAll(/\btext-(\[[^\]]*\]|[\w-]+)/g),
    ].map((match) => match[1]!)
    const scaleUsed = used.filter((name) => scale.has(name))
    expect(scaleUsed.length).toBeGreaterThan(0)
    for (const name of used) {
      expect(
        scale.has(name) || colors.has(name),
        `text-${name} in typography.tsx has no --text-* scale step or --color-* token in src/index.css`,
      ).toBe(true)
    }
  })
})
