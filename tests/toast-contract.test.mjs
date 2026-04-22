import { test, expect } from '@playwright/test';

test.describe('useToast Contract', () => {
  test('should not throw "a is not a function" error when using toast', async ({ page }) => {
    const toastErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('is not a function') || text.includes('useToast')) {
          toastErrors.push(text);
        }
      }
    });
    
    // Navigate to a page that uses toast
    await page.goto('/scheduling/month');
    
    // Try to trigger a toast by creating a visit with missing fields
    const createButton = page.getByRole('button', { name: /create|new/i }).first();
    await createButton.click();
    
    // Submit empty form to trigger validation toast
    const submitButton = page.getByRole('button', { name: /create visit/i });
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    expect(toastErrors.length).toBe(0);
  });

  test('should display toast messages when form validation fails', async ({ page }) => {
    await page.goto('/scheduling/month');
    
    const createButton = page.getByRole('button', { name: /create|new/i }).first();
    await createButton.click();
    
    // Submit empty form
    const submitButton = page.getByRole('button', { name: /create visit/i });
    await submitButton.click();
    
    // Should show validation errors (toast or inline)
    await page.waitForTimeout(500);
    
    // Either toast appears or form shows errors
    const hasToast = await page.locator('.toast').count() > 0;
    const hasErrors = await page.locator('.form-error, [role="alert"]').count() > 0;
    
    expect(hasToast || hasErrors).toBe(true);
  });
});
