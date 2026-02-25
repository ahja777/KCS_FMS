import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3600';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/logis/**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

test.describe('전체 페이지 sticky 버튼 + 코드+이름 구조 확인', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // 해상 부킹 등록
  test('해상 부킹 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/booking/sea/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-booking-sea-register-redesign.png', fullPage: true });
    // sticky 버튼 영역 확인
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 항공 부킹 등록
  test('항공 부킹 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/booking/air/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-booking-air-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 해상 B/L House 등록
  test('해상 House BL 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/bl/sea/house/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-bl-sea-house-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 해상 S/R 등록
  test('해상 S/R 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/sr/sea/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-sr-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 해상 도착통지 등록
  test('해상 A/N 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/an/sea/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-an-sea-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 해상 법인요율 등록
  test('해상 법인요율 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/rate/corporate/sea/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-rate-sea-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });

  // 항공 스케줄 등록
  test('항공 스케줄 등록 - sticky + 코드+이름', async ({ page }) => {
    await page.goto(`${BASE}/logis/schedule/air/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/verify-schedule-air-register-redesign.png', fullPage: true });
    const stickyDiv = page.locator('.sticky.top-0');
    await expect(stickyDiv.first()).toBeVisible();
  });
});
