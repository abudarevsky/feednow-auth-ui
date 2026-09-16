import { useEffect, useState } from 'react'

import {
  SPACING_STEPS,
  parseSpacingToPx,
  spacingVar,
  type SpacingStep,
} from '@/lib/spacing'

/**
 * Runtime access to the `--spacing-*` scale declared in src/index.css
 * (Phase 02 design foundations).
 *
 * Components should express margins and padding with the Tailwind utilities
 * generated from the same tokens (`p-md`, `gap-lg`, `mt-2xl`, …) so styling
 * stays in the cascade. These hooks exist for the cases where a *number* is
 * required in JavaScript — scroll offsets, focus management, Radix overlay
 * collision padding, canvas layout — and must therefore keep pace with the
 * stylesheet instead of duplicating literals. Values are read from the
 * computed custom properties, so a future density/override theme that
 * redefines `--spacing-*` is picked up automatically, and rem values follow
 * the root font size on zoom or browser font changes (re-measured on
 * resize). A step is absent from the map only if its custom property is
 * missing from the cascade or is not a literal rem/px value.
 */

/** Spacing steps resolved to pixels; absent keys mean the token was unreadable. */
export type SpacingPx = Partial<Record<SpacingStep, number>>

function measureSpacingPx(): SpacingPx {
  if (typeof document === 'undefined') {
    return {}
  }
  const styles = getComputedStyle(document.documentElement)
  const rootFontSizePx = Number.parseFloat(styles.fontSize)
  if (!Number.isFinite(rootFontSizePx) || rootFontSizePx <= 0) {
    return {}
  }
  const measured: SpacingPx = {}
  for (const step of SPACING_STEPS) {
    const px = parseSpacingToPx(
      styles.getPropertyValue(spacingVar(step)),
      rootFontSizePx,
    )
    if (px !== undefined) {
      measured[step] = px
    }
  }
  return measured
}

function sameSpacingPx(a: SpacingPx, b: SpacingPx): boolean {
  return SPACING_STEPS.every((step) => a[step] === b[step])
}

/**
 * Pixels for every spacing step, keyed by step name, read from the live
 * cascade. Re-measured on mount and whenever the window resizes; the
 * returned object identity only changes when a value actually changed.
 */
export function useSpacing(): SpacingPx {
  const [spacing, setSpacing] = useState<SpacingPx>(measureSpacingPx)

  useEffect(() => {
    const remeasure = () =>
      setSpacing((previous) => {
        const next = measureSpacingPx()
        return sameSpacingPx(previous, next) ? previous : next
      })
    remeasure()
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [])

  return spacing
}

/** Pixels for a single spacing step; undefined if the token is unreadable. */
export function useSpacingPx(step: SpacingStep): number | undefined {
  return useSpacing()[step]
}
