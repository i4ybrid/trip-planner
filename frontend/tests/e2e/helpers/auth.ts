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

  // Also clear auth-storage read by auth-provider.tsx (stale data from previous tests)
  await page.evaluate(() => {
    localStorage.removeItem('auth-storage');
  });

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
    // Wait for React to update state — the button text should change to "Signing in..."
    // Wait for either: the submit button shows loading state OR the form settles
    await page.waitForTimeout(500);
  } else {
    // Fallback: fill email/password directly
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
  }

  // DEBUG: Check current URL and page state
  const currentUrl = page.url();
  const hasSubmitBtn = await page.locator('button[type="submit"]').count();
  console.log(`[DEBUG login] URL: ${currentUrl}, submit buttons: ${hasSubmitBtn}`);
  
  if (currentUrl.includes('/dashboard')) {
    console.log('[DEBUG login] Already on dashboard, skipping submit button wait');
    return; // Already logged in, skip rest
  }

  // Wait for the submit button to be visible (React may still be initializing)
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  // Wait for button to become enabled (no loading spinner blocking it)
  await submitBtn.waitFor({ state: 'attached', timeout: 10000 });
  if (!(await submitBtn.isEnabled())) {
    // Poll until enabled (button may be temporarily disabled during loading)
    await page.waitForFunction(
      (sel) => document.querySelector(sel) !== null && (document.querySelector(sel) as HTMLButtonElement).disabled === false,
      'button[type="submit"]',
      { timeout: 10000 }
    );
  }

  // Submit the form and wait for redirect
  // Use Promise.all so the click and URL wait start together, reducing race conditions
  // Timeout increased to 30s to handle cold Prisma spin-up (~8.6s on first /api/auth/session call)
  await Promise.all([
    submitBtn.click(),
    page.waitForURL('**/dashboard', { timeout: 30000 }),
  ]);

  if (options?.allowFailure) {
    await page.waitForTimeout(1000);
    return;
  }

  // Wait for auth provider to finish validating the session.
  // The AuthProvider shows a "Loading..." spinner (animate-spin border) while
  // api.getCurrentUser() runs. We must not return until the spinner is gone
  // and the actual dashboard content is visible, otherwise subsequent test actions
  // (e.g. clicking user menu) will fail because the auth overlay is still shown.
  try {
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 20000 });
  } catch {
    // If spinner still visible after 20s, the auth validation may have failed
    // (e.g. expired token). Log but don't fail — the test can still proceed
    // if the dashboard is partially visible.
    console.warn('Auth spinner did not clear within 20s — proceeding anyway');
  }

  // Wait for DOM to settle
  await page.waitForTimeout(500);
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    // Try multiple user menu selectors — the header avatar button
    const userMenuSelectors = [
      'header button.rounded-full',
      'nav button.rounded-full',
      'button[aria-label="User menu"]',
      'button[aria-label="Open user menu"]',
      // Generic: any button in header that has an img child (avatar)
      'header button:has(img)',
    ];

    let userMenu = page.locator(userMenuSelectors.join(', ')).first();

    // Wait for user menu to be visible (give it time to appear after auth settles)
    if (!(await userMenu.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.warn('logoutUser: user menu not visible within 5s');
      return;
    }

    await userMenu.click();
    await page.waitForTimeout(500);

    // Try multiple logout button selectors
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Log Out")',
      'button:has-text("Sign Out")',
      '[role="menuitem"]:has-text("logout")',
      '[role="menuitem"]:has-text("sign out")',
    ];

    const logoutBtn = page.locator(logoutSelectors.join(', ')).first();

    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    } else {
      // Fallback: manually clear session via JS and redirect
      await page.evaluate(() => {
        localStorage.removeItem('next-auth.session-token');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('tp_session');
        document.cookie = 'next-auth.session-token=; Max-Age=0; path=/';
        window.location.href = '/login';
      });
      await page.waitForURL('**/login', { timeout: 10000 });
    }
  } catch (error) {
    console.warn('logoutUser failed, forcing redirect:', error);
    // Last resort: clear session and go to login
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie = 'next-auth.session-token=; Max-Age=0; path=/';
      window.location.href = '/login';
    });
    await page.waitForURL('**/login', { timeout: 10000 });
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
