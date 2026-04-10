const { test, expect } = require('@playwright/test');

test('create a new care plan', { timeout: 120000 }, async ({ page }) => {
  // Log in
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', 'admin@homecarepro.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Navigate to Care Plans page
  await page.goto('http://localhost:3000/care-plans');
  await page.waitForLoadState('networkidle');

  // Click Create Care Plan button
  await page.click('button:has-text("Create Care Plan")');
  await page.waitForSelector('text=Create New Care Plan', { state: 'visible' });

  // Verify form is visible
  const formVisible = await page.isVisible('label:has-text("Care Plan Name")');
  expect(formVisible).toBe(true);

  // Fill in the form
  await page.fill('input[placeholder*="Plan"]', 'Test Care Plan - Post Surgery Recovery');
  await page.fill('textarea', 'Recovery plan after knee surgery with physical therapy');

  // Select a client
  const clientSelect = page.locator('select').filter({ hasText: 'Select Client' });
  const clientOptionsLength = await clientSelect.evaluate(el => el.options.length);
  expect(clientOptionsLength).toBeGreaterThan(1);
  await clientSelect.selectOption({ index: 1 });

  // Select staff (optional)
  const staffSelect = page.locator('select').filter({ hasText: 'Select Primary Staff' });
  const staffOptionsLength = await staffSelect.evaluate(el => el.options.length);
  if (staffOptionsLength > 1) {
    await staffSelect.selectOption({ index: 1 });
  }

  // Set start date
  await page.fill('input[type="date"]:first-of-type', '2026-04-10');

  // Add a service
  await page.click('button:has-text("+ Add Service")');
  await page.waitForTimeout(500);

  // Select a service
  const serviceSelect = page.locator('select').filter({ hasText: 'Select Service' }).first();
  const serviceOptionsLength = await serviceSelect.evaluate(el => el.options.length);
  expect(serviceOptionsLength).toBeGreaterThan(1);
  await serviceSelect.selectOption({ index: 1 });

  // Submit the form
  await page.click('button[type="submit"]:has-text("Create Care Plan")');

  // Wait for modal to close
  await page.waitForSelector('text=Create New Care Plan', { state: 'hidden' });

  // Verify care plan appears in the table
  await expect(page.locator('text=Test Care Plan - Post Surgery Recovery')).toBeVisible();
});
