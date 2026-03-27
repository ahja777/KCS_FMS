import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3600';

// 오늘 날짜 (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0];

// 로그인 처리
let authCookie: { name: string; value: string; domain: string; path: string };

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' },
  });
  expect(res.ok()).toBeTruthy();
  const setCookie = res.headers()['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  expect(match).toBeTruthy();
  authCookie = {
    name: 'fms_auth_token',
    value: match![1],
    domain: 'localhost',
    path: '/',
  };
});

// 날짜 입력에서 value 확인하는 공통 함수
async function checkDateInputs(
  page: import('@playwright/test').Page,
  url: string,
  pageName: string,
  expectedFields: string[]
) {
  await page.context().addCookies([authCookie]);
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  for (const label of expectedFields) {
    // date input을 찾음 - 여러 방식으로 시도
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count, `${pageName}: date input이 최소 1개 존재해야 함`).toBeGreaterThan(0);

    // 첫 번째 date input의 값이 오늘 날짜인지 확인
    const firstDateValue = await dateInputs.first().inputValue();
    expect(firstDateValue, `${pageName}: 첫 번째 date input에 오늘 날짜(${today}) 기본값`).toBe(today);
    break;
  }
}

test.describe.serial('날짜 검색조건 기본값 확인 (12개 페이지)', () => {

  test('B/L 조회 (해상) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/sea`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // obDateFrom, obDateTo
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('AWB 조회 (항공) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/air`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('Master B/L 관리 (해상수출) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/sea/master`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('House B/L 관리 (해상수출) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/sea/house`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('Master AWB 관리 (항공수출) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/air/master`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('House AWB 관리 (항공수출) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/air/house`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('House B/L 관리 (해상수입) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/import-bl/sea/house`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('Master B/L 관리 (해상수입) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/import-bl/sea/master`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('House AWB 관리 (항공수입) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/import-bl/air/house`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('Master AWB 관리 (항공수입) - obDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/import-bl/air/master`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

  test('통관정산 관리 (해상) - obArDateFrom/customsDateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/customs-account/sea`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // obArDateFrom, obArDateTo, customsDateFrom, customsDateTo
    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
    expect(await dateInputs.nth(2).inputValue()).toBe(today);
    expect(await dateInputs.nth(3).inputValue()).toBe(today);
  });

  test('견적요청 관리 - dateFrom에 오늘 날짜', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/quote/request`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    expect(await dateInputs.nth(0).inputValue()).toBe(today);
    expect(await dateInputs.nth(1).inputValue()).toBe(today);
  });

});
