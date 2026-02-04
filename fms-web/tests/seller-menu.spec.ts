import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Seller 메뉴 테스트', () => {
  // 각 테스트 전에 localStorage 초기화하여 Logis 메뉴가 기본 확장 상태로 시작
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // localStorage 초기화하여 Logis 메뉴가 기본 확장 상태가 되도록 함
    await page.evaluate(() => localStorage.removeItem('fms_sidebar_expanded'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    // 초기화 후 Logis 메뉴는 기본적으로 확장됨 (useState 기본값)
  });

  test('1. Seller 메뉴가 Logis 카테고리 맨 위에 표시되어야 함', async ({ page }) => {
    // localStorage 초기화 후 Logis 메뉴는 기본 확장 상태이므로 클릭하지 않음

    // Seller 카테고리가 보이는지 확인 (버튼 내부의 span 텍스트로 찾기)
    const sellerButton = page.locator('aside button').filter({ hasText: 'Seller' }).first();
    await expect(sellerButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Seller 카테고리가 표시됨');

    // Seller가 첫 번째 카테고리인지 확인 (OMS보다 위에 있어야 함)
    const categories = page.locator('aside button span.flex-1');
    const categoryTexts = await categories.allTextContents();
    const sellerIndex = categoryTexts.indexOf('Seller');
    const omsIndex = categoryTexts.indexOf('OMS');
    expect(sellerIndex).toBeLessThan(omsIndex);
    console.log('✓ Seller가 OMS보다 위에 있음');
  });

  test('2. Seller > 스케줄조회(화주) 페이지 접근', async ({ page }) => {
    // Logis 메뉴는 이미 확장 상태 (기본값)

    // Seller 카테고리 클릭하여 하위 메뉴 펼치기
    const sellerButton = page.locator('aside button').filter({ hasText: 'Seller' }).first();
    await sellerButton.click();
    await page.waitForTimeout(500);

    // 스크린샷 (디버그)
    await page.screenshot({ path: 'screenshots/debug-seller-expanded.png' });

    // 스케줄조회(화주) 링크가 보일 때까지 대기
    const scheduleLink = page.locator('a[href="/logis/schedule/shipper"]');
    await expect(scheduleLink).toBeVisible({ timeout: 5000 });
    console.log('✓ 스케줄조회(화주) 링크 visible');

    // 스케줄조회(화주) 링크 클릭
    await scheduleLink.click();
    await page.waitForURL('**/logis/schedule/shipper', { timeout: 10000 });

    // URL 확인
    expect(page.url()).toContain('/logis/schedule/shipper');
    console.log('✓ 스케줄조회(화주) 페이지 접근 성공');

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ 페이지 정상 로드됨');
  });

  test('3. Seller > 견적요청 페이지 접근', async ({ page }) => {
    // Logis 메뉴는 이미 확장 상태 (기본값)

    // Seller 카테고리 클릭하여 하위 메뉴 펼치기
    const sellerButton = page.locator('aside button').filter({ hasText: 'Seller' }).first();
    await sellerButton.click();
    await page.waitForTimeout(500);

    // 견적요청 링크가 보일 때까지 대기
    const quoteLink = page.locator('a[href="/logis/quote/request"]');
    await expect(quoteLink).toBeVisible({ timeout: 5000 });
    console.log('✓ 견적요청 링크 visible');

    // 견적요청 링크 클릭
    await quoteLink.click();
    await page.waitForURL('**/logis/quote/request', { timeout: 10000 });

    // URL 확인
    expect(page.url()).toContain('/logis/quote/request');
    console.log('✓ 견적요청 페이지 접근 성공');

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ 페이지 정상 로드됨');
  });

  test('4. 공통 카테고리에서 스케줄조회(화주), 견적요청이 제거되었는지 확인', async ({ page }) => {
    // Logis 메뉴는 이미 확장 상태 (기본값)

    // 공통 카테고리 클릭
    const commonButton = page.locator('aside button').filter({ hasText: '공통' }).first();
    await commonButton.click();
    await page.waitForTimeout(300);

    // 공통 카테고리 내에 스케줄조회(화주)가 없어야 함
    const scheduleShipperInCommon = page.locator('ul').filter({ hasText: '컨테이너공유' }).getByRole('link', { name: '스케줄조회(화주)' });
    await expect(scheduleShipperInCommon).toHaveCount(0);
    console.log('✓ 공통 카테고리에서 스케줄조회(화주) 제거됨');

    // 공통 카테고리 내에 견적요청이 없어야 함
    const quoteRequestInCommon = page.locator('ul').filter({ hasText: '컨테이너공유' }).getByRole('link', { name: '견적요청' });
    await expect(quoteRequestInCommon).toHaveCount(0);
    console.log('✓ 공통 카테고리에서 견적요청 제거됨');

    // 공통 카테고리에 컨테이너공유가 있어야 함
    await expect(page.getByRole('link', { name: '컨테이너공유' })).toBeVisible();
    console.log('✓ 공통 카테고리에 컨테이너공유 유지됨');
  });

  test('5. 스케줄조회(화주) 페이지 직접 접근', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/schedule/shipper`);
    await page.waitForLoadState('networkidle');

    // 페이지가 정상 로드되었는지 확인 (에러 없이)
    const response = await page.goto(`${BASE_URL}/logis/schedule/shipper`);
    expect(response?.status()).toBe(200);
    console.log('✓ 스케줄조회(화주) 페이지 직접 접근 성공');
  });

  test('6. 견적요청 페이지 직접 접근', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/quote/request`);
    await page.waitForLoadState('networkidle');

    // 페이지가 정상 로드되었는지 확인 (에러 없이)
    const response = await page.goto(`${BASE_URL}/logis/quote/request`);
    expect(response?.status()).toBe(200);
    console.log('✓ 견적요청 페이지 직접 접근 성공');
  });
});
