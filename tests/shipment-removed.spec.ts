import { test, expect } from '@playwright/test';


// ============================================================
// 1. Shipments 페이지 제거 확인
// ============================================================
test.describe('Shipments 페이지 제거 확인', () => {
  test('/shipments 접근 시 404', async ({ page }) => {
    const res = await page.goto(`/shipments`);
    expect(res?.status()).toBe(404);
  });

  test('/logis/shipment/1 접근 시 404', async ({ page }) => {
    const res = await page.goto(`/logis/shipment/1`);
    expect(res?.status()).toBe(404);
  });

  test('Shipments CRUD API 제거 확인', async ({ request }) => {
    const res = await request.get(`/api/shipments`);
    expect(res.status()).toBe(404);
  });
});

// ============================================================
// 2. 사이드바에서 Shipments 메뉴 제거 확인
// ============================================================
test('사이드바에 Shipments 메뉴 없음', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const shipmentLink = page.locator('a[href="/shipments"], a[href*="shipment"]');
  expect(await shipmentLink.count()).toBe(0);
});

// ============================================================
// 3. 주요 페이지 정상 로드 확인
// ============================================================
test.describe('주요 페이지 정상 로드', () => {
  const pages = [
    { name: '대시보드', path: '/' },
    { name: '해상 견적', path: '/logis/quote/sea' },
    { name: '항공 견적', path: '/logis/quote/air' },
    { name: '해상 부킹', path: '/logis/booking/sea' },
    { name: '수입 B/L (해상)', path: '/logis/import-bl/sea' },
    { name: '수출 B/L (해상)', path: '/logis/bl/sea' },
    { name: '환율', path: '/logis/exchange-rate' },
    { name: '해상 스케줄', path: '/logis/schedule/sea' },
    { name: 'S/R', path: '/logis/sr/sea' },
    { name: 'S/N', path: '/logis/sn/sea' },
    { name: '통관', path: '/logis/customs/sea' },
  ];

  for (const pg of pages) {
    test(`[${pg.name}] 페이지 정상 로드 (200)`, async ({ page }) => {
      const res = await page.goto(`${pg.path}`);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
    });
  }
});

// ============================================================
// 4. API 정상 작동 확인
// ============================================================
test.describe('주요 API 정상 작동', () => {
  const apis = [
    '/api/dashboard',
    '/api/quote/sea',
    '/api/quote/air',
    '/api/booking/sea',
    '/api/schedule/sea',
    '/api/schedule/air',
    '/api/carriers',
    '/api/customers',
    '/api/ports',
    '/api/shipments/tracking',
  ];

  for (const api of apis) {
    test(`${api} 정상 응답`, async ({ request }) => {
      const res = await request.get(`${api}`);
      expect(res.status()).toBe(200);
    });
  }
});

// ============================================================
// 5. 대시보드 정상 렌더링 확인
// ============================================================
test('대시보드 위젯 정상 렌더링', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Global Shipment Tracking 지도 위젯이 여전히 렌더링됨
  const trackingSection = page.locator('text=Global Shipment Tracking');
  expect(await trackingSection.count()).toBeGreaterThan(0);
});
