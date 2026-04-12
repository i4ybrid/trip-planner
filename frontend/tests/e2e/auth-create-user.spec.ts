import { test, expect } from '@playwright/test';

test.describe('Auth - Create User', () => {
  test.beforeEach(async ({ page }) => {
    // Signup is on the login page - toggle to register mode
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // Click "Sign up" link to toggle to registration form
    const signUpLink = page.locator('button:has-text("Sign up")').first();
    if (!(await signUpLink.isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.locator('button:has-text("Don\'t have an account")').first().click();
    } else {
      await signUpLink.click();
    }
    await page.waitForLoadState('domcontentloaded');
  });

  test('should register a new user via signup form', async ({ page }) => {
    const timestamp = Date.now();
    const email = `newuser${timestamp}@example.com`;
    const password = 'SecurePass123!';
    const name = 'New User';

    // Fill signup form (login page in register mode)
    // The register form has: name input (id="name"), email input (id="email"), password input (id="password")
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Dashboard should be visible
    await expect(page.locator('text=/dashboard/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when email already exists', async ({ page }) => {
    // Try to register with an existing user's email
    await page.fill('#name', 'Duplicate User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'SecurePass123!');

    await page.click('button[type="submit"]');

    // Should show an error message
    await page.waitForSelector('text=/email|already exists|registered/i', { state: 'visible', timeout: 5000 });
  });
});
