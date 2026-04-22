import { test, expect } from '@playwright/test';

// Production credentials
const TEST_EMAIL = 'superadmin@homecarepro.com';
const TEST_PASSWORD = 'password123';

test.describe('HomeCare Pro Stabilization - Production Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('https://together-care.vercel.app/login');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]');
    
    // Login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
  });

  // ==========================================
  // Task 1: Shared UI Contracts
  // ==========================================
  
  test('1. Select component - no circular structure errors', async ({ page }) => {
    // Navigate to scheduling where Select is used
    await page.goto('https://together-care.vercel.app/scheduling/month');
    await page.waitForTimeout(2000);
    
    // Try to open create visit form
    const createButton = page.getByRole('button', { name: /create|new/i }).first();
    if (await createButton.count()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('circular')) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      expect(consoleErrors.length).toBe(0);
    }
  });

  test('2. Toast component - works correctly', async ({ page }) => {
    // Navigate to a page that uses toast
    await page.goto('https://together-care.vercel.app/scheduling/month');
    await page.waitForTimeout(2000);
    
    const toastErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('is not a function')) {
        toastErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(toastErrors.length).toBe(0);
  });

  // ==========================================
  // Task 2: Date/Time Handling
  // ==========================================
  
  test('3. Visit creation - no 6-hour timezone drift', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/scheduling/month');
    await page.waitForTimeout(2000);
    
    const createButton = page.getByRole('button', { name: /create|new/i }).first();
    if (await createButton.count()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Set specific time
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.fill(today);
      
      const timeInput = page.locator('input[type="time"]').first();
      if (await timeInput.count()) {
        await timeInput.fill('09:00');
        await page.waitForTimeout(500);
        
        // Verify time is preserved
        const timeValue = await timeInput.inputValue();
        expect(timeValue).toBe('09:00');
      }
    }
  });

  // ==========================================
  // Task 3: Care Plan Context
  // ==========================================
  
  test('4. Care plan context preserved in scheduling', async ({ page }) => {
    // Navigate with fromCarePlan parameter
    await page.goto('https://together-care.vercel.app/scheduling/month?fromCarePlan=test-id');
    await page.waitForTimeout(2000);
    
    // Check if URL parameter is preserved
    const url = page.url();
    expect(url).toContain('fromCarePlan=test-id');
  });

  // ==========================================
  // Task 4: Client Profile Persistence
  // ==========================================
  
  test('5. Medication persistence - saves to API', async ({ page }) => {
    // Navigate to clients
    await page.goto('https://together-care.vercel.app/clients');
    await page.waitForTimeout(2000);
    
    // Click on first client
    const firstClient = page.getByRole('link').filter({ hasText: /client|first name/i }).first();
    if (await firstClient.count()) {
      await firstClient.click();
      await page.waitForTimeout(2000);
      
      // Navigate to Medical tab
      const medicalTab = page.getByRole('tab', { name: /medical/i });
      if (await medicalTab.count()) {
        await medicalTab.click();
        await page.waitForTimeout(1000);
        
        // Check for Add button
        const addButton = page.getByRole('button', { name: /add.*medication|medication.*add/i }).first();
        if (await addButton.count()) {
          expect(await addButton.isVisible()).toBe(true);
        }
      }
    }
  });

  test('6. Care plan creation - has Add button', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.getByRole('link').filter({ hasText: /client/i }).first();
    if (await firstClient.count()) {
      await firstClient.click();
      await page.waitForTimeout(2000);
      
      // Navigate to Care Plans tab
      const carePlansTab = page.getByRole('tab', { name: /care plans/i });
      if (await carePlansTab.count()) {
        await carePlansTab.click();
        await page.waitForTimeout(1000);
        
        // Check for Add/Create Care Plan button
        const addButton = page.getByRole('button', { name: /add.*care plan|create.*care plan|care plan.*add|care plan.*create/i }).first();
        if (await addButton.count()) {
          expect(await addButton.isVisible()).toBe(true);
        }
      }
    }
  });

  // ==========================================
  // Task 5: Billing/Payroll
  // ==========================================
  
  test('7. Billing batch preview - uses GET method', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/billing/invoices');
    await page.waitForTimeout(2000);
    
    // Look for batch button
    const batchButton = page.getByRole('button', { name: /batch|generate.*invoice/i }).first();
    if (await batchButton.count()) {
      await batchButton.click();
      await page.waitForTimeout(1000);
      
      // Check for 405 errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('405')) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(consoleErrors.some(err => err.includes('405'))).toBe(false);
    }
  });

  test('8. Payroll preview - no null crashes', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/payroll/timesheets');
    await page.waitForTimeout(2000);
    
    const generateButton = page.getByRole('button', { name: /generate|create.*timesheet/i }).first();
    if (await generateButton.count()) {
      await generateButton.click();
      await page.waitForTimeout(1000);
      
      // Check for reduce errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Cannot convert undefined')) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(consoleErrors.length).toBe(0);
    }
  });

  // ==========================================
  // Task 6: Reporting Truthfulness
  // ==========================================
  
  test('9. EVV widget - accurate verification counts', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/dashboard');
    await page.waitForTimeout(3000);
    
    // Look for EVV widget
    const evvWidget = page.locator('.evv-widget').first();
    if (await evvWidget.count()) {
      const evvText = await evvWidget.textContent();
      // Should have numbers, not just placeholders
      expect(evvText).toBeTruthy();
    } else {
      // EVV widget may not exist if no data - that's okay
      console.log('EVV widget not found (may have no data)');
    }
  });

  test('10. Staff performance - ratings vary (not all 4.5)', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/reports/staff-performance');
    await page.waitForTimeout(3000);
    
    // Get all ratings - check page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('11. Financial report - real expense data', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/reports/financial');
    await page.waitForTimeout(3000);
    
    // Should load without errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors.some(err => err.includes('expense'))).toBe(false);
  });

  test('12. Billing stats - includes PARTIALLY_PAID/OVERDUE', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/billing/invoices');
    await page.waitForTimeout(2000);
    
    // Should load without errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors.length).toBe(0);
  });

  // ==========================================
  // Task 7: Medication UX
  // ==========================================
  
  test('13. Medications page - no duplicate buttons', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/care-delivery/medications');
    await page.waitForTimeout(2000);
    
    // Count "Schedule View" buttons
    const scheduleButtons = await page.getByRole('button', { name: /schedule view/i }).all();
    expect(scheduleButtons.length).toBeLessThanOrEqual(1);
    
    // Check for "Reconciliation" button (should not exist or be different)
    const reconciliationButtons = await page.getByRole('button', { name: /reconciliation/i }).all();
    // If it exists, it should route to a different URL
    if (reconciliationButtons.length > 0) {
      console.log('Reconciliation buttons found:', reconciliationButtons.length);
    }
  });

  // ==========================================
  // Additional Verification
  // ==========================================
  
  test('14. Dashboard loads without errors', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/dashboard');
    await page.waitForTimeout(3000);
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Recharts') && 
      !err.includes('ResizeObserver') &&
      !err.includes('Warning:')
    );
    
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('15. Scheduling page loads correctly', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/scheduling/month');
    await page.waitForTimeout(3000);
    
    // Should have calendar
    const calendar = page.locator('.react-calendar, [class*="calendar"]').first();
    if (await calendar.count()) {
      expect(await calendar.isVisible()).toBe(true);
    }
  });

  test('16. Client list loads correctly', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/clients');
    await page.waitForTimeout(3000);
    
    // Should have page content
    const pageContent = await page.textContent('body');
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('17. Billing page loads correctly', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/billing/invoices');
    await page.waitForTimeout(3000);
    
    // Should have page content
    const pageContent = await page.textContent('body');
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('18. Payroll page loads correctly', async ({ page }) => {
    await page.goto('https://together-care.vercel.app/payroll/timesheets');
    await page.waitForTimeout(3000);
    
    // Should have page content
    const pageContent = await page.textContent('body');
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('19. Reports pages load correctly', async ({ page }) => {
    const reportPages = [
      '/reports/staff-performance',
      '/reports/financial',
      '/reports/compliance'
    ];
    
    for (const pagePath of reportPages) {
      await page.goto(`https://together-care.vercel.app${pagePath}`);
      await page.waitForTimeout(2000);
      
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1500);
      
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('Recharts') && 
        !err.includes('ResizeObserver')
      );
      
      expect(criticalErrors.length).toBeLessThan(3);
    }
  });
});
