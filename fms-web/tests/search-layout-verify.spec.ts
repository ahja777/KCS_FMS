import { test, expect } from '@playwright/test';

test('견적요청 조회 페이지 검색 영역 레이아웃 확인', async ({ page }) => {
  // 로그인
  await page.goto('http://localhost:3600/login');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  
  // 견적요청 조회 페이지 이동
  await page.goto('http://localhost:3600/logis/quote/request');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 전체 페이지 스크린샷
  await page.screenshot({ path: 'tests/screenshots/quote-request-search-layout.png', fullPage: true });
  
  // 검색조건 영역만 스크린샷
  const searchCard = page.locator('.card').first();
  await searchCard.screenshot({ path: 'tests/screenshots/quote-request-search-area.png' });
  
  // 검색조건 헤더 확인
  await expect(page.locator('text=검색조건')).toBeVisible();
  
  // grid 레이아웃 확인 - 6열 그리드가 적용되었는지
  const gridRow = page.locator('.grid.grid-cols-6').first();
  await expect(gridRow).toBeVisible();
  
  // 검색 필드들 존재 확인
  await expect(page.locator('label:has-text("업무구분")')).toBeVisible();
  await expect(page.locator('label:has-text("수출입구분")')).toBeVisible();
  await expect(page.locator('label:has-text("등록일자")')).toBeVisible();
  await expect(page.locator('label:has-text("출발공항")')).toBeVisible();
  await expect(page.locator('label:has-text("도착공항")')).toBeVisible();
  await expect(page.locator('label:has-text("출발항")')).toBeVisible();
  await expect(page.locator('label:has-text("도착항")')).toBeVisible();
  await expect(page.locator('label:has-text("거래처")')).toBeVisible();
  await expect(page.locator('label:has-text("출발지")')).toBeVisible();
  await expect(page.locator('label:has-text("도착지")')).toBeVisible();
  
  // 조회/초기화 버튼 확인
  await expect(page.locator('button:has-text("조회")')).toBeVisible();
  await expect(page.locator('button:has-text("초기화")')).toBeVisible();
  
  console.log('견적요청 조회 페이지 검색 레이아웃 확인 완료!');
});
