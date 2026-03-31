import { defineConfig, devices } from '@playwright/test';


/**
 * Playwright configuration for TripPlanner E2E tests
 * 
 * Prerequisites:
 * 1. Backend running on http://localhost:4000
 * 2. Frontend running on http://localhost:3000
 * 3. Database seeded with test data (see backend/prisma/seed.ts)
 * 
 * Test users (all have password: password123):
 * - test@example.com (user-1, Trip Master of Hawaii trip)
 * - sarah@example.com (user-2)
 * - mike@example.com (user-3)
 * - emma@example.com (user-4)
 * 
 * Key trip IDs from seed:
 * - trip-1: Hawaii Beach Vacation (user-1 is MASTER, has bill splits and messages)
 * - trip-2: NYC Birthday Weekend (user-2 is MASTER)
 * - trip-5: Nashville Trip (user-2 is MASTER, HAPPENING status)
 */

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup',
  timeout: 60 * 1000,
  expect: {
    timeout: 30 * 1000,  // 30s for first assertion on a page (e.g. page.goto + first expect)
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
