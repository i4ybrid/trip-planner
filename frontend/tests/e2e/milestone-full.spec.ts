/**
 * ALL TESTS MOVED to trip-workflow-serial.spec.ts
 * 
 * Milestone full tests depend on trip status being set and must run in serial.
 * See: trip-workflow-serial.spec.ts — 'Milestones — Serial Chain (after status set)'
 * 
 * This file is kept as a stub to avoid breaking imports.
 */

import { test } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

test.describe('Milestone Full (MOVED)', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('milestone-full tests moved to trip-workflow-serial.spec.ts', async ({ page }) => {
    // All milestone-full tests have been moved to trip-workflow-serial.spec.ts
    // to run in serial after trip status is set.
    test.skip();
  });
});
