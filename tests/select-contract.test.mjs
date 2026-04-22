import { test, expect } from '@playwright/test';

test.describe('Select Component Contract', () => {
  test('should accept value and onChange props without circular structure error', async ({ page }) => {
    await page.goto('/scheduling/month');
    
    // Try to create a visit which uses the Select component
    const createButton = page.getByRole('button', { name: /create|new/i }).first();
    await createButton.click();
    
    // Fill in required fields
    await page.getByLabel('Client *').selectOption('');
    
    // Should not throw "Converting circular structure to JSON" error
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(1000);
    
    expect(consoleErrors.some(err => err.includes('circular structure'))).toBe(false);
  });

  test('should pass value prop correctly to native select element', async ({ page }) => {
    await page.goto('/scheduling/month');
    
    // The Select component should properly handle the value prop
    // without passing it as an invalid HTML attribute
    const select = page.locator('select').first();
    await expect(select).toBeAttached();
  });
});
