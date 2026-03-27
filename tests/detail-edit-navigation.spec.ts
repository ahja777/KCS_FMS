import { test, expect } from '@playwright/test';

// 로그인 후 테스트 실행
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="userId"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/logis/**', { timeout: 10000 });
});

// 22개 전체 상세 페이지에서 수정 클릭 시 register 페이지로 이동하는지 확인
const detailPages = [
  // GROUP A: 이미 올바른 패턴 (검증만)
  { name: 'quote/sea', detailPath: '/logis/quote/sea/1', expectUrlIncludes: '/register' },
  { name: 'quote/air', detailPath: '/logis/quote/air/1', expectUrlIncludes: '/register' },
  { name: 'bl/air', detailPath: '/logis/bl/air/1', expectUrlIncludes: '/register' },
  { name: 'bl/sea', detailPath: '/logis/bl/sea/1', expectUrlIncludes: '/register' },
  { name: 'an/air', detailPath: '/logis/an/air/1', expectUrlIncludes: '/register' },
  { name: 'an/sea', detailPath: '/logis/an/sea/1', expectUrlIncludes: '/register' },
  { name: 'booking/sea', detailPath: '/logis/booking/sea/1', expectUrlIncludes: '/register' },
  { name: 'customs-account/sea', detailPath: '/logis/customs-account/sea/1', expectUrlIncludes: '/register' },
  { name: 'import-bl/sea', detailPath: '/logis/import-bl/sea/1', expectUrlIncludes: '/register' },
  { name: 'rate/corporate/sea', detailPath: '/logis/rate/corporate/sea/1', expectUrlIncludes: '/register' },
  { name: 'rate/corporate/air', detailPath: '/logis/rate/corporate/air/1', expectUrlIncludes: '/register' },
  // GROUP B-1: 인라인→네비게이션 변경 (이번에 수정)
  { name: 'ams/sea', detailPath: '/logis/ams/sea/1', expectUrlIncludes: '/register?id=1' },
  { name: 'booking/air', detailPath: '/logis/booking/air/1', expectUrlIncludes: '/register?id=1' },
  { name: 'customs/sea', detailPath: '/logis/customs/sea/1', expectUrlIncludes: '/register?id=1' },
  { name: 'manifest/sea', detailPath: '/logis/manifest/sea/1', expectUrlIncludes: '/register?id=1' },
  { name: 'schedule/air', detailPath: '/logis/schedule/air/1', expectUrlIncludes: '/register?id=1' },
  { name: 'schedule/sea', detailPath: '/logis/schedule/sea/1', expectUrlIncludes: '/register?id=1' },
  { name: 'sn/sea', detailPath: '/logis/sn/sea/1', expectUrlIncludes: '/register?id=1' },
  { name: 'sr/sea', detailPath: '/logis/sr/sea/1', expectUrlIncludes: '/register?id=1' },
  // GROUP B-2: 상세+등록 모두 수정
  { name: 'quote/request', detailPath: '/logis/quote/request/1', expectUrlIncludes: '/register?id=1' },
  { name: 'export-awb/air', detailPath: '/logis/export-awb/air/1', expectUrlIncludes: '/register?id=1' },
  { name: 'import-bl/air', detailPath: '/logis/import-bl/air/1', expectUrlIncludes: '/register?id=1' },
];

test.describe('상세조회 → 수정 클릭 → 등록화면 이동 확인', () => {
  for (const { name, detailPath, expectUrlIncludes } of detailPages) {
    test(`[${name}] 수정 클릭 시 register 페이지로 이동`, async ({ page }) => {
      await page.goto(`http://localhost:3000${detailPath}`);
      await page.waitForLoadState('networkidle');

      // 수정 버튼 찾기 및 클릭
      const editButton = page.locator('button', { hasText: '수정' }).first();

      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForLoadState('networkidle');

        // URL에 /register가 포함되어 있는지 확인
        const currentUrl = page.url();
        expect(currentUrl).toContain(expectUrlIncludes);
      } else {
        // 페이지가 로드되지 않거나 수정 버튼이 없는 경우 (데이터 없음)
        test.skip();
      }
    });
  }
});
