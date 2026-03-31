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
 * The login page uses quick-login buttons that fill React state, NOT direct form filling.
 * @param page Playwright page
 * @param userKey User key from TEST_USERS
 * @param options Optional settings
 * @param options.allowFailure If true, don't fail if redirect to dashboard doesn't happen
 */
export async function loginTestUser(
  page: Page,
  userKey: keyof typeof TEST_USERS = 'test',
  options?: { allowFailure?: boolean }
): Promise<void> {
  const user = TEST_USERS[userKey];

  // Navigate to login page FIRST before any localStorage access
  // to avoid "Access is denied for this document" on about:blank
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Now safe to clear localStorage and cookies (page is on /login)
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.context().clearCookies();

  // Use quick-login buttons (fill React state, then we click submit)
  // The quick-login section has buttons: "Test User", "Sarah Chen", "Mike Johnson", "Emma Wilson"
  const userLabelMap: Record<string, string> = {
    test: 'Test User',
    sarah: 'Sarah Chen',
    mike: 'Mike Johnson',
    emma: 'Emma Wilson',
  };

  const label = userLabelMap[userKey] || user.name;
  const quickLoginBtn = page.locator(`button:has-text("${label}")`).first();

  if (await quickLoginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await quickLoginBtn.click();
    await page.waitForTimeout(300); // let React update state
  } else {
    // Fallback: fill email/password directly
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
  }

  // Submit the form and wait for redirect
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  if (options?.allowFailure) {
    await page.waitForTimeout(1000);
    return;
  }

  // Wait for DOM to settle (app has continuous polling, so domcontentloaded not networkidle)
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Click user menu button (the rounded-full button with avatar in header)
  const userMenu = page.locator('header button.rounded-full, nav button.rounded-full').first();
  
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
 * Clears all session state - both NextAuth httpOnly cookies AND localStorage.
 * Use this to simulate logout/session expiry in tests.
 */
export async function clearSession(page: Page): Promise<void> {
  // Clear httpOnly session cookies first
  await page.context().clearCookies();
  // Then clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Navigates to a specific trip's page and waits for content to fully load.
 * @param page Playwright page
 * @param tripId Trip ID to navigate to (e.g., 'trip-1')
 * @param subpage Subpage to navigate to (default: 'overview')
 * @param headingText The h2 heading text to wait for in the main content area (e.g., 'Timeline', 'Payments & Expenses')
 */
export async function navigateToTrip(page: Page, tripId: string, subpage = 'overview', headingText?: string): Promise<void> {
  await page.goto(`/trip/${tripId}/${subpage}`);
  // Wait for URL to match the target subpage
  await page.waitForURL(`**/trip/${tripId}/${subpage}*`, { timeout: 10000 });
  // Wait for the page heading to appear in the main content area (not just nav tabs)
  if (headingText) {
    // Use exact match for h2 to avoid substring matching (e.g. "Timeline" matching "Payments")
    await page.waitForSelector(`h2:text-is("${headingText}"), h1:text-is("${headingText}")`, { state: 'visible', timeout: 10000 });
  } else {
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Ensures a trip has default milestones generated.
 * Calls the backend API directly (bypasses UI) to generate milestones.
 * Idempotent — safe to call even if milestones already exist.
 */
export async function ensureMilestones(page: Page, tripId: string): Promise<void> {
  // Call the API directly to generate milestones — avoids UI timing issues
  const response = await page.evaluate(async (tid: string) => {
    // Get auth headers using the same approach as api.ts
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();
    const token = session?.accessToken || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    const result = await fetch(`/api/trips/${tid}/milestones/generate-default`, {
      method: 'POST',
      headers,
    });
    return result.ok;
  }, tripId);
  // If API call failed (no auth), fall back to UI approach
  if (!response) {
    await navigateToTrip(page, tripId, 'timeline');
    await page.waitForLoadState('domcontentloaded');
    const generateBtn = page.locator('button').filter({ hasText: /Generate Default Milestones/i }).first();
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForURL(`**/trip/${tripId}/timeline*`, { timeout: 10000 });
    }
  }
}

/**
 * Waits for a specific element to be visible with retry
 */
export async function waitForElementVisible(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}
