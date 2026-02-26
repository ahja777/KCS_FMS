import { test, expect } from '@playwright/test';

// 로그인 후 등록 페이지에서 스크롤 내린 뒤 버튼이 계속 보이는지 검증
const PAGES = [
  { name: 'S/R 해상 등록', url: '/logis/sr/sea/register', buttons: ['신규', '저장'] },
  { name: 'Booking 해상 등록', url: '/logis/booking/sea/register', buttons: ['신규'] },
  { name: 'A/N 해상 등록', url: '/logis/an/sea/register', buttons: ['신규', '저장'] },
  { name: 'Schedule 해상 등록', url: '/logis/schedule/sea/register', buttons: ['신규', '저장'] },
  { name: 'Quote 해상 등록', url: '/logis/quote/sea/register', buttons: ['신규', '저장'] },
  { name: 'BL 해상 등록', url: '/logis/bl/sea/register', buttons: ['신규', '저장'] },
  { name: 'SN 해상 등록', url: '/logis/sn/sea/register', buttons: ['신규', '저장'] },
  { name: 'Import BL 해상 등록', url: '/logis/import-bl/sea/register', buttons: ['저장'] },
];

test.describe('Sticky 버튼 스크롤 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  for (const pg of PAGES) {
    test(`${pg.name} - 스크롤 후 버튼 visible`, async ({ page }) => {
      await page.goto(`http://localhost:3600${pg.url}`);
      await page.waitForLoadState('networkidle');

      // 페이지 끝까지 스크롤
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // 스크롤 후에도 sticky 영역의 버튼들이 보이는지 확인
      for (const btnText of pg.buttons) {
        const btn = page.locator(`button:has-text("${btnText}")`).first();
        await expect(btn).toBeVisible();

        // 실제로 뷰포트 안에 있는지 확인 (화면 상단 근처)
        const box = await btn.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          // 버튼이 뷰포트 상단 150px 이내에 위치해야 함 (sticky로 고정되었으므로)
          expect(box.y).toBeLessThan(150);
        }
      }
    });
  }
});
