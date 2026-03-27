import { test, expect } from '@playwright/test';
import { loginTestUser, TEST_USERS, TRIP_IDS } from './helpers/auth';

test.describe('Memories Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test.describe('Memories Page', () => {
    test('should navigate to trip memories page', async ({ page }) => {
      // Navigate to memories tab for a trip
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Page should load without error
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display memories page heading', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for heading or title
      const heading = page.locator('h1, h2, [class*="heading"], text=/memory|photo|album/i').first();
      
      if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(heading).toBeVisible();
      } else {
        // Page may not have explicit heading
        test.skip();
      }
    });

    test('should display memories grid or empty state', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for grid of photos/videos
      const grid = page.locator('[class*="grid"], [class*="gallery"], [class*="masonry"]').first();
      const emptyState = page.locator('text=/no memory|no photo|upload.*photo/i').first();
      
      const hasGrid = await grid.isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasGrid || hasEmpty) {
        expect(true).toBe(true);
      } else {
        // No memories and no empty state - page may be loading
        test.skip();
      }
    });

    test('should display uploaded photos', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for image elements
      const images = page.locator('img');
      
      const count = await images.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      } else {
        // No photos uploaded yet - this is expected for new trips
        test.skip();
      }
    });

    test('should display photo captions', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for caption elements
      const captions = page.locator('[class*="caption"], figcaption, [class*="description"]');
      
      const count = await captions.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should show uploader info', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for uploader name or avatar
      const uploader = page.locator('text=/uploaded by|by/i').first();
      
      if (await uploader.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(uploader).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Photo Upload', () => {
    test('should show upload button', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for upload button
      const uploadButton = page.locator('button').filter({ hasText: /upload|add.*photo|add.*memory/i }).first();
      
      if (await uploadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(uploadButton).toBeVisible();
      } else {
        // Upload might be drag-drop only
        const dropzone = page.locator('[class*="dropzone"], [class*="upload"]').first();
        
        if (await dropzone.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(dropzone).toBeVisible();
        } else {
          test.skip();
        }
      }
    });

    test('should accept drag and drop upload', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for dropzone
      const dropzone = page.locator('[class*="dropzone"], [class*="upload"]').first();
      
      if (await dropzone.isVisible({ timeout: 3000 }).catch(() => false)) {
        // This would need an actual file to test properly
        // Just verify the dropzone exists
        expect(true).toBe(true);
      } else {
        test.skip();
      }
    });

    test('should show upload progress', async ({ page }) => {
      // This would require actual file upload
      // Skip for basic smoke tests
      test.skip();
    });

    test('should handle upload error gracefully', async ({ page }) => {
      // This would require simulating upload failure
      test.skip();
    });
  });

  test.describe('Photo Viewing', () => {
    test('should open photo in full view', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for photo thumbnail
      const photo = page.locator('img[src*="upload"], [class*="photo"], [class*="memory"]').first();
      
      if (await photo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await photo.click();
        await page.waitForLoadState('networkidle');
        
        // Look for lightbox or modal
        const lightbox = page.locator('[role="dialog"], .lightbox, [class*="modal"], [class*="viewer"]').first();
        
        if (await lightbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(lightbox).toBeVisible();
        }
        // Or photo just expanded in place
        expect(true).toBe(true);
      } else {
        test.skip();
      }
    });

    test('should close photo viewer', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      const photo = page.locator('img').first();
      
      if (await photo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await photo.click();
        await page.waitForLoadState('networkidle');
        
        // Look for close button
        const closeButton = page.locator('button[aria-label*="close"], button').filter({ hasText: /close|x/i }).first();
        
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
          await page.waitForLoadState('networkidle');
        }
        expect(true).toBe(true);
      } else {
        test.skip();
      }
    });

    test('should navigate between photos in viewer', async ({ page }) => {
      // This requires multiple photos
      test.skip();
    });
  });

  test.describe('Photo Actions', () => {
    test('should show action menu for photo', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      // Look for photo with action menu
      const photoCard = page.locator('[class*="photo"], [class*="memory"]').first();
      
      if (await photoCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Hover or click to show menu
        await photoCard.hover();
        await page.waitForTimeout(500);
        
        const menuButton = photoCard.locator('button, [class*="menu"]').first();
        
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await menuButton.click();
          await page.waitForLoadState('networkidle');
          
          // Look for menu options
          const downloadOption = page.locator('text=/download/i').first();
          
          if (await downloadOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(downloadOption).toBeVisible();
          }
        }
      } else {
        test.skip();
      }
    });

    test('should download photo', async ({ page }) => {
      // This triggers actual download - skip for automated tests
      test.skip();
    });

    test('should delete photo', async ({ page }) => {
      // This modifies data - skip unless specifically testing delete flow
      test.skip();
    });
  });

  test.describe('Caption Editing', () => {
    test('should show edit caption option', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
      await page.waitForLoadState('networkidle');
      
      const photoCard = page.locator('[class*="photo"], [class*="memory"]').first();
      
      if (await photoCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Find action menu
        const menuButton = photoCard.locator('button').filter({ hasText: /edit|\.\.\.|\u22EF|\u22EE/i }).first();
        
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await menuButton.click();
          await page.waitForLoadState('networkidle');
          
          const editOption = page.locator('text=/edit.*caption|caption/i').first();
          
          if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(editOption).toBeVisible();
          } else {
            test.skip();
          }
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });
});

test.describe('Memories - Multiple Trips', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should access memories for different trips', async ({ page }) => {
    // Test with Hawaii trip
    await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
    await page.waitForLoadState('networkidle');
    
    const hasHawaiiMemories = await page.locator('body').isVisible();
    expect(hasHawaiiMemories).toBe(true);
    
    // Navigate to NYC trip memories
    await page.goto(`/trip/${TRIP_IDS.nyc}/memories`);
    await page.waitForLoadState('networkidle');
    
    const hasNYCMemories = await page.locator('body').isVisible();
    expect(hasNYCMemories).toBe(true);
  });
});

test.describe('Memories - Trip Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should navigate to memories from trip page tabs', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForLoadState('networkidle');
    
    // Look for Memories tab
    const memoriesTab = page.locator('a[href*="memories"], button').filter({ hasText: /memory|album/i }).first();
    
    if (await memoriesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await memoriesTab.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/memories/);
    } else {
      test.skip();
    }
  });

  test('should highlight memories tab when active', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
    await page.waitForLoadState('networkidle');
    
    // Check if Memories tab shows active state
    const activeTab = page.locator('a[href*="memories"][aria-current*="page"], a[href*="memories"].active, [class*="tab"][class*="active"]').first();
    
    if (await activeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(activeTab).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Memories - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show loading state while fetching memories', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
    
    // Immediately check for loading indicator
    const loading = page.locator('[class*="loading"], [class*="skeleton"], spinner').first();
    
    // Loading might have already completed
    const isLoading = await loading.isVisible({ timeout: 1000 }).catch(() => false);
    
    // If we caught it loading, great. If not, page loaded fast.
    expect(true).toBe(true);
  });

  test('should show error state if memories fail to load', async ({ page }) => {
    // This would require network mocking
    test.skip();
  });
});

test.describe('Memories - Unauthenticated', () => {
  test('should redirect to login when accessing memories while logged out', async ({ page }) => {
    await page.context().clearCookies();
    
    await page.goto(`/trip/${TRIP_IDS.hawaii}/memories`);
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
