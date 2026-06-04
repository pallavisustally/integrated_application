import { test, expect } from '@playwright/test'

test.describe('fn public routes', () => {
  test('home shows assessment type booking step', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Book Your Scope/i).first()).toBeVisible()
    await expect(page.getByText(/Scope 1/i).first()).toBeVisible()
    await expect(page.getByText(/Scope 2/i).first()).toBeVisible()
  })

  test('scope1 calculator shell loads', async ({ page }) => {
    await page.goto('/scope1')
    await expect(page.locator('.scope1-calculator-root, .calculator-root, main')).toBeVisible({
      timeout: 20_000,
    })
  })

  test('assessment start without params shows error', async ({ page }) => {
    await page.goto('/assessment/start')
    await expect(page.getByText(/Unable to start|Invalid assessment/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('dashboard restricted without email', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/Access Restricted|Restricted/i)).toBeVisible({
      timeout: 15_000,
    })
  })
})
