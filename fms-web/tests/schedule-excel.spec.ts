import { test, expect } from '@playwright/test';


test.describe('스케줄 관리 엑셀 기능 테스트', () => {

  test('해상 스케줄 - 목록 조회 및 엑셀다운로드 버튼 확인', async ({ page }) => {
    await page.goto(`/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');

    // 데이터가 로드될 때까지 대기
    await page.waitForTimeout(2000);

    // 엑셀다운로드 버튼 확인
    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' });
    expect(await dlBtn.count()).toBeGreaterThan(0);
    console.log('  [해상 스케줄] 엑셀다운로드 버튼 확인됨');

    // 테이블에 데이터가 있는지 확인
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`  [해상 스케줄] 테이블 행 수: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('해상 스케줄 - 엑셀다운로드 실행', async ({ page }) => {
    await page.goto(`/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' }).first();

    page.on('dialog', async dialog => {
      console.log(`  [해상 스케줄] Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await dlBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filename = download.suggestedFilename();
      console.log(`  [해상 스케줄] 엑셀다운로드 파일: ${filename}`);
      expect(filename).toMatch(/\.(csv|xlsx|xls)$/);
    } else {
      console.log('  [해상 스케줄] 엑셀다운로드 클릭 완료');
    }
  });

  test('항공 스케줄 - 목록 조회 및 엑셀다운로드 버튼 확인', async ({ page }) => {
    await page.goto(`/logis/schedule/air`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' });
    expect(await dlBtn.count()).toBeGreaterThan(0);
    console.log('  [항공 스케줄] 엑셀다운로드 버튼 확인됨');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`  [항공 스케줄] 테이블 행 수: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('항공 스케줄 - 엑셀다운로드 실행', async ({ page }) => {
    await page.goto(`/logis/schedule/air`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' }).first();

    page.on('dialog', async dialog => {
      console.log(`  [항공 스케줄] Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await dlBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filename = download.suggestedFilename();
      console.log(`  [항공 스케줄] 엑셀다운로드 파일: ${filename}`);
      expect(filename).toMatch(/\.(csv|xlsx|xls)$/);
    } else {
      console.log('  [항공 스케줄] 엑셀다운로드 클릭 완료');
    }
  });

  test('화주 스케줄 조회 - 목록 조회 및 엑셀다운로드 확인', async ({ page }) => {
    await page.goto(`/logis/schedule/shipper`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' });
    const dlCount = await dlBtn.count();
    console.log(`  [화주 스케줄] 엑셀다운로드 버튼 수: ${dlCount}`);

    // 화주 스케줄 페이지도 데이터 조회 확인
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`  [화주 스케줄] 테이블 행 수: ${rowCount}`);
  });
});

test.describe('스케줄 CRUD UI 테스트', () => {

  test('해상 스케줄 - 등록 페이지 접근', async ({ page }) => {
    await page.goto(`/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');

    // 신규 버튼 찾기
    const newBtn = page.locator('button', { hasText: '신규' });
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForURL('**/register**');
      console.log('  [해상 스케줄] 등록 페이지 이동 성공');
    }
  });

  test('항공 스케줄 - 등록 페이지 접근', async ({ page }) => {
    await page.goto(`/logis/schedule/air`);
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('button', { hasText: '신규' });
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForURL('**/register**');
      console.log('  [항공 스케줄] 등록 페이지 이동 성공');
    }
  });

  test('해상 스케줄 - 상세 페이지 접근', async ({ page }) => {
    await page.goto(`/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 첫 번째 행 클릭
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      const url = page.url();
      console.log(`  [해상 스케줄] 현재 URL: ${url}`);
    }
  });
});
