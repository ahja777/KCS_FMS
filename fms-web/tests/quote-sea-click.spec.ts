import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('견적관리(해상) 목록 데이터 클릭 → 상세 페이지 정상 로드', async ({ page }) => {
  await page.goto(`${BASE}/logis/quote/sea`);
  await page.waitForLoadState('networkidle');

  // 초기화 버튼 클릭하여 날짜 필터 해제
  const resetBtn = page.locator('button', { hasText: '초기화' }).first();
  if (await resetBtn.count() > 0) {
    await resetBtn.click();
    await page.waitForTimeout(500);
  }

  // 조회 버튼 클릭
  const searchBtn = page.locator('button', { hasText: '조회' }).first();
  if (await searchBtn.count() > 0) {
    await searchBtn.click();
    await page.waitForTimeout(1000);
  }

  // 견적번호 링크 찾기
  const link = page.locator('a[href*="/logis/quote/sea/"]').first();
  if (await link.count() === 0) {
    console.log('목록 데이터 없음 - 직접 상세 접근 테스트로 대체');
    await page.goto(`${BASE}/logis/quote/sea/1`);
  } else {
    const href = await link.getAttribute('href');
    console.log('클릭 링크:', href);
    await link.click();
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // runtime error 없는지 확인
  const errorOverlay = page.locator('[data-nextjs-dialog]');
  expect(await errorOverlay.count()).toBe(0);

  const hasContent = await page.locator('text=기본정보').count() > 0 ||
                     await page.locator('text=견적을 찾을 수 없습니다').count() > 0;
  expect(hasContent).toBe(true);

  console.log('상세 페이지 정상 로드 - 런타임 에러 없음');
});

test('견적관리(해상) 상세 - status=active 렌더링 확인', async ({ page }) => {
  const res = await page.goto(`${BASE}/logis/quote/sea/17`);
  expect(res?.status()).toBe(200);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const errorOverlay = page.locator('[data-nextjs-dialog]');
  expect(await errorOverlay.count()).toBe(0);
  console.log('id=17 (status=active) 정상 렌더링');
});

test('견적관리(해상) 상세 - status=DRAFT 렌더링 확인', async ({ page }) => {
  const res = await page.goto(`${BASE}/logis/quote/sea/14`);
  expect(res?.status()).toBe(200);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const errorOverlay = page.locator('[data-nextjs-dialog]');
  expect(await errorOverlay.count()).toBe(0);
  console.log('id=14 (status=DRAFT) 정상 렌더링');
});

test('견적관리(해상) 상세 - status=PENDING 렌더링 확인', async ({ page }) => {
  const res = await page.goto(`${BASE}/logis/quote/sea/10`);
  expect(res?.status()).toBe(200);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const errorOverlay = page.locator('[data-nextjs-dialog]');
  expect(await errorOverlay.count()).toBe(0);
  console.log('id=10 (status=PENDING) 정상 렌더링');
});
