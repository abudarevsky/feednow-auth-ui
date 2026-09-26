import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"code":"unauthenticated"}' }))
})

const publicRoutes = [
  ['/login', 'Sign in'],
  ['/signup', 'Create account'],
  ['/verify-email', 'Verify email'],
  ['/forgot-password', 'Forgot password'],
  ['/reset-password', 'Reset password'],
  ['/logout', 'Sign out'],
] as const

const accountRoutes = ['/account', '/account/api-keys'] as const

for (const [path, heading] of publicRoutes) {
  test(`direct route ${path} loads its public page`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Page not found')
    expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
  })
}

for (const path of accountRoutes) {
  test(`direct protected route ${path} shows the unauthenticated state`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in required' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to sign in' })).toBeVisible()
    expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
  })
}

test('protected route has a visible sign-in card', async ({ page }) => {
  await page.goto('/account')
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in required' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to sign in' })).toBeVisible()
  await expect(page.locator('[data-slot="card"]')).toHaveScreenshot({
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  })
})

test('entry navigation stays client-side and unknown paths render a not-found page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  await page.goto('/not-a-real-page')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
})
