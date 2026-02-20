import { test } from '@playwright/test';

test.describe.serial('AWB Print Form - Final Verification', () => {
  test('MAWB Form Screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto('/logis/export-awb/air');
    await page.waitForTimeout(3000);

    // Select first row checkbox
    await page.locator('table tbody tr').first().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(500);

    // Click print button
    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(2000);

    // Switch to MAWB form
    const mawbRadio = page.locator('input[value="MAWB_FORM"]');
    if (await mawbRadio.isVisible().catch(() => false)) {
      await mawbRadio.click();
      await page.waitForTimeout(500);
    }

    // Remove scroll constraints for full form capture
    await page.evaluate(() => {
      document.querySelectorAll('[class*="max-h-"]').forEach(el => {
        (el as HTMLElement).style.maxHeight = 'none';
        (el as HTMLElement).style.overflow = 'visible';
      });
    });
    await page.waitForTimeout(300);

    const formDiv = page.locator('div[style*="width: 200mm"]').first();
    if (await formDiv.isVisible().catch(() => false)) {
      await formDiv.screenshot({ path: 'tests/screenshots/awb-mawb-form-full.png' });
    }
  });

  test('HAWB Form Screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // bl/air page works for HAWB
    await page.goto('/logis/bl/air');
    await page.waitForTimeout(3000);

    await page.locator('table tbody tr').first().locator('input[type="checkbox"]').click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('button').filter({ hasText: '출력' }).first().click();
    await page.waitForTimeout(2000);

    // Remove scroll constraints
    await page.evaluate(() => {
      document.querySelectorAll('[class*="max-h-"]').forEach(el => {
        (el as HTMLElement).style.maxHeight = 'none';
        (el as HTMLElement).style.overflow = 'visible';
      });
    });
    await page.waitForTimeout(300);

    const formDiv = page.locator('div[style*="width: 200mm"]').first();
    if (await formDiv.isVisible().catch(() => false)) {
      await formDiv.screenshot({ path: 'tests/screenshots/awb-hawb-form-full.png' });
    }
  });
});
