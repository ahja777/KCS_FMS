import { test, expect } from '@playwright/test';

test.describe('S/R HOUSE B/L CONSOLE 팝업 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('HOUSE B/L CONSOLE 버튼 클릭 → 팝업 열림 확인', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // HOUSE B/L CONSOLE 버튼 클릭
    await page.locator('button:has-text("HOUSE B/L CONSOLE")').click();
    await page.waitForTimeout(1500);

    const modal = page.locator('.fixed.inset-0');

    // 전체 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-hbl-console-popup.png', fullPage: false });

    // 검색영역 확대 스크린샷
    const modalContent = modal.locator('div.bg-gray-50.rounded-lg').first();
    const box = await modalContent.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'tests/screenshots/sr-hbl-console-search-area.png',
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(280, box.height) }
      });
    }

    // 팝업 제목 확인
    await expect(page.locator('text=B/L CONSOLE 팝업').first()).toBeVisible();

    // 검색조건 필드 확인
    await expect(page.locator('text=등록일자').first()).toBeVisible();
    await expect(page.locator('text=거래처').first()).toBeVisible();
    await expect(page.locator('text=B/L Type').first()).toBeVisible();
    await expect(page.locator('text=Origin').first()).toBeVisible();
    await expect(page.locator('text=Destn').first()).toBeVisible();
    await expect(page.locator('text=Console').first()).toBeVisible();
    await expect(page.locator('text=입력사원').first()).toBeVisible();

    // 날짜 기간 버튼 확인 - 당일 포함
    await expect(modal.locator('button:has-text("당일")')).toBeVisible();
    await expect(modal.locator('button:has-text("1주일")')).toBeVisible();
    await expect(modal.locator('button:has-text("1개월")')).toBeVisible();
    await expect(modal.locator('button:has-text("3개월")')).toBeVisible();
    await expect(modal.locator('button:has-text("6개월")')).toBeVisible();
    await expect(modal.locator('button:has-text("1년")')).toBeVisible();

    // 전체선택 체크박스 좌측 배치 확인
    await expect(modal.locator('text=전체선택')).toBeVisible();

    // 테이블 컬럼 헤더 확인
    await expect(page.locator('th:has-text("S/R.No")').first()).toBeVisible();
    await expect(page.locator('th:has-text("M.B/L No.")').first()).toBeVisible();
    await expect(page.locator('th:has-text("H.B/L No.")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Shipper")').first()).toBeVisible();
    await expect(page.locator('th:has-text("G.WT")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Vessel")').first()).toBeVisible();

    // 찾기 버튼(SearchIconButton) 3개 확인 (거래처/Origin/Destn)
    const searchBtns = modal.locator('button[aria-label="찾기"]');
    await expect(searchBtns).toHaveCount(3);

    // 조회/초기화/닫기/적용 버튼 확인
    await expect(modal.locator('button:has-text("조회")')).toBeVisible();
    await expect(modal.locator('button:has-text("초기화")')).toBeVisible();
    await expect(modal.locator('button:has-text("닫기")')).toBeVisible();
    await expect(modal.locator('button:has-text("적용")')).toBeVisible();
  });

  test('닫기 버튼으로 팝업 닫기', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // 팝업 열기
    await page.locator('button:has-text("HOUSE B/L CONSOLE")').click();
    await page.waitForTimeout(1000);

    // 팝업이 열려있는지 확인
    await expect(page.locator('text=B/L CONSOLE 팝업').first()).toBeVisible();

    // 모달 내부의 닫기 버튼 클릭
    const modal = page.locator('.fixed.inset-0');
    await modal.locator('button:has-text("닫기")').click();
    await page.waitForTimeout(500);

    // 팝업이 닫혔는지 확인
    await expect(page.locator('text=B/L CONSOLE 팝업')).not.toBeVisible();
  });

  test('기간 버튼 동작 확인 (당일/3개월)', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // 팝업 열기
    await page.locator('button:has-text("HOUSE B/L CONSOLE")').click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.fixed.inset-0');

    // 당일 버튼 클릭
    await modal.locator('button:has-text("당일")').click();
    await page.waitForTimeout(300);

    // 시작일=종료일=오늘 확인
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = modal.locator('input[type="date"]');
    const fromVal = await dateInputs.first().inputValue();
    const toVal = await dateInputs.nth(1).inputValue();
    expect(fromVal).toBe(today);
    expect(toVal).toBe(today);

    // 3개월 버튼 클릭
    await modal.locator('button:has-text("3개월")').click();
    await page.waitForTimeout(300);

    const fromVal2 = await dateInputs.first().inputValue();
    expect(fromVal2).not.toBe('');
    expect(fromVal2).not.toBe(today); // 3개월 전이므로 오늘과 다름

    await page.screenshot({ path: 'tests/screenshots/sr-hbl-console-3month.png', fullPage: false });
  });
});
