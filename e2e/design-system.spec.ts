import { expect, test } from '@playwright/test'

test('public auth card fits the viewport without horizontal overflow', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  const dimensions = await page.evaluate<{ clientWidth: number; scrollWidth: number }>(`(() => {
    const scrollingElement = document.scrollingElement
    return {
      clientWidth: scrollingElement?.clientWidth ?? 0,
      scrollWidth: scrollingElement?.scrollWidth ?? 0,
    }
  })()`)
  expect(dimensions.scrollWidth, 'horizontal overflow on the auth route').toBeLessThanOrEqual(dimensions.clientWidth)
  expect((await page.locator('[data-slot="card"]').boundingBox())?.width ?? 0).toBeGreaterThan(200)
})

test('keyboard focus has a visible outline on an auth link', async ({ page }) => {
  await page.goto('/login')
  await page.keyboard.press('Tab')

  const focusStyle = await page.evaluate<{ outlineStyle: string; outlineWidth: string } | null>(`(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return null
    const style = getComputedStyle(active)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })()`)

  expect(focusStyle).not.toBeNull()
  expect(focusStyle?.outlineStyle).not.toBe('none')
  expect(Number.parseFloat(focusStyle?.outlineWidth ?? '0')).toBeGreaterThan(0)
})

test('auth card visual baseline', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('[data-slot="card"]')).toHaveScreenshot({
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  })
})
