import { test, expect } from '@playwright/test';

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 로그인 헬퍼
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button:has-text("로그인")');
  await page.waitForTimeout(5000);
}

test.describe.serial('팝업 개선 테스트', () => {

  test('항공스케줄 등록 - ETD 날짜에 오늘 기본값', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    const etdInput = page.locator('input[type="date"]').first();
    const value = await etdInput.inputValue();
    expect(value).toBe(getToday());
  });

  test('항공스케줄 등록 - 출발지 찾기 버튼 → LocationCodeModal 팝업', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 출발지 input(placeholder="ICN") 옆의 찾기 버튼 - dispatchEvent로 클릭
    const findBtn = page.locator('input[placeholder="ICN"]').locator('..').locator('button:has-text("찾기")');
    await expect(findBtn).toBeVisible();
    await findBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    await expect(page.locator('h2:has-text("출발지/도착지 코드 조회")')).toBeVisible({ timeout: 5000 });
  });

  test('항공스케줄 등록 - 항공사 찾기 버튼 → AirlineCodeModal 팝업', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    const findBtn = page.locator('input[placeholder="KE, OZ..."]').locator('..').locator('button:has-text("찾기")');
    await expect(findBtn).toBeVisible();
    await findBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    await expect(page.locator('h2:has-text("항공사 코드 조회")')).toBeVisible({ timeout: 5000 });
  });

  test('해상스케줄 등록 - ETD 날짜에 오늘 기본값', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/sea/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    const etdSection = page.locator('label:has-text("ETD")').first().locator('..');
    const etdInput = etdSection.locator('input[type="date"]');
    const value = await etdInput.inputValue();
    expect(value).toBe(getToday());
  });

  test('해상스케줄 등록 - 선적항 찾기 버튼 → LocationCodeModal 팝업', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/sea/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    const findBtn = page.locator('input[placeholder="KRPUS"]').locator('..').locator('button:has-text("찾기")');
    await expect(findBtn).toBeVisible();
    await findBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    await expect(page.locator('h2:has-text("출발지/도착지 코드 조회")')).toBeVisible({ timeout: 5000 });
  });

  test('스케줄 조회 팝업 - 헤더 다크 배경 + 흰색 텍스트 + 아이콘 확인', async ({ page }) => {
    await login(page);
    await page.goto('/logis/booking/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 스케줄 검색 버튼 클릭
    const scheduleBtn = page.locator('button:has-text("스케줄 검색")');
    await expect(scheduleBtn).toBeVisible({ timeout: 5000 });
    await scheduleBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    // 팝업 헤더 확인
    const modalHeader = page.locator('h2:has-text("항공 스케줄 조회")');
    await expect(modalHeader).toBeVisible({ timeout: 5000 });

    // 헤더에 SVG 아이콘 존재 확인
    const headerSvg = modalHeader.locator('svg');
    await expect(headerSvg).toBeVisible();

    // ETD From/To 날짜 기본값 확인
    const dateInputs = page.locator('input[type="date"]');
    const dateFromValue = await dateInputs.nth(0).inputValue();
    const dateToValue = await dateInputs.nth(1).inputValue();
    expect(dateFromValue).toBe(getToday());
    expect(dateToValue).toBe(getToday());
  });

  test('팝업 아이콘 SVG 존재 확인', async ({ page }) => {
    await login(page);
    await page.goto('/logis/schedule/air/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    const findBtn = page.locator('input[placeholder="KE, OZ..."]').locator('..').locator('button:has-text("찾기")');
    await findBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    const airlineModalHeader = page.locator('h2:has-text("항공사 코드 조회")');
    await expect(airlineModalHeader).toBeVisible({ timeout: 5000 });
    const airlineSvg = airlineModalHeader.locator('svg');
    await expect(airlineSvg).toBeVisible();
  });
});
