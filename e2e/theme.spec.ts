import { expect, test } from '@playwright/test'

/**
 * Browser coverage for the dark mode toggle against the built static
 * artifact: the flip is observable (the `.dark` class and the actual body
 * background change), the choice persists across a reload, and the
 * index.html pre-paint script applies dark before hydration (the class is
 * already present once the reload finishes). Playwright's default
 * colorScheme is light, so the initial state is deterministic.
 */
test('theme toggle flips the palette and persists across reloads', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )

  const toggle = page.getByRole('button', { name: 'Dark mode' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()

  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(15, 23, 42)',
  )
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await page.reload()

  // Pre-paint script: dark is applied without waiting for React.
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(15, 23, 42)',
  )
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await toggle.click()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
})
