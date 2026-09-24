import { expect, test } from '@playwright/test'

test('public auth route and protected route render from the built static artifact', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  await page.goto('/account')
  await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible()
})
