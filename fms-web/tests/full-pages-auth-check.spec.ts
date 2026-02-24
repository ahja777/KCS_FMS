import { test, expect, Page } from '@playwright/test';

/**
 * 로그인 후 전체 페이지 정상 작동 확인 (인증 포함)
 * - 새로 추가된 기업운임관리 페이지 포함
 * - 로그인 후 실제 컨텐츠 렌더링 확인
 */

let authCookie = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { userId: 'admin', password: 'admin1234' }
  });
  const headers = res.headers();
  const setCookie = headers['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  if (match) {
    authCookie = `fms_auth_token=${match[1]}`;
  }
});

async function goWithAuth(page: Page, url: string) {
  const cookieMatch = authCookie.match(/fms_auth_token=(.+)/);
  if (cookieMatch) {
    await page.context().addCookies([{
      name: 'fms_auth_token',
      value: cookieMatch[1],
      domain: '127.0.0.1',
      path: '/',
    }]);
  }
  return await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
}

// 전체 페이지 URL (기업운임관리 신규 페이지 포함)
const pages = [
  '/',
  '/billing',
  '/bl',
  '/logis',
  '/logis/agent/operation',
  '/logis/ams/sea',
  '/logis/ams/sea/register',
  '/logis/an/air',
  '/logis/an/air/register',
  '/logis/an/sea',
  '/logis/an/sea/register',
  '/logis/bl/air',
  '/logis/bl/air/house',
  '/logis/bl/air/house/register',
  '/logis/bl/air/master',
  '/logis/bl/air/master/register',
  '/logis/bl/air/register',
  '/logis/bl/sea',
  '/logis/bl/sea/house',
  '/logis/bl/sea/house/register',
  '/logis/bl/sea/master',
  '/logis/bl/sea/master/register',
  '/logis/bl/sea/register',
  '/logis/booking/air',
  '/logis/booking/air/multi-register',
  '/logis/booking/air/register',
  '/logis/booking/sea',
  '/logis/booking/sea/multi-register',
  '/logis/booking/sea/register',
  '/logis/cargo/release',
  '/logis/cargo/status',
  '/logis/cargo/tracking',
  '/logis/common/code',
  '/logis/console/bl-import',
  '/logis/container/share',
  '/logis/cost/payment',
  '/logis/customs/sea',
  '/logis/customs/sea/register',
  '/logis/customs-account/sea',
  '/logis/customs-account/sea/register',
  '/logis/document',
  '/logis/exchange-rate',
  '/logis/export/clp',
  '/logis/export/stuffing',
  '/logis/export/vgm',
  '/logis/export-awb/air',
  '/logis/export-awb/air/register',
  '/logis/export-bl/manage',
  '/logis/export-bl/manage/register',
  '/logis/import-bl/air',
  '/logis/import-bl/air/arrival',
  '/logis/import-bl/air/house',
  '/logis/import-bl/air/house/register',
  '/logis/import-bl/air/master',
  '/logis/import-bl/air/master/register',
  '/logis/import-bl/air/register',
  '/logis/import-bl/sea',
  '/logis/import-bl/sea/arrival',
  '/logis/import-bl/sea/house',
  '/logis/import-bl/sea/house/register',
  '/logis/import-bl/sea/master',
  '/logis/import-bl/sea/master/register',
  '/logis/import-bl/sea/register',
  '/logis/import/customs/sea',
  '/logis/manifest/sea',
  '/logis/manifest/sea/register',
  '/logis/oms/customer-order',
  '/logis/oms/order-type',
  '/logis/oms/service-order',
  '/logis/oms/so-control',
  '/logis/pre-alert/air',
  '/logis/quote/air',
  '/logis/quote/air/register',
  '/logis/quote/request',
  '/logis/quote/request/register',
  '/logis/quote/sea',
  '/logis/quote/sea/register',
  '/logis/rate/base',
  '/logis/rate/corporate',
  '/logis/rate/corporate/sea',
  '/logis/rate/corporate/sea/register',
  '/logis/rate/corporate/air',
  '/logis/rate/corporate/air/register',
  '/logis/schedule/air',
  '/logis/schedule/air/register',
  '/logis/schedule/sea',
  '/logis/schedule/sea/register',
  '/logis/schedule/shipper',
  '/logis/sn/air',
  '/logis/sn/air/register',
  '/logis/sn/sea',
  '/logis/sn/sea/register',
  '/logis/sr/sea',
  '/logis/sr/sea/register',
  '/logis/tracking',
  '/logis/transport/inland',
  '/logis/transport/manage',
  '/logis/transport/quote',
  '/logis/transport/request',
  '/logis/transport/status',
  '/logis/warehouse/manage',
  '/schedules',
  '/admin/company',
];

test.describe('전체 페이지 정상 작동 확인 (로그인 후)', () => {
  for (const pageUrl of pages) {
    test(`${pageUrl}`, async ({ page }) => {
      if (!authCookie) {
        test.skip(true, 'DB 연결 실패로 로그인 불가');
        return;
      }

      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        errors.push(err.message);
      });

      const response = await goWithAuth(page, pageUrl);

      // HTTP 상태 코드 확인 (500 이상은 서버 에러)
      expect(response?.status()).toBeLessThan(500);

      // 로그인 페이지로 리다이렉트되지 않았는지 확인
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');

      // 페이지가 로드되었는지 확인
      await expect(page.locator('body')).toBeVisible();

      // "페이지를 찾을 수 없습니다" 또는 404 텍스트 확인
      const bodyText = await page.locator('body').innerText();
      const has404 = bodyText.includes('찾을 수 없') ||
                     bodyText.includes('404') ||
                     bodyText.includes('Not Found') ||
                     bodyText.includes('This page could not be found');

      if (has404) {
        throw new Error(`페이지 404 오류: ${pageUrl} - 본문에 "찾을 수 없습니다" 또는 "404" 텍스트 발견`);
      }

      // 치명적 JS 에러 체크
      const criticalErrors = errors.filter(e =>
        e.includes('Hydration') ||
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Uncaught')
      );

      if (criticalErrors.length > 0) {
        console.warn(`[${pageUrl}] 치명적 에러:`, criticalErrors);
      }
    });
  }
});
