import { test, expect } from '@playwright/test';

test.describe('S/R 등록 화면 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3600/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('S/R 등록 페이지 로드 및 MAIN 탭 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-register-main-tab.png', fullPage: true });

    // 페이지 제목 확인
    const title = await page.locator('text=선적요청 등록').first();
    await expect(title).toBeVisible();

    // MAIN 탭이 기본 활성 상태인지 확인
    const mainTab = page.locator('button:has-text("MAIN")');
    await expect(mainTab).toBeVisible();

    // CARGO 탭 존재 확인
    const cargoTab = page.locator('button:has-text("CARGO")');
    await expect(cargoTab).toBeVisible();

    // Main Information 섹션 확인
    const mainInfo = page.locator('text=Main Information');
    await expect(mainInfo).toBeVisible();

    // Schedule Information 섹션 확인
    const scheduleInfo = page.locator('text=Schedule Information');
    await expect(scheduleInfo).toBeVisible();

    // 주요 필드 확인
    await expect(page.locator('text=BL TYPE').first()).toBeVisible();
    await expect(page.locator('text=S/R NO').first()).toBeVisible();
    await expect(page.locator('text=SHIPPER').first()).toBeVisible();
    await expect(page.locator('text=CONSIGNEE').first()).toBeVisible();
    await expect(page.locator('text=POL').first()).toBeVisible();
    await expect(page.locator('text=POD').first()).toBeVisible();

    // 버튼들 확인
    await expect(page.locator('button:has-text("저장")').first()).toBeVisible();
    await expect(page.locator('button:has-text("목록")').first()).toBeVisible();
  });

  test('CARGO 탭 전환 및 컨테이너 테이블 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // CARGO 탭 클릭
    const cargoTab = page.locator('button:has-text("CARGO")');
    await cargoTab.click();
    await page.waitForTimeout(500);

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-register-cargo-tab.png', fullPage: true });

    // Cargo Information 섹션 확인
    await expect(page.locator('text=Cargo Information').first()).toBeVisible();

    // Container Information 섹션 확인
    await expect(page.locator('text=Container Information').first()).toBeVisible();

    // MARK 텍스트 영역 확인
    const markLabel = page.locator('th:has-text("MARK")').first();
    await expect(markLabel).toBeVisible();

    // Description 라벨 확인
    const descLabel = page.locator('th:has-text("Description")').first();
    await expect(descLabel).toBeVisible();

    // Container 20 확인
    await expect(page.locator('text=Container 20').first()).toBeVisible();

    // Container 40 확인
    await expect(page.locator('text=Container 40').first()).toBeVisible();

    // 행 추가 버튼 확인 (Add Row)
    const addRowBtn = page.locator('button:has-text("Add Row")');
    await expect(addRowBtn).toBeVisible();
  });

  test('컨테이너 행 추가/삭제 동작 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // CARGO 탭 클릭
    await page.locator('button:has-text("CARGO")').click();
    await page.waitForTimeout(500);

    // 초기: 빈 상태 메시지 1행 (컨테이너 정보가 없습니다)
    await expect(page.locator('text=컨테이너 정보가 없습니다')).toBeVisible();

    // 행 추가 클릭
    await page.locator('button:has-text("Add Row")').click();
    await page.waitForTimeout(500);

    // 행 추가 후 빈 메시지 사라지고 입력행 표시되는지 확인
    await expect(page.locator('text=컨테이너 정보가 없습니다')).not.toBeVisible();

    // 한번 더 추가
    await page.locator('button:has-text("Add Row")').click();
    await page.waitForTimeout(300);

    // 이제 2행이어야 함
    const containerTable = page.locator('table').last();
    const rows = await containerTable.locator('tbody tr').count();
    expect(rows).toBe(2);

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-register-container-rows.png', fullPage: true });
  });

  test('S/R 등록 (저장) 테스트', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // MAIN 탭 필드 입력
    // BL TYPE 선택
    const blTypeSelect = page.locator('select').first();
    await blTypeSelect.selectOption('OBL');

    // SHIPPER 입력 - th 레이블 옆 td의 input
    const shipperInput = page.locator('th:has-text("SHIPPER")').first().locator('..').locator('td input[type="text"]').first();
    if (await shipperInput.count() > 0) {
      await shipperInput.fill('테스트화주');
    }

    // CONSIGNEE 입력
    const consigneeInput = page.locator('th:has-text("CONSIGNEE")').first().locator('..').locator('td input[type="text"]').first();
    if (await consigneeInput.count() > 0) {
      await consigneeInput.fill('테스트수하인');
    }

    // POL 입력
    const polInput = page.locator('th:has-text("POL")').first().locator('..').locator('td input[type="text"]').first();
    if (await polInput.count() > 0) {
      await polInput.fill('KRPUS');
    }

    // POD 입력
    const podInput = page.locator('th:has-text("POD")').first().locator('..').locator('td input[type="text"]').first();
    if (await podInput.count() > 0) {
      await podInput.fill('USLAX');
    }

    // CARGO 탭 전환
    await page.locator('button:has-text("CARGO")').click();
    await page.waitForTimeout(500);

    // Package 입력
    const pkgInputs = page.locator('input[type="number"]');
    const pkgCount = await pkgInputs.count();
    if (pkgCount > 0) {
      await pkgInputs.first().fill('100');
    }

    await page.screenshot({ path: 'tests/screenshots/sr-register-before-save.png', fullPage: true });

    // 저장 버튼 클릭
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });

    await page.locator('button:has-text("저장")').first().click();
    await page.waitForTimeout(3000);

    // 저장 결과 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-register-after-save.png', fullPage: true });
  });

  test('S/R 목록 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea');
    await page.waitForTimeout(2000);

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/sr-list-page.png', fullPage: true });

    // 검색조건 확인
    await expect(page.locator('text=검색조건').first()).toBeVisible();

    // B/L TYPE 필터 확인
    await expect(page.locator('text=B/L TYPE').first()).toBeVisible();

    // 조회 버튼 확인
    await expect(page.locator('button:has-text("조회")').first()).toBeVisible();

    // 신규 버튼 확인
    await expect(page.locator('button:has-text("신규")').first()).toBeVisible();

    // S/R 목록 테이블 확인
    await expect(page.locator('text=Shipping Request').first()).toBeVisible();

    // House B/L List 하단 섹션 확인
    await expect(page.locator('text=House B/L List').first()).toBeVisible();
  });
});
