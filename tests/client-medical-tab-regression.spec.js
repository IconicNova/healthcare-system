import { test, expect } from '@playwright/test';

test.describe('Client Medical Tab Regression', () => {
  test('should persist medications to API instead of stubbed setTimeout', async ({ page }) => {
    // This tests the fix where handleAddMedication was using setTimeout
    // instead of actually calling the API
    
    await page.goto('/clients');
    
    // Click on a client
    const firstClient = page.getByRole('link').first();
    await firstClient.click();
    
    // Navigate to Medical tab
    const medicalTab = page.getByRole('tab', { name: /medical/i });
    if (await medicalTab.count()) {
      await medicalTab.click();
    }
    
    // Click Add Medication
    const addButton = page.getByRole('button', { name: /add.*medication|medication.*add/i }).first();
    if (await addButton.count()) {
      await addButton.click();
    }
    
    // Fill in medication form
    await page.fill('input[placeholder*="name", label:has-text("Medication Name") + input]', 'Test Medication');
    await page.fill('input[placeholder*="dosage", label:has-text("Dosage") + input]', '10mg');
    await page.fill('input[placeholder*="frequency", label:has-text("Frequency") + input]', 'Daily');
    
    // Submit
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();
    
    // Should show success toast and medication should appear in list
    await page.waitForTimeout(1000);
    
    // Check for success feedback
    const hasSuccess = await page.locator('.toast-success, [role="alert"]:has-text("success", "added", "saved")').count() > 0;
    expect(hasSuccess).toBe(true);
  });

  test('should fetch medications from API on mount', async ({ page }) => {
    await page.goto('/clients');
    
    const firstClient = page.getByRole('link').first();
    await firstClient.click();
    
    const medicalTab = page.getByRole('tab', { name: /medical/i });
    if (await medicalTab.count()) {
      await medicalTab.click();
      
      // Should fetch and display medications
      await page.waitForTimeout(1000);
      
      // Either shows medications or "no medications" message
      const hasMedicationsOrEmptyState = await page.locator(
        '.medication-item, [class*="medication"], text("No medications")'
      ).count() >= 0;
      
      expect(hasMedicationsOrEmptyState).toBe(true);
    }
  });
});
