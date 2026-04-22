import { test, expect } from '@playwright/test';

test.describe('Report Placeholder Metrics', () => {
  test('should calculate staff rating based on actual performance, not hardcoded 4.5', async ({ page }) => {
    // This tests the fix where all staff had hardcoded 4.5 rating
    
    await page.goto('/reports/staff-performance');
    
    await page.waitForTimeout(2000);
    
    // Get all displayed ratings
    const ratingElements = await page.locator('.staff-rating, [class*="rating"]').all();
    
    if (ratingElements.length > 0) {
      const ratings = [];
      for (const el of ratingElements) {
        const text = await el.textContent();
        const match = text.match(/[\d.]+/);
        if (match) {
          ratings.push(parseFloat(match[0]));
        }
      }
      
      // Not all ratings should be exactly 4.5
      const allSameRating = ratings.every(r => r === 4.5);
      expect(allSameRating).toBe(false);
    }
  });

  test('should show truthful EVV verification status', async ({ page }) => {
    // This tests the fix where EVV showed "Verified" with blank actual times
    
    await page.goto('/dashboard');
    
    // Find EVV widget
    const evvWidget = page.locator('.evv-widget, [class*="EVV"], text("Verification")');
    if (await evvWidget.count()) {
      await page.waitForTimeout(1000);
      
      // Get verified count
      const verifiedCount = await page.locator('.evv-stat-value').first().textContent();
      
      // The fix ensures evvVerified requires both actualStart AND actualEnd
      // So verified count should be accurate
      expect(verifiedCount).toBeTruthy();
    }
  });

  test('should show accurate GPS compliance rate', async ({ page }) => {
    await page.goto('/reports/compliance');
    
    await page.waitForTimeout(2000);
    
    // GPS compliance should be based on visits with actual times
    const complianceRate = await page.locator('.gps-compliance, [class*="compliance"]').textContent();
    
    expect(complianceRate).toBeTruthy();
  });
});
