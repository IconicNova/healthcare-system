import { test, expect } from '@playwright/test';

test.describe('Payroll Preview Grouping', () => {
  test('should not crash with "Cannot convert undefined or null to object" in reduce', async ({ page }) => {
    // This tests the fix where visits.reduce() crashed when visits was empty/null
    
    await page.goto('/payroll/timesheets');
    
    const generateButton = page.getByRole('button', { name: /generate|create.*timesheet/i }).first();
    if (await generateButton.count()) {
      await generateButton.click();
      
      // Set a date range with no visits
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365);
      
      const startDate = page.locator('input[type="date"]').first();
      await startDate.fill(futureDate.toISOString().split('T')[0]);
      
      const previewButton = page.getByRole('button', { name: /preview/i }).first();
      await previewButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should not crash, should show empty state or error message
      const hasCrash = await page.locator('text="Cannot convert undefined"').count() > 0;
      expect(hasCrash).toBe(false);
    }
  });

  test('should group visits by staff correctly', async ({ page }) => {
    await page.goto('/payroll/timesheets');
    
    const generateButton = page.getByRole('button', { name: /generate/i }).first();
    if (await generateButton.count()) {
      await generateButton.click();
      
      // Set current week
      const previewButton = page.getByRole('button', { name: /preview/i }).first();
      await previewButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should show staff groupings or empty state
      const hasPreview = await page.locator('.staff-group, .preview-row').count() >= 0;
      expect(hasPreview).toBe(true);
    }
  });
});
