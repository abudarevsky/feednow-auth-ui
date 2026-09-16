/**
 * Spacing scale metadata (Phase 02 design foundations).
 *
 * This module is the single TypeScript view of the `--spacing-*` custom
 * properties declared in src/index.css. It intentionally stores no pixel or
 * rem literals: the stylesheet owns the values, and
 * src/test/spacing-scale.test.ts asserts that every step named here exists
 * there as a literal rem value (and vice versa), so the two cannot drift.
 * src/hooks/use-spacing.ts reads the computed custom properties at runtime.
 *
 * Keep this file DOM-free: it is imported by node-environment tests.
 */

/** Ordered spacing steps, smallest to largest; mirrors `--spacing-*` in src/index.css. */
export const SPACING_STEPS = [
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const

/** A named step on the FeedNow spacing scale. */
export type SpacingStep = (typeof SPACING_STEPS)[number]

/** The CSS custom property name that carries a step's value. */
export function spacingVar(step: SpacingStep): string {
  return `--spacing-${step}`
}

/**
 * Convert a raw `--spacing-*` custom-property value to pixels.
 *
 * Custom properties resolve as their literal text, so a rem value is scaled
 * by the caller-supplied root font size (the hook measures it from
 * `getComputedStyle`). Only the literal units the token contract allows —
 * rem and px, case-insensitively, optionally signed for override sites — are
 * accepted; anything else (unitless numbers, calc(), var() chains, malformed
 * text) yields undefined so callers can decide how to handle a missing
 * token instead of receiving a wrong number.
 */
export function parseSpacingToPx(
  value: string,
  rootFontSizePx: number,
): number | undefined {
  const match = /^([-+]?[0-9]*\.?[0-9]+)(rem|px)$/i.exec(value.trim())
  if (!match?.[1] || !match[2]) {
    return undefined
  }
  const amount = Number.parseFloat(match[1])
  if (!Number.isFinite(amount) || !Number.isFinite(rootFontSizePx)) {
    return undefined
  }
  return /rem$/i.test(match[2]) ? amount * rootFontSizePx : amount
}
