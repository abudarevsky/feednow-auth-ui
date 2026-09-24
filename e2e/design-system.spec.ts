import { expect, test } from '@playwright/test'

test('gallery, auth card, and account shell fit without horizontal overflow', async ({
  page,
}) => {
  await page.goto('/')

  for (const selector of [
    'main',
    '[aria-labelledby="auth-card-preview"]',
    '[aria-labelledby="account-shell-preview"]',
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded()
    const dimensions = await page.evaluate<{ clientWidth: number; scrollWidth: number }>(`(() => {
      const scrollingElement = document.scrollingElement
      return {
        clientWidth: scrollingElement?.clientWidth ?? 0,
        scrollWidth: scrollingElement?.scrollWidth ?? 0,
      }
    })()`)
    expect(
      dimensions.scrollWidth,
      `horizontal overflow while viewing ${selector}`,
    ).toBeLessThanOrEqual(dimensions.clientWidth)
  }

  const authCard = await page.locator('[data-slot="card"]').boundingBox()
  expect(authCard?.width ?? 0).toBeGreaterThan(200)
})

test('keyboard focus has a visible outline', async ({ page }) => {
  await page.goto('/')
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

test('Dialog, AlertDialog, and Sheet manage focus and restore their triggers', async ({
  page,
}, testInfo) => {
  await page.goto('/')

  const dialogTrigger = page.getByRole('button', { name: 'Open dialog preview' })
  await dialogTrigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Dialog preview')
  await dialog.getByRole('button').last().focus()
  await page.keyboard.press('Tab')
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(dialogTrigger).toBeFocused()

  const alertTrigger = page.getByRole('button', { name: 'Revoke key' })
  await alertTrigger.click()
  const alertDialog = page.getByRole('alertdialog')
  await expect(alertDialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(alertDialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(alertDialog).toBeHidden()
  await expect(alertTrigger).toBeFocused()

  if (testInfo.project.name === 'mobile-375') {
    const sheetTrigger = page.getByRole('button', { name: 'Open account navigation' })
    await sheetTrigger.click()
    const sheet = page.getByRole('dialog', { name: 'Account navigation' })
    await expect(sheet).toBeVisible()
    await expect(sheet.locator(':focus')).toHaveCount(1)
    await sheet.getByRole('button').last().focus()
    await page.keyboard.press('Tab')
    await expect(sheet.locator(':focus')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(sheetTrigger).toBeFocused()
  }
})

test('auth card visual baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-slot="card"]')).toHaveScreenshot({
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  })
})

test('account shell visual baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[aria-labelledby="account-shell-preview"]')).toHaveScreenshot({
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  })
})
