import { expect, test } from '@playwright/test'

test('placeholder page renders from the built static artifact', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'feednow-auth-ui' })
  ).toBeVisible()
  await expect(
    page.getByText('Static React scaffold placeholder.')
  ).toBeVisible()
})
