import { test, expect } from '@playwright/test';

const SCHEDULE_PAGES = [
  { path: '/logis/schedule/sea', name: '해상 스케줄' },
  { path: '/logis/schedule/air', name: '항공 스케줄' },
];

test.describe('스케줄 조회 페이지 UI 일관성 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  for (const { path, name } of SCHEDULE_PAGES) {
    test(`${name} 조회 페이지 - 체크박스/No컬럼/삭제버튼/글자크기 확인`, async ({ page }) => {
      await page.goto(`http://localhost:3600${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // 1. 검색조건 헤더
      await expect(page.locator('text=검색조건')).toBeVisible();

      // 2. 삭제 버튼
      const deleteBtn = page.locator('button:has-text("삭제")');
      await expect(deleteBtn).toBeVisible();

      // 3. 신규등록 버튼
      await expect(page.locator('button:has-text("신규등록")')).toBeVisible();

      // 4. No 컬럼
      await expect(page.locator('th:has-text("No")')).toBeVisible();

      // 5. 전체선택 체크박스
      await expect(page.locator('thead input[type="checkbox"]')).toBeVisible();

      // 6. table.table 클래스 존재 (CSS에서 font-size:14px 적용)
      const table = page.locator('table.table');
      await expect(table).toBeVisible();

      // 7. 스케줄 목록 헤더
      await expect(page.locator('text=스케줄 목록')).toBeVisible();

      // 스크린샷
      const safeName = path.replace(/\//g, '-').replace(/^-/, '');
      await page.screenshot({ path: `tests/screenshots/${safeName}-final.png`, fullPage: true });

      console.log(`${name} 조회 페이지 UI 확인 완료!`);
    });
  }
});
