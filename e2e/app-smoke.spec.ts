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

test('administrator sees the own-organization badge instead of destructive actions', async ({ page }) => {
  await page.unroute('**/api/v1/me')
  await page.route('**/api/v1/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'usr_admin', display_name: 'Admin', email: 'admin@example.test', status: 'active', application_role: 'admin', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z' }),
  }))
  await page.route('**/api/v1/admin/summary', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ organization_count: 1, active_membership_count: 1 }),
  }))
  const organization = {
    id: 'org_1', name: 'FeedNow Studio', name_status: 'confirmed', created_at: '2026-09-25T00:00:00Z',
    member_count: 1,
    members: [{ user_id: 'usr_admin', display_name: 'Admin', email: 'admin@example.test', role: 'owner', account_status: 'active', registered_at: '2026-09-25T00:00:00Z', joined_at: '2026-09-25T00:00:00Z' }],
    is_current_user_owner: true,
  }
  await page.route('**/api/v1/admin/organizations?*', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ items: [organization], limit: 20, next_cursor: null }),
  }))
  await page.route('**/api/v1/admin/organizations/org_1', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ...organization, type: 'customer', status: 'active', updated_at: '2026-09-25T00:00:00Z', services: [{ id: 'vispector', name: 'Vispector' }], api_keys: [] }),
  }))
  await page.route('**/api/v1/admin/organizations/org_1/members?*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: organization.members, limit: 100, next_cursor: null }),
  }))

  await page.goto('/account/admin')
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible()
  await expect(page.getByText('FeedNow Studio')).toBeVisible()
  await page.getByLabel('FeedNow Studio (1)').click()
  await page.getByRole('button', { name: 'View full details' }).click()
  await expect(page.getByText('Organization details', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh details' })).toBeVisible()
  await expect(page.getByText(/Admin · admin@example\.test · owner/)).toBeVisible()
  await expect(page.getByText('Your Organization')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actions for FeedNow Studio' })).toHaveCount(0)
})

test('new users complete their profile and organization setup', async ({ page }) => {
  await page.unrouteAll()
  const apiTraffic: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('/api/')) apiTraffic.push(`${response.request().method()} ${response.url()} ${response.status()}`)
  })
  let displayName = 'New User'
  let organizationName = 'New user Workspace'
  let confirmed = false
  await page.route('**/api/v1/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      displayName = (route.request().postDataJSON() as { display_name: string }).display_name
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'usr_new', display_name: displayName, email: 'new@example.test', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-26T00:00:00Z' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'usr_new', display_name: displayName, email: 'new@example.test', status: 'active', application_role: 'user', created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-26T00:00:00Z' }) })
  })
  await page.route('**/api/v1/csrf', (route) => route.fulfill({
    status: 204,
    headers: { 'Set-Cookie': 'feednow_csrf=e2e-csrf-token; Path=/; SameSite=Lax' },
  }))
  await page.route('**/api/v1/organizations**', async (route) => {
    if (route.request().method() === 'PATCH') {
      organizationName = (route.request().postDataJSON() as { name: string }).name
      confirmed = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'org_new', name: organizationName, name_status: 'confirmed', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'org_new', name: organizationName, name_status: confirmed ? 'confirmed' : 'placeholder', status: 'active', suspended_at: null, type: 'personal', created_at: '2026-09-25T00:00:00Z' }], limit: 100, next_cursor: null }) })
  })
  await page.route('**/api/v1/organizations/org_new/slug-availability**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ available: true, slug: 'analytical-engines' }),
  }))
  await page.route('**/api/v1/organizations/org_new/members*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ user_id: 'usr_new', role: 'owner', status: 'active', created_at: '2026-09-25T00:00:00Z' }], limit: 100, next_cursor: null }) }))
  await page.route('**/api/v1/services', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }))

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Welcome to FeedNow' })).toBeVisible()
  await page.getByLabel('First name').fill('Ada')
  await page.getByLabel('Last name').fill('Lovelace')
  await page.getByLabel('Organization name').fill('Analytical Engines')
  await expect(page.getByRole('button', { name: 'Complete setup' })).toBeEnabled()
  await page.getByRole('button', { name: 'Complete setup' }).click()
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
  await expect(page.getByText('Analytical Engines (1)')).toBeVisible()
  await expect.poll(() => displayName).toBe('Ada Lovelace')
  await expect.poll(() => organizationName).toBe('Analytical Engines')
})
