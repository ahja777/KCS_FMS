import { test, expect } from '@playwright/test';

// 전체 32개 등록페이지 + 2개 멀티등록 = 34개 페이지 직접 열어서
// 1) 페이지 로드 확인
// 2) 스크롤 끝까지 내림
// 3) 버튼이 여전히 뷰포트 상단에 보이는지 검증
// 4) 스크린샷 촬영

const ALL_REGISTER_PAGES = [
  { name: '01-SR해상', url: '/logis/sr/sea/register' },
  { name: '02-Booking해상', url: '/logis/booking/sea/register' },
  { name: '03-Booking항공', url: '/logis/booking/air/register' },
  { name: '04-Booking해상멀티', url: '/logis/booking/sea/multi-register' },
  { name: '05-Booking항공멀티', url: '/logis/booking/air/multi-register' },
  { name: '06-Quote해상', url: '/logis/quote/sea/register' },
  { name: '07-Quote항공', url: '/logis/quote/air/register' },
  { name: '08-QuoteRequest', url: '/logis/quote/request/register' },
  { name: '09-BL해상', url: '/logis/bl/sea/register' },
  { name: '10-BL해상House', url: '/logis/bl/sea/house/register' },
  { name: '11-BL해상Master', url: '/logis/bl/sea/master/register' },
  { name: '12-BL항공', url: '/logis/bl/air/register' },
  { name: '13-BL항공House', url: '/logis/bl/air/house/register' },
  { name: '14-BL항공Master', url: '/logis/bl/air/master/register' },
  { name: '15-SN해상', url: '/logis/sn/sea/register' },
  { name: '16-SN항공', url: '/logis/sn/air/register' },
  { name: '17-AN해상', url: '/logis/an/sea/register' },
  { name: '18-AN항공', url: '/logis/an/air/register' },
  { name: '19-Schedule해상', url: '/logis/schedule/sea/register' },
  { name: '20-Schedule항공', url: '/logis/schedule/air/register' },
  { name: '21-ExportAWB항공', url: '/logis/export-awb/air/register' },
  { name: '22-ExportBL관리', url: '/logis/export-bl/manage/register' },
  { name: '23-ImportBL해상', url: '/logis/import-bl/sea/register' },
  { name: '24-ImportBL해상House', url: '/logis/import-bl/sea/house/register' },
  { name: '25-ImportBL해상Master', url: '/logis/import-bl/sea/master/register' },
  { name: '26-ImportBL항공', url: '/logis/import-bl/air/register' },
  { name: '27-ImportBL항공House', url: '/logis/import-bl/air/house/register' },
  { name: '28-ImportBL항공Master', url: '/logis/import-bl/air/master/register' },
  { name: '29-AMS해상', url: '/logis/ams/sea/register' },
  { name: '30-Customs해상', url: '/logis/customs/sea/register' },
  { name: '31-CustomsAccount해상', url: '/logis/customs-account/sea/register' },
  { name: '32-Manifest해상', url: '/logis/manifest/sea/register' },
  { name: '33-Rate법인해상', url: '/logis/rate/corporate/sea/register' },
  { name: '34-Rate법인항공', url: '/logis/rate/corporate/air/register' },
];

test.describe.serial('전체 등록페이지 스크롤 sticky 테스트', () => {
  let loggedIn = false;

  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3600/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(500);
  });

  for (const pg of ALL_REGISTER_PAGES) {
    test(`${pg.name} 페이지 로드 및 스크롤 sticky 확인`, async ({ page }) => {
      // 1) 페이지 이동
      await page.goto(`http://localhost:3600${pg.url}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // 2) 페이지 높이 확인 (스크롤 가능한지)
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);

      // 3) 스크롤 전 스크린샷
      await page.screenshot({ path: `test-results/sticky-${pg.name}-before.png`, fullPage: false });

      // 4) 스크롤 끝까지 내림
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // 5) 스크롤 후 스크린샷
      await page.screenshot({ path: `test-results/sticky-${pg.name}-after.png`, fullPage: false });

      // 6) sticky 영역 확인 - 뷰포트 내에 버튼이 보이는지
      //    sticky div는 보통 '신규', '저장', '목록' 등의 버튼을 포함
      const stickyButtons = ['신규', '저장', '목록', '초기화', '취소', '수정'];
      let foundCount = 0;
      let stickyWorking = false;

      for (const btnText of stickyButtons) {
        const btn = page.locator(`button:has-text("${btnText}")`).first();
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          foundCount++;
          const box = await btn.boundingBox();
          if (box && box.y < 200) {
            stickyWorking = true;
          }
        }
      }

      // 최소 1개 이상의 버튼이 보여야 함
      expect(foundCount, `${pg.name}: 버튼이 하나도 안 보임`).toBeGreaterThan(0);

      // 페이지 높이가 뷰포트보다 크면 sticky가 동작해야 함
      if (pageHeight > viewportHeight + 100) {
        expect(stickyWorking, `${pg.name}: 스크롤 후 버튼이 상단에 고정 안됨 (pageH=${pageHeight}, vpH=${viewportHeight})`).toBe(true);
      }

      console.log(`✓ ${pg.name}: 버튼 ${foundCount}개 visible, sticky=${stickyWorking}, 높이=${pageHeight}/${viewportHeight}`);
    });
  }
});
