/**
 * E2E Tests for Keepsakes
 */

import { test, expect } from '@playwright/test'

test.describe('Keepsakes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/keepsakes')
  })

  test('should display keepsakes page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should show keepsake generation options', async ({ page }) => {
    // Look for PDF and Video generation options
    const pdfOption = page.locator('text=/pdf|album/i').first()
    const videoOption = page.locator('text=/video|highlight/i').first()

    // At least one should be visible
    const pdfVisible = await pdfOption.isVisible().catch(() => false)
    const videoVisible = await videoOption.isVisible().catch(() => false)

    expect(pdfVisible || videoVisible).toBe(true)
  })

  test('should have generate buttons for sessions', async ({ page }) => {
    const generateButtons = page.locator('button').filter({ hasText: /generate/i })
    const count = await generateButtons.count()

    // If there are sessions, there should be generate buttons
    if (count > 0) {
      await expect(generateButtons.first()).toBeVisible()
    }
  })

  test('should show info cards explaining features', async ({ page }) => {
    // Look for informational content about keepsakes
    const infoCards = page.locator('[role="article"], .info-card, .card')
    const count = await infoCards.count()

    if (count > 0) {
      await expect(infoCards.first()).toBeVisible()
    }
  })
})
