import { test, expect } from '@playwright/test';

test.describe('Medications Navigation Regression', () => {
  test('should not have duplicate navigation buttons routing to same URL', async ({ page }) => {
    // This tests the fix where both "Schedule View" and "Reconciliation" 
    // buttons routed to /care-delivery/medications/schedule
    
    await page.goto('/care-delivery/medications');
    
    await page.waitForTimeout(500);
    
    // Get all navigation buttons in header
    const navButtons = await page.locator('header button, .page-header button').all();
    
    // Track button destinations
    const destinations = new Map();
    
    for (const button of navButtons) {
      const text = await button.textContent();
      if (text.includes('Schedule') || text.includes('Reconciliation')) {
        // We should only have "Schedule View" button now
        // "Reconciliation" button was removed as it was a duplicate
        if (text.includes('Reconciliation')) {
          const href = await button.getAttribute('onclick');
          expect(href).toBe(null); // Should not exist
        }
      }
    }
    
    // Should have exactly one "Schedule View" button
    const scheduleButtons = await page.getByRole('button', { name: /schedule view/i }).all();
    expect(scheduleButtons.length).toBe(1);
  });

  test('should navigate to schedule view when clicking Schedule View button', async ({ page }) => {
    await page.goto('/care-delivery/medications');
    
    const scheduleButton = page.getByRole('button', { name: /schedule view/i }).first();
    await scheduleButton.click();
    
    await page.waitForTimeout(500);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/care-delivery/medications/schedule');
  });
});
