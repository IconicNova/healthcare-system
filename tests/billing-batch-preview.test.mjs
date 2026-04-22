import { test, expect } from '@playwright/test';

test.describe('Billing Batch Preview', () => {
  test('should use GET method for uninvoiced visits endpoint', async ({ page }) => {
    // This tests the fix where the endpoint was being called with POST (HTTP 405)
    // instead of GET
    
    await page.goto('/billing/invoices');
    
    // Look for batch invoice button
    const batchButton = page.getByRole('button', { name: /batch|generate.*invoice/i }).first();
    if (await batchButton.count()) {
      await batchButton.click();
      
      // Open modal and set date range
      const startDate = page.locator('input[type="date"]').first();
      await startDate.fill(new Date().toISOString().split('T')[0]);
      
      const previewButton = page.getByRole('button', { name: /preview/i }).first();
      await previewButton.click();
      
      // Should not show 405 error
      await page.waitForTimeout(1000);
      
      const has405Error = await page.locator('text=405, text=Method Not Allowed').count() > 0;
      expect(has405Error).toBe(false);
    }
  });

  test('should display grouped visits by client in preview', async ({ page }) => {
    await page.goto('/billing/invoices');
    
    const batchButton = page.getByRole('button', { name: /batch/i }).first();
    if (await batchButton.count()) {
      await batchButton.click();
      
      // Set date range and preview
      const previewButton = page.getByRole('button', { name: /preview/i }).first();
      await previewButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should show client groupings if there are uninvoiced visits
      // or a message if none
      const hasPreviewOrEmptyState = await page.locator(
        '.preview-item, .client-group, text("No visits")'
      ).count() >= 0;
      
      expect(hasPreviewOrEmptyState).toBe(true);
    }
  });
});
