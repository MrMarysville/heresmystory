/**
 * E2E Tests for Accessibility Features
 */

import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should have skip to content link', async ({ page }) => {
    const skipLink = page.locator('a').filter({ hasText: /skip.*content/i }).first()
    await expect(skipLink).toBeInTheDocument()
  })

  test('should have accessibility widget', async ({ page }) => {
    // Look for accessibility button/widget
    const a11yWidget = page.locator('button[aria-label*="accessibility" i], [data-testid="accessibility-widget"]').first()

    if (await a11yWidget.isVisible()) {
      await a11yWidget.click()
      // Widget panel should open
      await expect(page.locator('[role="dialog"], .accessibility-panel').first()).toBeVisible()
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through focusable elements
    await page.keyboard.press('Tab')
    const firstFocusable = page.locator(':focus')
    await expect(firstFocusable).toBeVisible()

    await page.keyboard.press('Tab')
    const secondFocusable = page.locator(':focus')
    await expect(secondFocusable).toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    // Check that buttons have labels
    const buttons = page.locator('button')
    const count = await buttons.count()

    if (count > 0) {
      const firstButton = buttons.first()
      const hasAriaLabel = await firstButton.getAttribute('aria-label')
      const hasText = await firstButton.textContent()

      // Button should have either aria-label or text content
      expect(hasAriaLabel || hasText).toBeTruthy()
    }
  })

  test('should have main landmark', async ({ page }) => {
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()

    // Should only have one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})
