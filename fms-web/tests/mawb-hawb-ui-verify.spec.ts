import { test, expect } from '@playwright/test';

test.describe('MAWB-HAWB 목록 페이지 데이터 표시 검증', () => {
  test('수출 MAWB 목록에 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tableBody = page.locator('tbody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    console.log(`수출 MAWB 테이블 행 수: ${rowCount}`);

    expect(rowCount).toBeGreaterThanOrEqual(1);
    console.log('수출 MAWB 정상 표시');
    await page.screenshot({ path: 'tests/screenshots/export-mawb-list.png', fullPage: true });
  });

  test('수출 HAWB 목록에 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tableBody = page.locator('tbody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    console.log(`수출 HAWB 테이블 행 수: ${rowCount}`);

    expect(rowCount).toBeGreaterThanOrEqual(1);
    console.log('수출 HAWB 정상 표시');
    await page.screenshot({ path: 'tests/screenshots/export-hawb-list.png', fullPage: true });
  });

  test('수입 MAWB 목록에 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/air/master');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tableBody = page.locator('tbody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    console.log(`수입 MAWB 테이블 행 수: ${rowCount}`);

    expect(rowCount).toBeGreaterThanOrEqual(1);
    console.log('수입 MAWB 정상 표시');
    await page.screenshot({ path: 'tests/screenshots/import-mawb-list.png', fullPage: true });
  });

  test('수입 HAWB 목록에 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/air/house');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tableBody = page.locator('tbody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    console.log(`수입 HAWB 테이블 행 수: ${rowCount}`);

    expect(rowCount).toBeGreaterThanOrEqual(1);
    console.log('수입 HAWB 정상 표시');
    await page.screenshot({ path: 'tests/screenshots/import-hawb-list.png', fullPage: true });
  });
});
