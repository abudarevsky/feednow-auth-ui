import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SPACING_STEPS, spacingVar, type SpacingStep } from '@/lib/spacing'
import { useSpacing, useSpacingPx } from '@/hooks/use-spacing'

/**
 * useSpacing hook behavior (Phase 02): the hook must read the `--spacing-*`
 * custom properties from the live cascade, scale rem literals by the root
 * font size, re-measure on resize, and omit unreadable tokens. The token
 * names/values themselves are guarded by src/test/spacing-scale.test.ts; the
 * values injected here deliberately differ from the stylesheet contract to
 * prove the hook never hard-codes a copy of the scale.
 */

function setSpacingTokens(tokens: Partial<Record<SpacingStep, string>>): void {
  for (const step of SPACING_STEPS) {
    const value = tokens[step]
    if (value) {
      document.documentElement.style.setProperty(spacingVar(step), value)
    } else {
      document.documentElement.style.removeProperty(spacingVar(step))
    }
  }
}

beforeEach(() => {
  document.documentElement.style.setProperty('font-size', '16px')
})

afterEach(() => {
  setSpacingTokens({})
  document.documentElement.style.removeProperty('font-size')
})

describe('useSpacing', () => {
  it('reads every declared token from the cascade and converts rem to px', () => {
    setSpacingTokens({
      '2xs': '0.125rem',
      md: '2.5rem',
      '2xl': '10rem',
    })

    const { result } = renderHook(() => useSpacing())

    expect(result.current).toEqual({ '2xs': 2, md: 40, '2xl': 160 })
  })

  it('scales rem values with the root font size and re-measures on resize', () => {
    setSpacingTokens({ lg: '1.5rem' })

    const { result } = renderHook(() => useSpacing())
    expect(result.current.lg).toBe(24)

    act(() => {
      document.documentElement.style.setProperty('font-size', '20px')
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.lg).toBe(30)
  })

  it('honors runtime overrides of a spacing variable', () => {
    setSpacingTokens({ md: '1rem' })
    const { result } = renderHook(() => useSpacing())
    expect(result.current.md).toBe(16)

    act(() => {
      setSpacingTokens({ md: '2rem' })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.md).toBe(32)
  })

  it('accepts signed and uppercase rem/px literals for override sites', () => {
    setSpacingTokens({ xs: '-0.5REM', sm: '+16px' })

    const { result } = renderHook(() => useSpacing())

    expect(result.current).toEqual({ xs: -8, sm: 16 })
  })

  it('omits tokens that are missing or not literal rem/px values', () => {
    setSpacingTokens({ xs: '0.5rem', sm: 'calc(0.5rem + 4px)', md: '16' })

    const { result } = renderHook(() => useSpacing())

    expect(result.current).toEqual({ xs: 8 })
  })

  it('keeps the same object identity while values are unchanged', () => {
    setSpacingTokens({ xl: '2rem' })

    const { result } = renderHook(() => useSpacing())
    const first = result.current

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(first)
  })

  it('stops re-measuring after unmount (no leaked resize listener)', () => {
    setSpacingTokens({ md: '1rem' })

    const { result, unmount } = renderHook(() => useSpacing())
    unmount()

    act(() => {
      setSpacingTokens({ md: '2rem' })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.md).toBe(16)
  })
})

describe('useSpacingPx', () => {
  it('returns the pixel value for a single step', () => {
    setSpacingTokens({ sm: '0.75rem' })

    const { result } = renderHook(() => useSpacingPx('sm'))
    expect(result.current).toBe(12)
  })

  it('returns undefined when the step has no readable token', () => {
    const { result } = renderHook(() => useSpacingPx('sm'))
    expect(result.current).toBeUndefined()
  })
})
