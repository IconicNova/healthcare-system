# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\create-care-plan.spec.js >> open edit modal from listing and direct query link
- Location: tests\create-care-plan.spec.js:68:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | async function loginAsAdmin(page) {
> 4  |   await page.goto('http://localhost:3000/login');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  5  |   await page.waitForLoadState('networkidle');
  6  | 
  7  |   await page.fill('input[type="email"]', 'admin@homecarepro.com');
  8  |   await page.fill('input[type="password"]', 'password123');
  9  |   await page.click('button:has-text("Sign In")');
  10 |   await page.waitForURL('**/dashboard', { timeout: 10000 });
  11 | }
  12 | 
  13 | test('create a new care plan', { timeout: 120000 }, async ({ page }) => {
  14 |   await loginAsAdmin(page);
  15 | 
  16 |   // Navigate to Care Plans page
  17 |   await page.goto('http://localhost:3000/care-plans');
  18 |   await page.waitForLoadState('networkidle');
  19 | 
  20 |   // Click Create Care Plan button
  21 |   await page.click('button:has-text("Create Care Plan")');
  22 |   await page.waitForSelector('text=Create New Care Plan', { state: 'visible' });
  23 | 
  24 |   // Verify form is visible
  25 |   const formVisible = await page.isVisible('label:has-text("Care Plan Name")');
  26 |   expect(formVisible).toBe(true);
  27 | 
  28 |   // Fill in the form
  29 |   await page.fill('input[placeholder*="Plan"]', 'Test Care Plan - Post Surgery Recovery');
  30 |   await page.fill('textarea', 'Recovery plan after knee surgery with physical therapy');
  31 | 
  32 |   // Select a client
  33 |   const clientSelect = page.locator('select').filter({ hasText: 'Select Client' });
  34 |   const clientOptionsLength = await clientSelect.evaluate(el => el.options.length);
  35 |   expect(clientOptionsLength).toBeGreaterThan(1);
  36 |   await clientSelect.selectOption({ index: 1 });
  37 | 
  38 |   // Select staff (optional)
  39 |   const staffSelect = page.locator('select').filter({ hasText: 'Select Primary Staff' });
  40 |   const staffOptionsLength = await staffSelect.evaluate(el => el.options.length);
  41 |   if (staffOptionsLength > 1) {
  42 |     await staffSelect.selectOption({ index: 1 });
  43 |   }
  44 | 
  45 |   // Set start date
  46 |   await page.fill('input[type="date"]:first-of-type', '2026-04-10');
  47 | 
  48 |   // Add a service
  49 |   await page.click('button:has-text("+ Add Service")');
  50 |   await page.waitForTimeout(500);
  51 | 
  52 |   // Select a service
  53 |   const serviceSelect = page.locator('select').filter({ hasText: 'Select Service' }).first();
  54 |   const serviceOptionsLength = await serviceSelect.evaluate(el => el.options.length);
  55 |   expect(serviceOptionsLength).toBeGreaterThan(1);
  56 |   await serviceSelect.selectOption({ index: 1 });
  57 | 
  58 |   // Submit the form
  59 |   await page.click('button[type="submit"]:has-text("Create Care Plan")');
  60 | 
  61 |   // Wait for modal to close
  62 |   await page.waitForSelector('text=Create New Care Plan', { state: 'hidden' });
  63 | 
  64 |   // Verify care plan appears in the table
  65 |   await expect(page.locator('text=Test Care Plan - Post Surgery Recovery')).toBeVisible();
  66 | });
  67 | 
  68 | test('open edit modal from listing and direct query link', { timeout: 120000 }, async ({ page }) => {
  69 |   await loginAsAdmin(page);
  70 | 
  71 |   await page.goto('http://localhost:3000/care-plans');
  72 |   await page.waitForLoadState('networkidle');
  73 | 
  74 |   const firstRow = page.locator('tbody tr').first();
  75 |   await expect(firstRow).toBeVisible();
  76 | 
  77 |   await firstRow.getByRole('button', { name: 'Edit' }).click();
  78 |   await page.waitForURL(/\/care-plans\/[^/]+(\?edit=true)?$/);
  79 |   await expect(page.getByText('Edit Care Plan')).toBeVisible();
  80 | 
  81 |   const detailPath = new URL(page.url()).pathname;
  82 | 
  83 |   await page.goto(`http://localhost:3000${detailPath}?edit=true`);
  84 |   await page.waitForLoadState('networkidle');
  85 |   await expect(page.getByText('Edit Care Plan')).toBeVisible();
  86 | });
  87 | 
```