import { test, expect } from '@playwright/test';

test.describe('KTEX 마이그레이션 데이터 UI 표시 검증', () => {

  test('해상수출 B/L 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    // KTEX B/L numbers (HDMU, OOLU, etc.)
    expect(body).toContain('HDMU');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`해상수출 B/L 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: 'tests/screenshots/ktex-ocean-export.png', fullPage: true });
    console.log('✅ 해상수출 B/L KTEX 데이터 표시 확인');
  });

  test('해상수입 Master B/L 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/sea/master');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('HDMU');
    expect(body).toContain('KRPUS');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`해상수입 MBL 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: 'tests/screenshots/ktex-import-mbl.png', fullPage: true });
    console.log('✅ 해상수입 Master B/L KTEX 데이터 표시 확인');
  });

  test('해상수입 House B/L 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/sea/house');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('KTEX-IMP');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`해상수입 HBL 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: 'tests/screenshots/ktex-import-hbl.png', fullPage: true });
    console.log('✅ 해상수입 House B/L KTEX 데이터 표시 확인');
  });

  test('항공수출 MAWB 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('185-2600');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`항공수출 MAWB 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: 'tests/screenshots/ktex-air-export-mawb.png', fullPage: true });
    console.log('✅ 항공수출 MAWB KTEX 데이터 표시 확인');
  });

  test('항공수입 MAWB 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/air/master');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('185-2600');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`항공수입 MAWB 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: 'tests/screenshots/ktex-air-import-mawb.png', fullPage: true });
    console.log('✅ 항공수입 MAWB KTEX 데이터 표시 확인');
  });

  test('항공수출 HAWB 목록에 KTEX 데이터 표시', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('KTEX-AE');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`항공수출 HAWB 행 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: 'tests/screenshots/ktex-air-export-hawb.png', fullPage: true });
    console.log('✅ 항공수출 HAWB KTEX 데이터 표시 확인');
  });

  test('항공수입 HAWB 목록에 KTEX 데이터 표시 (30건 확인)', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/air/house');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    // 원본 11건 + KTEX 19건 = 총 30건 (KTEX 데이터는 날짜순으로 뒤쪽 페이지에 위치)
    expect(body).toContain('30건');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`항공수입 HAWB 행 수: ${count} (1페이지, 총 30건)`);
    expect(count).toEqual(10);

    await page.screenshot({ path: 'tests/screenshots/ktex-air-import-hawb.png', fullPage: true });
    console.log('✅ 항공수입 HAWB 30건 표시 확인 (KTEX 19건 포함)');
  });
});
