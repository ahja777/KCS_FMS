import { test, expect } from '@playwright/test';

// 탭(MAIN/CARGO/OTHER)이 있는 모든 등록페이지에서
// 스크롤 후 버튼+탭이 Header 아래에 고정되는지 검증
const TAB_PAGES = [
  { name: 'BL항공House', url: '/logis/bl/air/house/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'BL항공Master', url: '/logis/bl/air/master/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'BL항공', url: '/logis/bl/air/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'BL해상House', url: '/logis/bl/sea/house/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'BL해상Master', url: '/logis/bl/sea/master/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'BL해상', url: '/logis/bl/sea/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'ImportBL항공', url: '/logis/import-bl/air/register', tabs: ['MAIN', 'CARGO'] },
  { name: 'ImportBL항공House', url: '/logis/import-bl/air/house/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'ImportBL항공Master', url: '/logis/import-bl/air/master/register', tabs: ['MAIN', 'CARGO', 'OTHER'] },
  { name: 'SR해상', url: '/logis/sr/sea/register', tabs: ['MAIN', 'CARGO'] },
  { name: 'ExportBL관리', url: '/logis/export-bl/manage/register', tabs: ['MAIN', 'CARGO'] },
  { name: 'QuoteRequest', url: '/logis/quote/request/register', tabs: [] }, // toggle style
];

test.describe.serial('전체 탭페이지 버튼+탭 sticky 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(500);
  });

  for (const pg of TAB_PAGES) {
    test(`${pg.name} - 스크롤 후 버튼+탭 상단 고정`, async ({ page }) => {
      await page.goto(`http://localhost:3600${pg.url}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);

      // 스크롤 전 스크린샷
      await page.screenshot({ path: `test-results/tab-sticky-${pg.name}-before.png`, fullPage: false });

      // 스크롤 끝까지 내림
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // 스크롤 후 스크린샷
      await page.screenshot({ path: `test-results/tab-sticky-${pg.name}-after.png`, fullPage: false });

      // 버튼 확인 (저장 or 목록)
      const actionBtns = ['저장', '목록'];
      let btnVisible = false;
      let btnY = 999;
      for (const btnText of actionBtns) {
        const btn = page.locator(`button:has-text("${btnText}")`).first();
        const vis = await btn.isVisible().catch(() => false);
        if (vis) {
          const box = await btn.boundingBox();
          if (box) { btnVisible = true; btnY = Math.min(btnY, box.y); }
        }
      }
      expect(btnVisible, `${pg.name}: 버튼이 안 보임`).toBe(true);
      // Header가 ~80px이므로 버튼은 80~160px 범위에 있어야 함
      expect(btnY, `${pg.name}: 버튼 Y=${btnY} 너무 아래`).toBeLessThan(160);

      // 탭 확인 (탭이 있는 페이지만)
      if (pg.tabs.length > 0) {
        const firstTab = page.locator(`button:has-text("${pg.tabs[0]}")`).first();
        const tabVisible = await firstTab.isVisible().catch(() => false);
        expect(tabVisible, `${pg.name}: ${pg.tabs[0]} 탭이 안 보임`).toBe(true);
        if (tabVisible) {
          const tabBox = await firstTab.boundingBox();
          if (tabBox) {
            expect(tabBox.y, `${pg.name}: 탭 Y=${tabBox.y} 너무 아래`).toBeLessThan(200);
            console.log(`✓ ${pg.name}: 버튼Y=${btnY.toFixed(0)}, 탭Y=${tabBox.y.toFixed(0)}`);
          }
        }
      } else {
        console.log(`✓ ${pg.name}: 버튼Y=${btnY.toFixed(0)} (탭 없음/토글)`);
      }
    });
  }
});
