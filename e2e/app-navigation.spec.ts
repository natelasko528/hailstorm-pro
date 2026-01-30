import { test, expect } from '@playwright/test'

test.describe('App Navigation', () => {
  test('can navigate from landing page to app dashboard', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/app"]').first().click()
    await page.waitForURL('/app')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('login page shows dev notice and continue button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in and sign up are disabled')).toBeVisible()
    await expect(page.getByText('Continue to App')).toBeVisible()
  })

  test('login page continue button navigates to /app', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Continue to App').click()
    await page.waitForURL('/app')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('app dashboard loads without auth', async ({ page }) => {
    await page.goto('/app')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('storms page loads without auth', async ({ page }) => {
    await page.goto('/app/storms')
    await expect(page.getByText('Storm Tracker')).toBeVisible()
  })

  test('leads page loads without auth', async ({ page }) => {
    await page.goto('/app/leads')
    await expect(page.getByText('Lead Management')).toBeVisible()
  })

  test('settings page loads without auth', async ({ page }) => {
    await page.goto('/app/settings')
    await expect(page.getByText('Settings')).toBeVisible()
  })
})
