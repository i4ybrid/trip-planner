import { test, expect, type Page } from '@playwright/test';

test.describe('TripPlanner E2E Tests', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const apiURL = process.env.E2E_API_URL || 'http://localhost:4000';

  test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await expect(page).toHaveTitle(/TripPlanner/);
      await expect(page.locator('text=Sign in')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
    });

    test('should redirect to login if not authenticated', async ({ page }) => {
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should display empty state for new users', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
      await expect(page.locator('text=No trips yet')).toBeVisible();
    });
  });

  test.describe('Trip Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
    });

    test('should open new trip modal', async ({ page }) => {
      await page.click('button:has-text("New Trip")');
      await expect(page.locator('text=Create New Trip')).toBeVisible();
    });

    test('should create a new trip', async ({ page }) => {
      await page.click('button:has-text("New Trip")');
      await page.fill('input[name="name"]', 'Beach Vacation');
      await page.fill('input[name="destination"]', 'Hawaii');
      await page.fill('input[name="startDate"]', '2026-07-01');
      await page.fill('input[name="endDate"]', '2026-07-07');
      await page.click('button:has-text("Create Trip")');
      
      await expect(page.locator('text=Beach Vacation')).toBeVisible();
    });

    test('should show validation error for empty name', async ({ page }) => {
      await page.click('button:has-text("New Trip")');
      await page.fill('input[name="name"]', '');
      await page.click('button:has-text("Create Trip")');
      await expect(page.locator('text=Trip name is required')).toBeVisible();
    });
  });

  test.describe('Trip Detail', () => {
    test('should navigate to trip detail page', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id`);
      await expect(page.locator('text=Overview')).toBeVisible();
    });

    test('should display trip tabs', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id`);
      await expect(page.locator('text=Activities')).toBeVisible();
      await expect(page.locator('text=Chat')).toBeVisible();
      await expect(page.locator('text=Payments')).toBeVisible();
      await expect(page.locator('text=Memories')).toBeVisible();
    });
  });

  test.describe('Activity Voting', () => {
    test('should display activities list', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/activities`);
      await expect(page.locator('text=Propose Activity')).toBeVisible();
    });

    test('should open propose activity form', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/activities`);
      await page.click('button:has-text("Propose Activity")');
      await expect(page.locator('text=New Activity')).toBeVisible();
    });

    test('should vote on activity', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/activities`);
      await page.click('button:has-text("Yes")');
      await expect(page.locator('text=1 vote')).toBeVisible();
    });
  });

  test.describe('Chat', () => {
    test('should display chat interface', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/chat`);
      await expect(page.locator('text=Type a message')).toBeVisible();
    });

    test('should send a message', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/chat`);
      await page.fill('input[placeholder="Type a message..."]', 'Hello team!');
      await page.click('button:has-text("Send")');
      await expect(page.locator('text=Hello team!')).toBeVisible();
    });

    test('should parse @mention', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/chat`);
      await page.fill('input[placeholder="Type a message..."]', 'Hey @everyone!');
      await page.click('button:has-text("Send")');
      await expect(page.locator('text=Hey @everyone!')).toBeVisible();
    });
  });

  test.describe('Payments', () => {
    test('should display payment overview', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/payments`);
      await expect(page.locator('text=Expenses')).toBeVisible();
      await expect(page.locator('text=Settle Up')).toBeVisible();
    });

    test('should add expense', async ({ page }) => {
      await page.goto(`${baseURL}/trip/test-trip-id/payments`);
      await page.click('button:has-text("Add Expense")');
      await page.fill('input[name="description"]', 'Dinner');
      await page.fill('input[name="amount"]', '100');
      await page.click('button:has-text("Add")');
      await expect(page.locator('text=Dinner')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should show mobile sidebar collapsed', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseURL}/dashboard`);
      await expect(page.locator('nav')).toHaveClass(/collapsed/);
    });

    test('should expand sidebar on hover (mobile)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseURL}/dashboard`);
      await page.hover('nav');
      await expect(page.locator('nav')).not.toHaveClass(/collapsed/);
    });
  });

  test.describe('Theme Switching', () => {
    test('should toggle between Bright and Vigilante themes', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
      
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      
      await page.click('button[aria-label="Toggle theme"]');
      
      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(newTheme).not.toBe(initialTheme);
    });
  });
});

test.describe('Invite Flow', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test('should display invite page', async ({ page }) => {
    await page.goto(`${baseURL}/invite/test-token`);
    await expect(page.locator('text=You\'ve been invited')).toBeVisible();
  });

  test('should accept invite and redirect to trip', async ({ page }) => {
    await page.goto(`${baseURL}/invite/test-token`);
    await page.click('button:has-text("Accept Invite")');
    await expect(page).toHaveURL(/.*\/trip\/.+/);
  });
});
