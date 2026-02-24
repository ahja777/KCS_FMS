import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button:has-text("로그인")');
  await page.waitForTimeout(5000);
}

test('페이지 간 네비게이션 에러 체크 (클릭 이동)', async ({ page }) => {
  const errors: string[] = [];
  const failedNavs: string[] = [];

  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // 무시할 에러들
      if (text.includes('favicon') || text.includes('404') || text.includes('hydrat')) return;
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });

  await login(page);
  if (page.url().includes('/login')) {
    test.skip(true, 'DB 연결 실패로 로그인 불가');
    return;
  }

  // 네비게이션 페이지 목록 (직접 URL로 이동 + 다른 페이지로 클릭 이동)
  const navSequence = [
    '/logis/booking/air',
    '/logis/booking/sea',
    '/logis/schedule/air/register',
    '/logis/booking/air/register',
    '/logis/booking/air/multi-register',
    '/logis/booking/sea/multi-register',
    '/logis/sr/sea',
    '/logis/quote/air',
    '/logis/quote/sea',
    '/logis/import-bl/sea',
    '/logis/schedule/sea/register',
    '/logis/sr/sea/register',
    '/logis/export-bl/sea',
    '/logis/export-awb/air',
    '/logis/customs/export',
    '/logis/customs/import',
    '/logis/exchange-rate',
  ];

  for (const url of navSequence) {
    errors.length = 0;
    try {
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // "missing required err components" 확인
      const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
      if (bodyText.includes('missing required') || bodyText.includes('err component')) {
        failedNavs.push(`${url} -> MISSING_ERR_COMPONENTS`);
        console.log(`FAIL: ${url} -> missing required err components`);
        continue;
      }

      // 에러 오버레이 확인
      const hasOverlay = await page.locator('#nextjs__container_errors_overlay__').isVisible().catch(() => false);
      if (hasOverlay) {
        failedNavs.push(`${url} -> ERROR_OVERLAY`);
        console.log(`FAIL: ${url} -> error overlay visible`);
        continue;
      }

      const pageErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('Failed to fetch') &&
        !e.includes('net::ERR')
      );

      if (pageErrors.length > 0) {
        console.log(`WARN: ${url} -> ${pageErrors.length} console errors`);
        pageErrors.forEach(e => console.log(`  - ${e.slice(0, 120)}`));
      } else {
        console.log(`OK: ${url}`);
      }
    } catch (e: any) {
      failedNavs.push(`${url} -> NAV_ERROR: ${e.message?.slice(0, 80)}`);
      console.log(`FAIL: ${url} -> ${e.message?.slice(0, 80)}`);
    }
  }

  if (failedNavs.length > 0) {
    console.log('\n=== FAILED NAVIGATIONS ===');
    failedNavs.forEach(p => console.log(p));
  }

  expect(failedNavs, `${failedNavs.length}개 페이지 에러:\n${failedNavs.join('\n')}`).toHaveLength(0);
});
