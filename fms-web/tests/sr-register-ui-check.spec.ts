import { test, expect } from '@playwright/test';

test.describe('S/R 등록 화면 UI 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3600/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/logis/**', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('MAIN 탭 전체 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 전체 페이지 스크린샷 (MAIN 탭)
    await page.screenshot({
      path: 'tests/screenshots/sr-register-main-tab-redesign.png',
      fullPage: true
    });
  });

  test('MAIN 탭 - SHIPPER 코드+이름 2행 구조 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // SHIPPER th가 rowSpan=2인지 확인
    const shipperTh = page.locator('th', { hasText: 'SHIPPER' });
    await expect(shipperTh).toBeVisible();

    // SHIPPER 코드 입력 필드
    const shipperCodeInput = page.locator('input[placeholder="코드"]').first();
    await expect(shipperCodeInput).toBeVisible();

    // SHIPPER 이름 입력 필드
    const shipperNameInput = page.locator('input[placeholder="이름/상호"]').first();
    await expect(shipperNameInput).toBeVisible();

    // Main Information 영역만 스크린샷
    const mainInfo = page.locator('text=Main Information').locator('..').locator('..');
    await mainInfo.screenshot({ path: 'tests/screenshots/sr-main-info-section.png' });
  });

  test('MAIN 탭 - Schedule POL [코드][찾기][이름] 3칸 구조 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // POL 코드 필드 확인 (80px 너비)
    const polSection = page.locator('th', { hasText: 'Port of Loading' }).locator('..').locator('td').first();

    // 코드 input, 찾기 버튼, 이름 input 3개 존재 확인
    const polInputs = polSection.locator('input');
    await expect(polInputs).toHaveCount(2); // 코드 + 이름

    // Schedule Information 영역 스크린샷
    const scheduleInfo = page.locator('text=Schedule Information').locator('..').locator('..');
    await scheduleInfo.screenshot({ path: 'tests/screenshots/sr-schedule-info-section.png' });
  });

  test('MAIN 탭 - Freight Term 변경시 CY/CFS 자동연동 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 초기값: FCL/FCL → CY/CY
    const cyCfsSelect = page.locator('select:disabled');
    await expect(cyCfsSelect.first()).toHaveValue('CY/CY');

    // Freight Term을 LCL/LCL로 변경
    const freightSelect = page.locator('th', { hasText: 'Freight Term' }).locator('..').locator('select').first();
    await freightSelect.selectOption('LCL/LCL');
    await page.waitForTimeout(200);

    // CY/CFS가 CFS/CFS로 자동 변경 확인
    await expect(cyCfsSelect.first()).toHaveValue('CFS/CFS');

    // FCL/LCL로 변경 테스트
    await freightSelect.selectOption('FCL/LCL');
    await page.waitForTimeout(200);
    await expect(cyCfsSelect.first()).toHaveValue('CY/CFS');
  });

  test('CARGO 탭 전체 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // CARGO 탭 클릭
    await page.click('button:has-text("CARGO")');
    await page.waitForTimeout(500);

    // CARGO 탭 전체 스크린샷
    await page.screenshot({
      path: 'tests/screenshots/sr-register-cargo-tab-redesign.png',
      fullPage: true
    });
  });

  test('CARGO 탭 - Package [수량][포장코드 CT▼] 구조 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('button:has-text("CARGO")');
    await page.waitForTimeout(500);

    // Package 포장코드 select 확인
    const packageSelect = page.locator('select').filter({ hasText: 'CT' }).first();
    await expect(packageSelect).toBeVisible();

    // 옵션 확인
    const options = packageSelect.locator('option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('CT');
    expect(optionTexts).toContain('PKG');
    expect(optionTexts).toContain('PLT');
    expect(optionTexts).toContain('PCS');
    expect(optionTexts).toContain('CS');
  });

  test('CARGO 탭 - Container 그리드 [추가][삭제] 한글 + 체크박스 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('button:has-text("CARGO")');
    await page.waitForTimeout(500);

    // 한글 버튼 확인
    const addBtn = page.locator('button:has-text("추가")');
    const delBtn = page.locator('button:has-text("삭제")');
    await expect(addBtn).toBeVisible();
    await expect(delBtn).toBeVisible();

    // 행 추가
    await addBtn.click();
    await addBtn.click();
    await page.waitForTimeout(300);

    // 체크박스 확인 - Container Information 영역 내에서 찾기
    const containerSection = page.locator('text=Container Information').locator('..').locator('..');
    const checkboxes = containerSection.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(3); // 전체선택 + 2개 행

    // 첫번째 행 체크
    await checkboxes.nth(1).check();
    await page.waitForTimeout(200);

    // Container 그리드 영역 스크린샷
    await page.screenshot({
      path: 'tests/screenshots/sr-container-grid-redesign.png',
      fullPage: true
    });

    // 선택 삭제 테스트
    await delBtn.click();
    await page.waitForTimeout(200);

    // 1행만 남아야 함
    const remainingCheckboxes = containerSection.locator('input[type="checkbox"]');
    await expect(remainingCheckboxes).toHaveCount(2); // 전체선택 + 1행
  });

  test('CARGO 탭 - Total 합계 영역 readOnly 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('button:has-text("CARGO")');
    await page.waitForTimeout(500);

    // Total 합계 영역 - 하단 bg-gray-50 영역 내의 readOnly input들 확인
    const totalSection = page.locator('.bg-gray-50').last();
    const readonlyInputs = totalSection.locator('input[readonly]');
    // Total H B/L List + Total Package + Total Gross Weight + Total Measurement = 4개
    await expect(readonlyInputs).toHaveCount(4);
  });
});
