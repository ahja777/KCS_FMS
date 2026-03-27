import { test, expect } from '@playwright/test';

test.describe('S/R 등록 - 저장 후 화면 유지 & 신규 버튼 비활성화 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('신규 모드에서 신규 버튼이 비활성화 상태인지 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // 신규 버튼 존재 확인
    const newBtn = page.locator('button:has-text("신규")').first();
    await expect(newBtn).toBeVisible();

    // 신규 모드에서 신규 버튼 비활성화
    await expect(newBtn).toBeDisabled();

    await page.screenshot({ path: 'tests/screenshots/sr-register-new-btn-disabled.png', fullPage: false });
  });

  test('저장 후 화면 유지 + 수정모드 전환 확인', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/sr/sea/register');
    await page.waitForTimeout(2000);

    // dialog 자동 확인
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });

    // SHIPPER 필드 입력 (저장 필수 필드)
    const shipperRow = page.locator('th:has-text("SHIPPER")').first().locator('..');
    const shipperInput = shipperRow.locator('td input[type="text"]').first();
    if (await shipperInput.count() > 0) {
      await shipperInput.fill('테스트화주-저장유지');
    }

    // 저장 전 URL 확인 (쿼리 없음)
    const urlBefore = page.url();
    expect(urlBefore).toContain('/logis/sr/sea/register');
    expect(urlBefore).not.toContain('id=');

    // 저장 버튼 클릭
    await page.locator('button:has-text("저장")').first().click();
    await page.waitForTimeout(3000);

    // 저장 후 화면 유지 확인 (목록으로 이동하지 않음)
    const urlAfter = page.url();
    expect(urlAfter).toContain('/logis/sr/sea/register');
    // 수정모드로 전환되어 id= 파라미터가 있어야 함
    expect(urlAfter).toContain('id=');

    // 신규 버튼이 활성화되었는지 확인 (수정 모드)
    const newBtn = page.locator('button:has-text("신규")').first();
    await expect(newBtn).toBeEnabled();

    await page.screenshot({ path: 'tests/screenshots/sr-register-after-save-stay.png', fullPage: false });
  });

  test('수정모드에서 신규 버튼 클릭 → 폼 초기화', async ({ page }) => {
    // 먼저 목록에서 기존 데이터 클릭하여 수정 모드 진입
    await page.goto('http://localhost:3600/logis/sr/sea');
    await page.waitForTimeout(2000);

    // 조회 버튼 클릭
    await page.locator('button:has-text("조회")').first().click();
    await page.waitForTimeout(2000);

    // 첫 번째 데이터 행 클릭 (있으면)
    const firstRow = page.locator('table tbody tr').first();
    const rowCount = await page.locator('table tbody tr').count();

    if (rowCount > 0) {
      // 행 클릭으로 상세 이동
      const firstCell = firstRow.locator('td').nth(1);
      const cellText = await firstCell.textContent();

      if (cellText && cellText !== '-' && !cellText.includes('데이터가 없습니다')) {
        await firstRow.click();
        await page.waitForTimeout(2000);

        // 상세 또는 수정 화면에서 수정 버튼이 있으면 클릭
        const editBtn = page.locator('button:has-text("수정")');
        if (await editBtn.count() > 0) {
          await editBtn.first().click();
          await page.waitForTimeout(2000);
        }

        // 수정 모드인지 확인 (register 페이지에 id= 파라미터)
        const currentUrl = page.url();
        if (currentUrl.includes('/logis/sr/sea/register') && currentUrl.includes('id=')) {
          // 신규 버튼이 활성화 상태인지 확인
          const newBtn = page.locator('button:has-text("신규")').first();
          await expect(newBtn).toBeEnabled();

          // dialog 확인
          page.on('dialog', async dialog => {
            await dialog.accept();
          });

          // 신규 버튼 클릭
          await newBtn.click();
          await page.waitForTimeout(2000);

          // 신규 등록 화면으로 전환 확인
          const newUrl = page.url();
          expect(newUrl).toContain('/logis/sr/sea/register');
          expect(newUrl).not.toContain('id=');

          // 신규 버튼이 다시 비활성화
          await expect(page.locator('button:has-text("신규")').first()).toBeDisabled();

          await page.screenshot({ path: 'tests/screenshots/sr-register-new-after-click.png', fullPage: false });
        }
      }
    }
  });
});
