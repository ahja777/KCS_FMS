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

const pagesToCheck = [
  '/logis/booking/air/register',
  '/logis/booking/air/multi-register',
  '/logis/booking/sea/register',
  '/logis/booking/sea/multi-register',
  '/logis/schedule/air/register',
  '/logis/schedule/sea/register',
  '/logis/sr/sea/register',
  '/logis/quote/air/register',
  '/logis/quote/sea/register',
  '/logis/booking/air',
  '/logis/booking/sea',
  '/logis/sr/sea',
  '/logis/quote/air',
  '/logis/quote/sea',
  '/logis/import-bl/sea',
];

test('여러 페이지 에러 체크', async ({ page }) => {
  const errors: string[] = [];

  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[console] ${msg.text()}`);
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

  const failedPages: string[] = [];

  for (const url of pagesToCheck) {
    errors.length = 0; // 에러 초기화
    try {
      await page.goto(url, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // "missing required err components" 텍스트 확인
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const hasMissingErr = bodyText.includes('missing required') || bodyText.includes('err component');

      // 페이지에 런타임 에러 표시 확인
      const hasErrorOverlay = await page.locator('#nextjs__container_errors_overlay__').isVisible().catch(() => false);
      const hasUnhandledError = await page.locator('text=Unhandled Runtime Error').isVisible().catch(() => false);

      const pageErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));

      if (hasMissingErr || hasErrorOverlay || hasUnhandledError || pageErrors.length > 0) {
        const reason = hasMissingErr ? 'MISSING_ERR_COMPONENTS' :
                       hasErrorOverlay ? 'ERROR_OVERLAY' :
                       hasUnhandledError ? 'UNHANDLED_RUNTIME_ERROR' :
                       `CONSOLE_ERRORS(${pageErrors.length})`;
        failedPages.push(`${url} → ${reason}`);
        if (pageErrors.length > 0) {
          console.log(`  ${url} errors:`, pageErrors.slice(0, 3).join(' | '));
        }
      } else {
        console.log(`OK: ${url}`);
      }
    } catch (e: any) {
      failedPages.push(`${url} → NAVIGATION_ERROR: ${e.message?.slice(0, 100)}`);
    }
  }

  if (failedPages.length > 0) {
    console.log('\n=== FAILED PAGES ===');
    failedPages.forEach(p => console.log(p));
  }

  // 결과 출력 - 실패 페이지가 있으면 실패
  expect(failedPages, `${failedPages.length}개 페이지 에러 발생:\n${failedPages.join('\n')}`).toHaveLength(0);
});
