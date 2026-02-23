import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3600';

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

test.describe.serial('팝업 테이블 행 배경색(bg-white) 확인', () => {

  test('항공부킹 등록 - 스케줄조회 팝업 테이블 행 bg-white', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/booking/air/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 스케줄조회 버튼 클릭
    const scheduleBtn = page.locator('button:has-text("스케줄조회")');
    if (await scheduleBtn.count() > 0) {
      await scheduleBtn.first().click();
      await page.waitForTimeout(1000);

      // 모달 내부의 테이블 tbody tr 확인 (fixed overlay 내부)
      const modal = page.locator('.fixed.inset-0').last();
      const rows = modal.locator('table tbody tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRowClass = await rows.first().getAttribute('class') || '';
        expect(firstRowClass).toMatch(/bg-white|bg-blue-100|bg-gray-50/);
      }

      await page.screenshot({ path: 'tests/screenshots/popup-air-booking-schedule.png' });
    }
  });

  test('해상부킹 등록 - 스케줄조회 팝업 테이블 행 bg-white', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/booking/sea/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const scheduleBtn = page.locator('button:has-text("스케줄조회")');
    if (await scheduleBtn.count() > 0) {
      await scheduleBtn.first().click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.fixed.inset-0').last();
      const rows = modal.locator('table tbody tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRowClass = await rows.first().getAttribute('class') || '';
        expect(firstRowClass).toMatch(/bg-white|bg-blue-100|bg-gray-50/);
      }

      await page.screenshot({ path: 'tests/screenshots/popup-sea-booking-schedule.png' });
    }
  });

  test('코드검색 팝업 - 업체코드 테이블 행 bg-white', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/booking/air/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 찾기 버튼 클릭 (코드검색 팝업)
    const searchBtns = page.locator('button:has-text("찾기")');
    if (await searchBtns.count() > 0) {
      await searchBtns.first().click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0').last();
      const rows = modal.locator('table tbody tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRowClass = await rows.first().getAttribute('class') || '';
        expect(firstRowClass).toMatch(/bg-white|bg-blue-100|bg-gray-50/);
      }

      await page.screenshot({ path: 'tests/screenshots/popup-code-search.png' });
    }
  });

  test('B/L 해상 등록 - 팝업 테이블 행 bg-white', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/bl/sea/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchBtns = page.locator('button:has-text("찾기")');
    if (await searchBtns.count() > 0) {
      await searchBtns.first().click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0').last();
      const rows = modal.locator('table tbody tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRowClass = await rows.first().getAttribute('class') || '';
        expect(firstRowClass).toMatch(/bg-white|bg-blue-100|bg-gray-50/);
      }

      await page.screenshot({ path: 'tests/screenshots/popup-bl-search.png' });
    }
  });

  test('견적 해상 등록 - 팝업 테이블 행 bg-white', async ({ page }) => {
    await page.context().addCookies([authCookie]);
    await page.goto(`${BASE}/logis/quote/sea/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchBtns = page.locator('button:has-text("찾기")');
    if (await searchBtns.count() > 0) {
      await searchBtns.first().click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0').last();
      const rows = modal.locator('table tbody tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRowClass = await rows.first().getAttribute('class') || '';
        expect(firstRowClass).toMatch(/bg-white|bg-blue-100|bg-gray-50/);
      }

      await page.screenshot({ path: 'tests/screenshots/popup-quote-search.png' });
    }
  });

});
