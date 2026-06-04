import { defineConfig, devices } from '@playwright/test'

/**
 * Unified E2E: fn (:3000) + sustally API (:3001).
 * Requires MongoDB for booking tests (skipped when E2E_SKIP_DB=1).
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  use: {
    baseURL: process.env.FN_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  /* Set PW_NO_WEBSERVER=1 when fn (:3000) and sustally (:3001) are already running */
  webServer: process.env.PW_NO_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run dev --prefix sustally',
          url: 'http://127.0.0.1:3001/api/v1/factors?sector=cement',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: 'npm run dev --prefix fn',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
})
