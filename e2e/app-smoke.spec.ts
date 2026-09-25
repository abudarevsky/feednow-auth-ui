import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"code":"unauthenticated"}' }))
})

test('public auth route and protected route render from the built static artifact', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to sign in' })).toBeVisible()
})
