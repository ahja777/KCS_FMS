import { test, expect } from '@playwright/test';

test('해상스케줄 조회 페이지 UI 일관성 확인', async ({ page }) => {
  // 로그인
  await page.goto('http://localhost:3600/login');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });

  // 해상스케줄 조회 페이지 이동
  await page.goto('http://localhost:3600/logis/schedule/sea');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 전체 페이지 스크린샷
  await page.screenshot({ path: 'tests/screenshots/schedule-sea-list-after.png', fullPage: true });

  // 1. 검색조건 헤더 확인
  await expect(page.locator('text=검색조건')).toBeVisible();

  // 2. 삭제 버튼 존재 확인
  const deleteBtn = page.locator('button:has-text("삭제")');
  await expect(deleteBtn).toBeVisible();

  // 3. 신규등록 버튼 존재 확인
  await expect(page.locator('button:has-text("신규등록")')).toBeVisible();

  // 4. 테이블 No 컬럼 확인
  const noHeader = page.locator('th:has-text("No")');
  await expect(noHeader).toBeVisible();

  // 5. 체크박스 존재 확인 (헤더의 전체선택)
  const headerCheckbox = page.locator('thead input[type="checkbox"]');
  await expect(headerCheckbox).toBeVisible();

  // 6. 테이블 text-sm 적용 확인
  const table = page.locator('table.table');
  const tableClass = await table.getAttribute('class');
  expect(tableClass).toContain('text-sm');

  // 7. 스케줄 목록 헤더 확인
  await expect(page.locator('text=스케줄 목록')).toBeVisible();

  // 8. 요약 통계 카드 확인 (스크롤 필요할 수 있으므로 scrollIntoView)
  const statsSection = page.locator('text=예정/부킹가능');
  await statsSection.scrollIntoViewIfNeeded();
  await expect(statsSection).toBeVisible();

  // 테이블 영역만 스크린샷
  const tableCard = page.locator('.card.overflow-hidden').first();
  if (await tableCard.isVisible()) {
    await tableCard.screenshot({ path: 'tests/screenshots/schedule-sea-table-after.png' });
  }

  console.log('해상스케줄 조회 페이지 UI 확인 완료!');
});
