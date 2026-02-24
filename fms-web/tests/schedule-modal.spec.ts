import { test, expect } from '@playwright/test';

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button:has-text("로그인")');
  await page.waitForTimeout(5000);
}

test.describe.serial('스케줄 조회 팝업 + 찾기 버튼 테스트', () => {

  test('스케줄 검색 팝업 - 찾기 버튼 3개 존재 + 날짜 기본값', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 스케줄 검색 버튼 클릭
    const scheduleBtn = page.locator('button:has-text("스케줄 검색")');
    await expect(scheduleBtn).toBeVisible({ timeout: 5000 });
    await scheduleBtn.dispatchEvent('click');
    await page.waitForTimeout(2000);

    // 팝업 헤더 확인
    const modalHeader = page.locator('h2:has-text("항공 스케줄 조회")');
    await expect(modalHeader).toBeVisible({ timeout: 10000 });

    // 팝업 내 "찾기" 버튼 3개 확인 (출발공항, 도착공항, 항공사)
    const modal = page.locator('.fixed.inset-0');
    const findButtons = modal.locator('button:has-text("찾기")');
    const count = await findButtons.count();
    console.log(`스케줄 팝업 내 찾기 버튼 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(3);

    // ETD From/To 날짜 기본값 확인
    const dateInputs = modal.locator('input[type="date"]');
    const dateFromValue = await dateInputs.nth(0).inputValue();
    const dateToValue = await dateInputs.nth(1).inputValue();
    expect(dateFromValue).toBe(getToday());
    expect(dateToValue).toBe(getToday());

    await page.screenshot({ path: 'tests/screenshots/schedule-modal-buttons.png', fullPage: true });
  });

  test('스케줄 팝업 - 출발공항 찾기 → LocationCodeModal', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 스케줄 검색 팝업 열기
    await page.locator('button:has-text("스케줄 검색")').dispatchEvent('click');
    await page.waitForTimeout(2000);
    await expect(page.locator('h2:has-text("항공 스케줄 조회")')).toBeVisible({ timeout: 10000 });

    // 첫 번째 찾기 버튼 (출발공항) 클릭
    const modal = page.locator('.fixed.inset-0').first();
    const findButtons = modal.locator('button:has-text("찾기")');
    await findButtons.nth(0).dispatchEvent('click');
    await page.waitForTimeout(1000);

    // LocationCodeModal 팝업 확인
    await expect(page.locator('h2:has-text("출발지/도착지 코드 조회")')).toBeVisible({ timeout: 5000 });
  });

  test('스케줄 팝업 - 항공사 찾기 → AirlineCodeModal', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 스케줄 검색 팝업 열기
    await page.locator('button:has-text("스케줄 검색")').dispatchEvent('click');
    await page.waitForTimeout(2000);
    await expect(page.locator('h2:has-text("항공 스케줄 조회")')).toBeVisible({ timeout: 10000 });

    // 세 번째 찾기 버튼 (항공사) 클릭
    const modal = page.locator('.fixed.inset-0').first();
    const findButtons = modal.locator('button:has-text("찾기")');
    await findButtons.nth(2).dispatchEvent('click');
    await page.waitForTimeout(1000);

    // AirlineCodeModal 팝업 확인
    await expect(page.locator('h2:has-text("항공사 코드 조회")')).toBeVisible({ timeout: 5000 });
  });

  test('항공 부킹 등록 - 항공사 찾기 버튼 존재', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 항공사 라벨 옆 찾기 버튼 확인
    const airlineSection = page.locator('label:has-text("항공사")').first().locator('..');
    const findBtn = airlineSection.locator('button:has-text("찾기")');
    await expect(findBtn).toBeVisible({ timeout: 5000 });
  });

  test('항공 멀티부킹 - 항공사/출발/도착 찾기 버튼 존재', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/multi-register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 찾기 버튼 4개 확인 (항공사, 출발공항, 도착공항, 경유지)
    const findButtons = page.locator('button:has-text("찾기")');
    const count = await findButtons.count();
    console.log(`항공 멀티부킹 찾기 버튼 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(4);

    await page.screenshot({ path: 'tests/screenshots/multi-air-buttons.png', fullPage: true });
  });

  test('해상 멀티부킹 - 선사/POL/POD/최종목적지 찾기 버튼 존재', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/sea/multi-register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 찾기 버튼 4개 확인 (선사, POL, POD, 최종목적지)
    const findButtons = page.locator('button:has-text("찾기")');
    const count = await findButtons.count();
    console.log(`해상 멀티부킹 찾기 버튼 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(4);

    await page.screenshot({ path: 'tests/screenshots/multi-sea-buttons.png', fullPage: true });
  });
});
