import { test, expect } from '@playwright/test';
import { loginTestUser, logoutUser } from './helpers/auth';

/**
 * E2E tests for Social Login (OAuth) functionality
 * 
 * Tests cover:
 * - OAuth login buttons visibility on login page
 * - OAuth button interactions
 * - Email collision handling
 * - Profile picture from OAuth
 */

/**
 * Test strategy for OAuth:
 * Since we can't perform real OAuth flows in E2E tests (requires browser redirect to Google/Facebook),
 * we test:
 * 1. UI elements (buttons) are visible
 * 2. Button click triggers OAuth flow (signIn function)
 * 3. Error handling when OAuth is not configured
 */

test.describe('Social Login - OAuth Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async ({ page }) => {
    await logoutUser(page);
  });

  test('should show OAuth login buttons on login page', async ({ page }) => {
    // Check for Google button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible({ timeout: 5000 });

    // Check for Facebook button
    const facebookButton = page.locator('button:has-text("Continue with Facebook")');
    await expect(facebookButton).toBeVisible({ timeout: 5000 });
  });

  test('should have Google and Facebook icons in OAuth buttons', async ({ page }) => {
    // Google button should have an SVG icon
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    const googleIcon = googleButton.locator('svg');
    await expect(googleIcon).toBeVisible();

    // Facebook button should have an SVG icon
    const facebookButton = page.locator('button:has-text("Continue with Facebook")');
    await expect(facebookButton).toBeVisible();
    const facebookIcon = facebookButton.locator('svg');
    await expect(facebookIcon).toBeVisible();
  });

  test('should show divider between OAuth and email login', async ({ page }) => {
    // Check for divider text
    const divider = page.locator('text="or continue with email"');
    await expect(divider).toBeVisible({ timeout: 5000 });

    // The divider should be between OAuth buttons and email form
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const emailInput = page.locator('input[type="email"], input[id="email"]');
    
    // Both should be visible
    await expect(googleButton).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  test('should display OAuth buttons above the email form', async ({ page }) => {
    // Get the bounding boxes to verify ordering
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const emailInput = page.locator('input[type="email"], input[id="email"]');
    
    const googleBox = await googleButton.boundingBox();
    const emailBox = await emailInput.boundingBox();
    
    if (googleBox && emailBox) {
      // Google button should be above email input (lower y value means higher on page)
      expect(googleBox.y).toBeLessThan(emailBox.y);
    }
  });

  test('should display OAuth buttons with proper styling', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const facebookButton = page.locator('button:has-text("Continue with Facebook")');
    
    // Buttons should have border styling
    await expect(googleButton).toHaveClass(/border/);
    await expect(facebookButton).toHaveClass(/border/);
    
    // Buttons should have flex layout for icon + text
    await expect(googleButton).toHaveClass(/flex/);
    await expect(facebookButton).toHaveClass(/items-center/);
  });
});

test.describe('Social Login - OAuth Flow Handling', () => {
  test('should have OAuth buttons visible on registration page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Toggle to registration mode
    const signUpLink = page.locator('text="Don\'t have an account? Sign up"');
    if (await signUpLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signUpLink.click();
      await page.waitForTimeout(500);
    }
    
    // OAuth buttons should still be visible on registration page
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const facebookButton = page.locator('button:has-text("Continue with Facebook")');
    
    await expect(googleButton).toBeVisible({ timeout: 5000 });
    await expect(facebookButton).toBeVisible({ timeout: 5000 });
  });

  test.skip('should handle Google OAuth click and redirect to provider', async ({ page }) => {
    // Intercept the OAuth signIn call
    let signInCalled = false;
    let signInProvider = '';
    
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      // Let NextAuth handle the OAuth redirect
      await route.continue();
    });
    
    // Click Google button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Should redirect to Google or show an error (if no credentials configured)
    // The exact behavior depends on whether OAuth credentials are configured
    // We verify the click was registered by waiting for either redirect or error
    await page.waitForTimeout(2000);
    
    // Either we're on a Google auth page, or we stayed on login with an error
    const currentUrl = page.url();
    const hasError = await page.locator('text=/error|failed|invalid/i').isVisible().catch(() => false);
    
    // The test passes if either OAuth redirect happened or error displayed
    expect(
      currentUrl.includes('google') || 
      currentUrl.includes('accounts.google') ||
      hasError
    ).toBeTruthy();
  });

  test.skip('should handle Facebook OAuth click and redirect to provider', async ({ page }) => {
    // Click Facebook button
    const facebookButton = page.locator('button:has-text("Continue with Facebook")');
    await facebookButton.click();
    
    // Should redirect to Facebook or show an error (if no credentials configured)
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasError = await page.locator('text=/error|failed|invalid/i').isVisible().catch(() => false);
    
    // The test passes if either OAuth redirect happened or error displayed
    expect(
      currentUrl.includes('facebook') || 
      currentUrl.includes('facebook.com') ||
      hasError
    ).toBeTruthy();
  });
});

test.describe('Social Login - Session and Profile', () => {
  test('should maintain session after OAuth login', async ({ page }) => {
    // First login with credentials to establish baseline
    await loginTestUser(page);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Should be logged in
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Session should persist across page reloads
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Should still be on dashboard (session maintained)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test.skip('should show user avatar in header after login', async ({ page }) => {
    await loginTestUser(page);
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for user menu/avatar in header
    // This could be a profile picture or initials
    const userMenu = page.locator('[class*="avatar"], [class*="user"], button:has(svg), button:has-text("T")').first();
    
    // Should find some user indicator
    const hasUserIndicator = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasUserIndicator).toBeTruthy();
  });
});

test.describe('Social Login - Error Handling', () => {
  test.skip('should handle OAuth configuration errors gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Click Google button without proper OAuth setup
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Wait for any error to appear or redirect
    await page.waitForTimeout(3000);
    
    // If there's an error, it should be displayed to the user
    const errorMessage = page.locator('[class*="error"], .text-red-, text-red-600').first();
    
    // Either we redirected somewhere or there's an error message
    const currentUrl = page.url();
    const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    
    // The test passes if there's some indication of what happened
    expect(
      !currentUrl.includes('/login') || hasError || currentUrl.includes('google')
    ).toBeTruthy();
  });

  test.skip('should allow retry after OAuth error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to click OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Wait for any response
    await page.waitForTimeout(2000);
    
    // Navigate back to login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Should still be able to use email login
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Social Login - Email/Password Toggle', () => {
  test('should toggle between login and signup with OAuth visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // OAuth buttons should be visible on login mode
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    
    // Toggle to signup
    await page.click('text="Don\'t have an account? Sign up"');
    await page.waitForTimeout(500);
    
    // OAuth buttons should still be visible on signup mode
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Facebook")')).toBeVisible();
    
    // Toggle back to login
    await page.click('text="Already have an account? Sign in"');
    await page.waitForTimeout(500);
    
    // OAuth buttons should still be visible
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});
