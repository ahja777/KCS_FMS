import { test, expect } from '@playwright/test';

const LIST_PAGES = [
  { path: '/logis/quote/request', name: '견적요청 조회' },
  { path: '/logis/sr/sea', name: 'S/R 해상' },
  { path: '/logis/booking/sea', name: '부킹 해상' },
  { path: '/logis/booking/air', name: '부킹 항공' },
  { path: '/logis/sn/sea', name: 'S/N 해상' },
  { path: '/logis/sn/air', name: 'S/N 항공' },
  { path: '/logis/an/sea', name: 'A/N 해상' },
  { path: '/logis/an/air', name: 'A/N 항공' },
  { path: '/logis/bl/sea', name: 'BL 해상' },
  { path: '/logis/bl/air', name: 'BL 항공' },
  { path: '/logis/schedule/sea', name: '스케줄 해상' },
  { path: '/logis/schedule/air', name: '스케줄 항공' },
  { path: '/logis/customs/sea', name: '통관 해상' },
  { path: '/logis/manifest/sea', name: '적하목록' },
  { path: '/logis/ams/sea', name: 'AMS' },
  { path: '/logis/common/partner', name: '파트너' },
  { path: '/logis/transport/inland', name: '내륙운송' },
  { path: '/logis/cargo/trace', name: '화물추적' },
  { path: '/logis/export-awb/air', name: '수출AWB' },
  { path: '/logis/quote/sea', name: '견적 해상' },
  { path: '/logis/quote/air', name: '견적 항공' },
];

test.describe('전체 조회 페이지 검색 영역 레이아웃 일관성 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  for (const { path, name } of LIST_PAGES) {
    test(`${name} (${path}) 검색 레이아웃 확인`, async ({ page }) => {
      await page.goto(`http://localhost:3600${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 검색조건 헤더 존재 확인
      const searchHeader = page.locator('text=검색조건').first();
      await expect(searchHeader).toBeVisible({ timeout: 5000 });

      // grid 레이아웃 존재 확인 (Tailwind grid-cols-* 또는 CSS-in-JS search-grid)
      const gridLayout = page.locator('[class*="grid grid-cols-"], [class*="search-grid"]').first();
      await expect(gridLayout).toBeVisible();

      // 스크린샷 저장
      const safeName = path.replace(/\//g, '-').replace(/^-/, '');
      await page.screenshot({ path: `tests/screenshots/search-layout-${safeName}.png`, fullPage: false });
    });
  }
});
