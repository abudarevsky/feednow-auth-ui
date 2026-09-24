import { expect, test } from '@playwright/test'

test('primitives gallery renders from the built static artifact', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Phase 02 design system' })
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Account access' })
  ).toBeVisible()
})
