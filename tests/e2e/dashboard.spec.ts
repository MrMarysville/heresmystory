/**
 * E2E Tests for Dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd authenticate first
    // For now, we'll just navigate to dashboard
    await page.goto('/dashboard')
  })

  test('should display dashboard page', async ({ page }) => {
    // Check for main heading or key element
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should show recording controls', async ({ page }) => {
    // Look for record button or similar control
    const recordButton = page.locator('button').filter({ hasText: /record|start/i }).first()
    await expect(recordButton).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    // Check for navigation links
    const navLinks = page.locator('nav a, [role="navigation"] a')
    await expect(navLinks.first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    // Page should still be usable
    await expect(page.locator('body')).toBeVisible()
  })
})
