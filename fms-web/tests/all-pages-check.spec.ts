import { test, expect } from '@playwright/test';

// 모든 페이지 URL 목록 (동적 라우트 제외)
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
  '/logis/transport/manage',
  '/logis/transport/quote',
  '/logis/transport/request',
  '/logis/transport/status',
  '/logis/warehouse/manage',
  '/schedules',
];

test.describe('전체 페이지 정상 작동 확인', () => {
  for (const page of pages) {
    test(`페이지 로드 테스트: ${page}`, async ({ page: browserPage }) => {
      const errors: string[] = [];

      // 콘솔 에러 캡처
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // 페이지 에러 캡처
      browserPage.on('pageerror', err => {
        errors.push(err.message);
      });

      const response = await browserPage.goto(`http://localhost:3000${page}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // HTTP 상태 코드 확인
      expect(response?.status()).toBeLessThan(500);

      // 페이지가 로드되었는지 확인 (body 존재 여부)
      await expect(browserPage.locator('body')).toBeVisible();

      // React 하이드레이션 에러 체크
      const criticalErrors = errors.filter(e =>
        e.includes('Hydration') ||
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Uncaught')
      );

      if (criticalErrors.length > 0) {
        console.log(`[${page}] 치명적 에러 발견:`, criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    });
  }
});
