import { test, expect } from '@playwright/test';

test.describe.serial('해상수입 MBL/HBL 등록화면 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(500);
  });

  test('House B/L 등록 - 전체 섹션 존재 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/import-bl/sea/house/register');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // 스크린샷 (상단)
    await page.screenshot({ path: 'test-results/import-hbl-sea-top.png', fullPage: false });

    // 섹션 확인
    await expect(page.locator('text=기본정보')).toBeVisible();
    await expect(page.locator('text=거래처 정보')).toBeVisible();
    await expect(page.locator('text=운송 정보')).toBeVisible();

    // 스크롤해서 나머지 섹션 확인
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/import-hbl-sea-bottom.png', fullPage: false });

    await expect(page.locator('text=화물 정보')).toBeVisible();

    // 거래처 필드: Shipper/Consignee/Notify 코드+이름
    const shipperCode = page.locator('text=Shipper').locator('..').locator('input').first();
    await expect(shipperCode).toBeVisible();

    // 위치 필드: POL/POD 코드+이름
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(200);
    const polLabel = page.locator('text=POL').first();
    await expect(polLabel).toBeVisible();
    const podLabel = page.locator('text=POD').first();
    await expect(podLabel).toBeVisible();

    // sticky 버튼 확인 (스크롤 상태에서)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const saveBtn = page.locator('button:has-text("저장")').first();
    await expect(saveBtn).toBeVisible();
    const box = await saveBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.y).toBeLessThan(200);

    // 풀페이지 스크린샷
    await page.screenshot({ path: 'test-results/import-hbl-sea-full.png', fullPage: true });
  });

  test('Master B/L 등록 - 전체 섹션 존재 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/import-bl/sea/master/register');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // 스크린샷 (상단)
    await page.screenshot({ path: 'test-results/import-mbl-sea-top.png', fullPage: false });

    // 섹션 확인
    await expect(page.locator('text=기본정보')).toBeVisible();
    await expect(page.locator('text=운송 정보')).toBeVisible();

    // 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/import-mbl-sea-bottom.png', fullPage: false });

    await expect(page.locator('text=화물 총괄 정보')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'House B/L 목록' })).toBeVisible();

    // 위치 필드
    const polLabel = page.locator('text=POL').first();
    await expect(polLabel).toBeVisible();
    const podLabel = page.locator('text=POD').first();
    await expect(podLabel).toBeVisible();

    // 선사 필드
    const carrierField = page.locator('text=선사').first();
    await expect(carrierField).toBeVisible();

    // sticky 버튼 확인
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const saveBtn = page.locator('button:has-text("저장")').first();
    await expect(saveBtn).toBeVisible();
    const box = await saveBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.y).toBeLessThan(200);

    // 풀페이지 스크린샷
    await page.screenshot({ path: 'test-results/import-mbl-sea-full.png', fullPage: true });
  });
});
