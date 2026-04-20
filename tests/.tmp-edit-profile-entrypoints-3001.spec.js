/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test');

async function loginAsAdmin(page) {
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', 'admin@homecarepro.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test('open client edit modal from listing and direct query link', { timeout: 120000 }, async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('http://localhost:3001/clients');
  await page.waitForLoadState('networkidle');

  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();

  await firstRow.getByRole('button', { name: 'Edit' }).click();
  await page.waitForURL(/\/clients\/[^/]+\?edit=true$/);
  await expect(page.locator('.modal-title', { hasText: 'Edit Client' })).toBeVisible();

  const detailPath = new URL(page.url()).pathname;

  await page.goto(`http://localhost:3001${detailPath}?edit=true`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.modal-title', { hasText: 'Edit Client' })).toBeVisible();
});

test('open staff edit modal from listing and direct query link', { timeout: 120000 }, async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('http://localhost:3001/staff');
  await page.waitForLoadState('networkidle');

  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();

  await firstRow.getByRole('button', { name: 'Edit' }).click();
  await page.waitForURL(/\/staff\/[^/]+\?edit=true$/);
  await expect(page.locator('.modal-title', { hasText: 'Edit Staff Member' })).toBeVisible();

  const detailPath = new URL(page.url()).pathname;

  await page.goto(`http://localhost:3001${detailPath}?edit=true`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.modal-title', { hasText: 'Edit Staff Member' })).toBeVisible();
});
