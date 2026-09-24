import { expect, test } from '@playwright/test'

const publicRoutes = [
  ['/login', 'Sign in'],
  ['/signup', 'Create account'],
  ['/verify-email', 'Verify email'],
  ['/forgot-password', 'Forgot password'],
  ['/reset-password', 'Reset password'],
  ['/logout', 'Sign out'],
] as const

const accountRoutes = ['/account', '/account/security', '/account/api-keys'] as const

for (const [path, heading] of publicRoutes) {
  test(`direct route ${path} loads its public page`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Page not found')
    expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
  })
}

for (const path of accountRoutes) {
  test(`direct protected route ${path} shows deterministic session loading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible()
    expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
  })
}

test('entry navigation stays client-side and unknown paths render a not-found page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  await page.goto('/not-a-real-page')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
})
