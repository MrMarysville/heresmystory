/**
 * E2E Tests for Profile Management
 */

import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profiles')
  })

  test('should display profiles page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should have create profile button', async ({ page }) => {
    const createButton = page.locator('button').filter({ hasText: /create|new.*profile/i }).first()
    await expect(createButton).toBeVisible()
  })

  test('should show profile cards when profiles exist', async ({ page }) => {
    // Check if any profile cards are rendered
    const profileCards = page.locator('[data-testid="profile-card"], .profile-card')
    const count = await profileCards.count()

    if (count > 0) {
      await expect(profileCards.first()).toBeVisible()
    }
  })

  test('should navigate to profile details', async ({ page }) => {
    // Click on first profile card's view button if it exists
    const viewButton = page.locator('button').filter({ hasText: /view.*details|view/i }).first()

    if (await viewButton.isVisible()) {
      await viewButton.click()
      await expect(page).toHaveURL(/.*profiles\/[a-zA-Z0-9-]+/)
    }
  })

  test('should be accessible via keyboard', async ({ page }) => {
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
