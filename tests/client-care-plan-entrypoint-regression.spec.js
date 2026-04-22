import { test, expect } from '@playwright/test';

test.describe('Client Care Plan Entrypoint Regression', () => {
  test('should create care plan via API instead of stubbed setTimeout', async ({ page }) => {
    // This tests the fix where handleCreateCarePlan was using setTimeout
    // instead of actually calling the API
    
    await page.goto('/clients');
    
    // Click on a client
    const firstClient = page.getByRole('link').first();
    await firstClient.click();
    
    // Navigate to Care Plans tab
    const carePlansTab = page.getByRole('tab', { name: /care plans/i });
    if (await carePlansTab.count()) {
      await carePlansTab.click();
    }
    
    // Click Create/Add Care Plan button
    const addButton = page.getByRole('button', { name: /create.*care plan|add.*care plan|care plan.*create|care plan.*add/i }).first();
    if (await addButton.count()) {
      await addButton.click();
    }
    
    // Fill in care plan form
    const nameInput = page.locator('input[placeholder*="name", label:has-text("Care Plan Name") + input]').first();
    await nameInput.fill('Test Care Plan');
    
    const startDateInput = page.locator('input[type="date"]').first();
    await startDateInput.fill(new Date().toISOString().split('T')[0]);
    
    // Submit
    const saveButton = page.getByRole('button', { name: /create|save/i }).first();
    await saveButton.click();
    
    // Should show success toast and care plan should appear in list
    await page.waitForTimeout(1500);
    
    // Check for success feedback
    const hasSuccess = await page.locator('.toast-success, [role="alert"]:has-text("success", "created", "saved")').count() > 0;
    expect(hasSuccess).toBe(true);
    
    // Care plan should be visible in the list
    const carePlanRow = page.locator('text="Test Care Plan"');
    await expect(carePlanRow).toBeVisible();
  });

  test('should validate required fields before creating care plan', async ({ page }) => {
    await page.goto('/clients');
    
    const firstClient = page.getByRole('link').first();
    await firstClient.click();
    
    const carePlansTab = page.getByRole('tab', { name: /care plans/i });
    if (await carePlansTab.count()) {
      await carePlansTab.click();
    }
    
    const addButton = page.getByRole('button', { name: /create|add/i }).filter({ hasText: /care plan/i }).first();
    if (await addButton.count()) {
      await addButton.click();
    }
    
    // Try to submit without name
    const saveButton = page.getByRole('button', { name: /create|save/i }).first();
    await saveButton.click();
    
    await page.waitForTimeout(500);
    
    // Should show validation error
    const hasValidationError = await page.locator('.toast-warning, .form-error, [role="alert"]:has-text("missing", "required")').count() > 0;
    expect(hasValidationError).toBe(true);
  });

  test('should validate start date is required', async ({ page }) => {
    await page.goto('/clients');
    
    const firstClient = page.getByRole('link').first();
    await firstClient.click();
    
    const carePlansTab = page.getByRole('tab', { name: /care plans/i });
    if (await carePlansTab.count()) {
      await carePlansTab.click();
    }
    
    const addButton = page.getByRole('button', { name: /create|add/i }).filter({ hasText: /care plan/i }).first();
    if (await addButton.count()) {
      await addButton.click();
    }
    
    // Fill name but not date
    const nameInput = page.locator('input[placeholder*="name", label:has-text("Care Plan Name") + input]').first();
    await nameInput.fill('Test Care Plan');
    
    const saveButton = page.getByRole('button', { name: /create|save/i }).first();
    await saveButton.click();
    
    await page.waitForTimeout(500);
    
    // Should show validation error for start date
    const hasValidationError = await page.locator('.toast-warning, .form-error, [role="alert"]:has-text("missing", "required", "date")').count() > 0;
    expect(hasValidationError).toBe(true);
  });
});
