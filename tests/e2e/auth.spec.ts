/**
 * E2E Tests for Authentication Flow
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText(/sign in|login/i)
  })

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('h1')).toContainText(/sign up|create account/i)
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL(/.*signup/)

    await page.click('text=Sign in')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible()
  })

  test('should require password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=/password.*required/i')).toBeVisible()
  })
})
