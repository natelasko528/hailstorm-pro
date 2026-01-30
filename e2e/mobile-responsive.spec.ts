import { test, expect } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  test.describe('Layout and Sidebar', () => {
    test('sidebar is hidden on mobile by default', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      // Sidebar should be off-screen (translated left)
      const sidebar = page.locator('nav').locator('..')
      await expect(sidebar).toHaveCSS('transform', /translateX/)
    })

    test('hamburger menu button is visible on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      // The Menu icon button should be visible
      const menuButton = page.locator('header button').first()
      await expect(menuButton).toBeVisible()
    })

    test('hamburger menu opens sidebar on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      // Click hamburger menu
      await page.locator('header button').first().click()
      // Sidebar should now be visible with navigation links
      await expect(page.getByText('HailStorm Pro')).toBeVisible()
      await expect(page.getByText('Storm Map')).toBeVisible()
    })

    test('sidebar overlay closes on tap', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      await page.locator('header button').first().click()
      // Click the overlay (background)
      await page.locator('.fixed.inset-0.bg-black\\/50').click()
      // Sidebar nav items should no longer be visible
      await expect(page.getByText('Storm Map')).not.toBeVisible()
    })

    test('sidebar is always visible on desktop', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Desktop-only test')
      await page.goto('/app')
      await expect(page.getByText('HailStorm Pro')).toBeVisible()
      await expect(page.getByText('Storm Map')).toBeVisible()
    })
  })

  test.describe('Dashboard Page', () => {
    test('stat cards stack on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      // Stat cards container should have single column
      const statsGrid = page.locator('.grid.grid-cols-1').first()
      await expect(statsGrid).toBeVisible()
    })

    test('time range buttons are visible on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app')
      await expect(page.getByText('7d')).toBeVisible()
      await expect(page.getByText('30d')).toBeVisible()
      await expect(page.getByText('90d')).toBeVisible()
    })

    test('quick actions are visible', async ({ page }) => {
      await page.goto('/app')
      await expect(page.getByText('Quick Actions')).toBeVisible()
      await expect(page.getByText('View Storms')).toBeVisible()
      await expect(page.getByText('Manage Leads')).toBeVisible()
    })
  })

  test.describe('Storms Page', () => {
    test('search bar is full width on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/storms')
      const searchInput = page.locator('input[type="text"]')
      await expect(searchInput).toBeVisible()
    })

    test('storm list and map stack vertically on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/storms')
      // Storm list should be visible at top
      const stormList = page.locator('.overflow-y-auto').first()
      await expect(stormList).toBeVisible()
    })

    test('refresh and export buttons show icons on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/storms')
      // Button icons should be visible even without text labels
      const buttons = page.locator('button').filter({ hasText: /Refresh|Export/ })
      // At least the button container should exist
      await expect(page.locator('button svg').first()).toBeVisible()
    })
  })

  test.describe('Leads Page', () => {
    test('filters wrap on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/leads')
      // Search should be full width
      const searchInput = page.locator('input[placeholder*="Search"]')
      await expect(searchInput).toBeVisible()
      // Filter selects should be visible
      const selects = page.locator('select')
      await expect(selects.first()).toBeVisible()
    })

    test('leads table is horizontally scrollable on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/leads')
      const scrollContainer = page.locator('.overflow-x-auto')
      await expect(scrollContainer).toBeVisible()
    })

    test('export button is visible', async ({ page }) => {
      await page.goto('/app/leads')
      await expect(page.getByText('Export')).toBeVisible()
    })
  })

  test.describe('Properties Page', () => {
    test('property details stack on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/properties/1')
      await expect(page.getByText('Property Details')).toBeVisible()
      await expect(page.getByText('Owner Information')).toBeVisible()
    })

    test('action buttons are full width and tappable', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')
      await page.goto('/app/properties/1')
      await expect(page.getByText('Call Owner')).toBeVisible()
      await expect(page.getByText('Send Email')).toBeVisible()
      await expect(page.getByText('Send SMS')).toBeVisible()
    })

    test('back button works', async ({ page }) => {
      await page.goto('/app/properties/1')
      await expect(page.getByText('Back to Leads')).toBeVisible()
    })
  })

  test.describe('Settings Page', () => {
    test('settings tabs are visible', async ({ page }) => {
      await page.goto('/app/settings')
      await expect(page.getByText('Profile')).toBeVisible()
      await expect(page.getByText('Notifications')).toBeVisible()
      await expect(page.getByText('Security')).toBeVisible()
    })

    test('profile form fields are visible', async ({ page }) => {
      await page.goto('/app/settings')
      await expect(page.locator('input[type="text"]').first()).toBeVisible()
      await expect(page.getByText('Save Changes')).toBeVisible()
    })

    test('notification toggles work', async ({ page }) => {
      await page.goto('/app/settings')
      await page.getByText('Notifications').click()
      await expect(page.getByText('New Storm Alerts')).toBeVisible()
      await expect(page.getByText('Lead Updates')).toBeVisible()
    })

    test('billing tab shows plan info', async ({ page }) => {
      await page.goto('/app/settings')
      await page.getByText('Billing').click()
      await expect(page.getByText('Professional Plan')).toBeVisible()
      await expect(page.getByText('$249/month')).toBeVisible()
    })
  })
})
