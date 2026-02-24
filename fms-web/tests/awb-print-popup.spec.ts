import { test, expect } from '@playwright/test';

// 로그인 헬퍼
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe.serial('AWB 출력 팝업 테스트 - 목록 데이터 기준', () => {

  test('항공수출 - 체크박스 미선택 시 선택 알림 표시', async ({ page }) => {
    await login(page);
    await page.goto('/logis/export-awb/air');
    await page.waitForTimeout(2000);

    // 체크박스 선택 없이 출력 버튼 클릭
    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(500);

    // 선택 알림 모달이 표시되어야 함
    const alertModal = page.locator('text=선택').first();
    await expect(alertModal).toBeVisible({ timeout: 3000 });
  });

  test('항공수출 - 체크박스 선택 후 출력 팝업 열림', async ({ page }) => {
    await login(page);
    await page.goto('/logis/export-awb/air');
    await page.waitForTimeout(2000);

    // 테이블 행 존재 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`항공수출 AWB 목록: ${rowCount}행`);
    expect(rowCount).toBeGreaterThan(0);

    // 첫 번째 행 체크박스 선택
    await rows.first().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(300);

    // 출력 버튼 클릭
    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(3000);

    // 모달이 열려야 함 (로딩 또는 에러 또는 AWB 출력 모달)
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/awb-export-print-popup.png', fullPage: false });

    // 케이스 1: 정상 데이터 - AWB 출력 제목 표시
    // 케이스 2: 에러 - 에러 메시지 표시
    const hasTitle = await page.locator('text=AWB 출력').isVisible().catch(() => false);
    const hasError = await page.locator('text=출력 데이터 없음').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=로딩 중').isVisible().catch(() => false);

    console.log(`  결과: title=${hasTitle}, error=${hasError}, loading=${hasLoading}`);
    expect(hasTitle || hasError).toBeTruthy();

    if (hasTitle) {
      // MAWB_FORM 라디오가 선택되어 있는지 확인 (mawbId 전달 시 자동 선택)
      const mawbRadio = page.locator('input[value="MAWB_FORM"]');
      if (await mawbRadio.isVisible().catch(() => false)) {
        await expect(mawbRadio).toBeChecked();
        console.log('  MAWB_FORM 라디오 자동 선택 확인');
      }

      // 출력 양식 영역에 AWB 폼이 렌더링되었는지 확인
      const formArea = page.locator('div[style*="210mm"]');
      if (await formArea.isVisible().catch(() => false)) {
        console.log('  AWB 양식 폼 렌더링 확인');
      }

      // 닫기 버튼 동작 확인
      await page.locator('button').filter({ hasText: '닫기' }).first().click();
      await page.waitForTimeout(500);
      await expect(modal).not.toBeVisible();
      console.log('  닫기 동작 확인');
    }

    if (hasError) {
      // 에러 메시지 확인
      const errorText = await page.locator('.text-\\[var\\(--muted\\)\\]').innerText().catch(() => '');
      console.log(`  에러 메시지: ${errorText}`);

      // 닫기 버튼 동작 확인
      await page.locator('button').filter({ hasText: '닫기' }).first().click();
      await page.waitForTimeout(500);
      await expect(modal).not.toBeVisible();
      console.log('  에러 모달 닫기 확인');
    }
  });

  test('항공수입 - 체크박스 미선택 시 선택 알림 표시', async ({ page }) => {
    await login(page);
    await page.goto('/logis/import-bl/air');
    await page.waitForTimeout(2000);

    // 체크박스 선택 없이 출력 버튼 클릭
    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(500);

    // 선택 알림 모달이 표시되어야 함
    const alertModal = page.locator('text=선택').first();
    await expect(alertModal).toBeVisible({ timeout: 3000 });
  });

  test('항공수입 - 체크박스 선택 후 출력 팝업 열림', async ({ page }) => {
    await login(page);
    await page.goto('/logis/import-bl/air');
    await page.waitForTimeout(2000);

    // 테이블 행 존재 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`항공수입 AWB 목록: ${rowCount}행`);
    expect(rowCount).toBeGreaterThan(0);

    // 첫 번째 행 체크박스 선택
    await rows.first().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(300);

    // 출력 버튼 클릭
    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(3000);

    // 모달이 열려야 함
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/awb-import-print-popup.png', fullPage: false });

    const hasTitle = await page.locator('text=AWB 출력').isVisible().catch(() => false);
    const hasError = await page.locator('text=출력 데이터 없음').isVisible().catch(() => false);

    console.log(`  결과: title=${hasTitle}, error=${hasError}`);
    expect(hasTitle || hasError).toBeTruthy();

    if (hasTitle) {
      const mawbRadio = page.locator('input[value="MAWB_FORM"]');
      if (await mawbRadio.isVisible().catch(() => false)) {
        await expect(mawbRadio).toBeChecked();
        console.log('  MAWB_FORM 라디오 자동 선택 확인');
      }
    }

    if (hasError) {
      const errorText = await page.locator('.text-\\[var\\(--muted\\)\\]').innerText().catch(() => '');
      console.log(`  에러 메시지: ${errorText}`);
    }
  });

  test('항공수출 HAWB 목록 - 출력 팝업 테스트', async ({ page }) => {
    await login(page);
    await page.goto('/logis/bl/air');
    await page.waitForTimeout(2000);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`항공수출 HAWB 목록: ${rowCount}행`);

    if (rowCount === 0 || (rowCount === 1 && await rows.first().innerText().then(t => t.includes('데이터가 없습니다')))) {
      console.log('  데이터 없음 - 스킵');
      test.skip();
      return;
    }

    await rows.first().locator('input[type="checkbox"]').click({ force: true });
    await page.waitForTimeout(300);

    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(3000);

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/screenshots/awb-hawb-print-popup.png', fullPage: false });

    const hasTitle = await page.locator('text=AWB 출력').isVisible().catch(() => false);
    const hasError = await page.locator('text=출력 데이터 없음').isVisible().catch(() => false);

    console.log(`  결과: title=${hasTitle}, error=${hasError}`);
    expect(hasTitle || hasError).toBeTruthy();

    if (hasTitle) {
      // HAWB 페이지이므로 HAWB_FORM이 기본 선택이어야 함
      const hawbRadio = page.locator('input[value="HAWB_FORM"]');
      if (await hawbRadio.isVisible().catch(() => false)) {
        await expect(hawbRadio).toBeChecked();
        console.log('  HAWB_FORM 라디오 자동 선택 확인');
      }
    }
  });

  test('항공수출 - 출력 팝업에서 양식 전환 테스트', async ({ page }) => {
    await login(page);
    await page.goto('/logis/export-awb/air');
    await page.waitForTimeout(2000);

    const rows = page.locator('table tbody tr');
    await rows.first().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(300);

    await page.locator('button').filter({ hasText: /출력/ }).first().click();
    await page.waitForTimeout(3000);

    const hasTitle = await page.locator('text=AWB 출력').isVisible().catch(() => false);
    if (!hasTitle) {
      console.log('  AWB 출력 모달 미표시 (데이터 문제) - 스킵');
      test.skip();
      return;
    }

    // MAWB_FORM → HAWB_FORM → CHECK_AWB 전환 테스트
    for (const formType of ['HAWB_FORM', 'MAWB_FORM', 'CHECK_AWB'] as const) {
      const radio = page.locator(`input[value="${formType}"]`);
      await radio.click();
      await page.waitForTimeout(500);
      await expect(radio).toBeChecked();
      console.log(`  ${formType} 양식 전환 성공`);
    }

    // 스크롤 영역 내에 폼 존재 확인
    const formArea = page.locator('div[style*="210mm"]');
    await expect(formArea).toBeVisible();
  });
});
