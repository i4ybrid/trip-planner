import { Page } from '@playwright/test';

/**
 * Test user credentials - matches seed data in backend/prisma/seed.ts
 */
export const TEST_USERS = {
  test: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    id: 'user-1',
  },
  sarah: {
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Chen',
    id: 'user-2',
  },
  mike: {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Johnson',
    id: 'user-3',
  },
  emma: {
    email: 'emma@example.com',
    password: 'password123',
    name: 'Emma Wilson',
    id: 'user-4',
  },
} as const;

/**
 * Seeded trip IDs from backend/prisma/seed.ts
 */
export const TRIP_IDS = {
  hawaii: 'trip-1',
  nyc: 'trip-2',
  europe: 'trip-3',
  ski: 'trip-4',
  nashville: 'trip-5',
} as const;

/**
 * Seeded bill split IDs from seed data
 */
export const BILL_SPLIT_IDS = {
  hotelBill: 'bill-1',
  luauDinner: 'bill-2',
} as const;

/**
 * Logs in a test user using the login page UI flow
 */
export async function loginTestUser(page: Page, userKey: keyof typeof TEST_USERS = 'test'): Promise<void> {
  const user = TEST_USERS[userKey];
  
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Verify we're logged in
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Click user menu button (the avatar/name button in header)
  const userMenu = page.locator('button.rounded-full, button[class*="user"], button[class*="avatar"]').first();
  
  if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(300);
    
    // Click logout button in dropdown
    const logoutBtn = page.locator('text=/logout|sign out/i').first();
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    }
  }
}

/**
 * Navigates to a specific trip's page
 */
export async function navigateToTrip(page: Page, tripId: string, subpage = 'overview'): Promise<void> {
  await page.goto(`/trip/${tripId}/${subpage}`);
  // Wait for page content to load
  await page.waitForLoadState('networkidle');
}

/**
 * Waits for a specific element to be visible with retry
 */
export async function waitForElementVisible(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}
