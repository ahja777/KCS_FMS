import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Seller 메뉴 테스트', () => {
  // 각 테스트 전에 localStorage 초기화
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // localStorage 초기화하여 Logis 메뉴가 기본 확장 상태가 되도록 함
    await page.evaluate(() => localStorage.removeItem('fms_sidebar_expanded'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('1. Seller 메뉴가 Logis 카테고리 맨 위에 표시되어야 함', async ({ page }) => {
    // Logis 메뉴가 이미 확장되어 있거나, 클릭하여 확장
    const logisButton = page.locator('button').filter({ hasText: 'Logis' }).first();
    await logisButton.click();
    await page.waitForTimeout(500);

    // Seller 카테고리가 보이는지 확인 (버튼 내부의 span 텍스트로 찾기)
    const sellerButton = page.locator('button').filter({ hasText: /^Seller$/ }).first();
    await expect(sellerButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Seller 카테고리가 표시됨');

    // Seller가 첫 번째 카테고리인지 확인 (OMS보다 위에 있어야 함)
    const categories = page.locator('aside button span').filter({ hasText: /^(Seller|OMS)$/ });
    const categoryTexts = await categories.allTextContents();
    expect(categoryTexts[0]).toBe('Seller');
    console.log('✓ Seller가 첫 번째 카테고리임');
  });

  test('2. Seller > 스케줄조회(화주) 페이지 접근', async ({ page }) => {
    // Logis 메뉴 확장
    const logisButton = page.locator('button').filter({ hasText: 'Logis' }).first();
    await logisButton.click();
    await page.waitForTimeout(500);

    // Seller 카테고리 클릭
    const sellerButton = page.locator('button').filter({ hasText: /^Seller$/ }).first();
    await sellerButton.click();
    await page.waitForTimeout(300);

    // 스케줄조회(화주) 링크 클릭
    await page.getByRole('link', { name: '스케줄조회(화주)' }).click();
    await page.waitForLoadState('networkidle');

    // URL 확인
    expect(page.url()).toContain('/logis/schedule/shipper');
    console.log('✓ 스케줄조회(화주) 페이지 접근 성공');

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ 페이지 정상 로드됨');
  });

  test('3. Seller > 견적요청 페이지 접근', async ({ page }) => {
    // Logis 메뉴 확장
    const logisButton = page.locator('button').filter({ hasText: 'Logis' }).first();
    await logisButton.click();
    await page.waitForTimeout(500);

    // Seller 카테고리 클릭
    const sellerButton = page.locator('button').filter({ hasText: /^Seller$/ }).first();
    await sellerButton.click();
    await page.waitForTimeout(300);

    // 견적요청 링크 클릭
    await page.getByRole('link', { name: '견적요청' }).click();
    await page.waitForLoadState('networkidle');

    // URL 확인
    expect(page.url()).toContain('/logis/quote/request');
    console.log('✓ 견적요청 페이지 접근 성공');

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ 페이지 정상 로드됨');
  });

  test('4. 공통 카테고리에서 스케줄조회(화주), 견적요청이 제거되었는지 확인', async ({ page }) => {
    // Logis 메뉴 확장
    const logisButton = page.locator('button').filter({ hasText: 'Logis' }).first();
    await logisButton.click();
    await page.waitForTimeout(500);

    // 공통 카테고리 클릭
    const commonButton = page.locator('button').filter({ hasText: /^공통$/ }).first();
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
