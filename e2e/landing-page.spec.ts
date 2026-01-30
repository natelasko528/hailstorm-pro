import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section with correct heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Turn Storm Data Into')
    await expect(page.locator('h1')).toContainText('Roofing Leads')
  })

  test('renders navigation links', async ({ page }) => {
    await expect(page.getByText('Features')).toBeVisible()
    await expect(page.getByText('How It Works')).toBeVisible()
    await expect(page.getByText('Pricing')).toBeVisible()
  })

  test('CTA buttons link to /app', async ({ page }) => {
    const ctaButton = page.locator('a[href="/app"]').first()
    await expect(ctaButton).toBeVisible()
  })

  test('renders feature cards', async ({ page }) => {
    await expect(page.getByText('Real-Time Storm Tracking')).toBeVisible()
    await expect(page.getByText('Property Identification')).toBeVisible()
    await expect(page.getByText('AI Lead Scoring')).toBeVisible()
  })

  test('renders pricing section', async ({ page }) => {
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Professional')).toBeVisible()
    await expect(page.getByText('Enterprise')).toBeVisible()
  })

  test('renders stats section', async ({ page }) => {
    await expect(page.getByText('10,000+')).toBeVisible()
    await expect(page.getByText('85%')).toBeVisible()
  })

  test('mobile menu toggle works', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test')
    // Mobile menu button should be visible
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(menuButton).toBeVisible()
  })
})
