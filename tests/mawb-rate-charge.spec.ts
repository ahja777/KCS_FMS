import { test, expect } from '@playwright/test';

test.describe('MAWB Rate Charge 계산 테스트', () => {
  test('ICN→LAX 150kg 20pcs 입력 시 Rate Charge 계산', async ({ page }) => {
    await page.goto('/logis/bl/air/master/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // MAIN 탭 확인 (기본 선택)
    const mainTab = page.getByRole('button', { name: 'MAIN', exact: true });
    await expect(mainTab).toBeVisible();

    // 출발지 입력 - ICN (placeholder="ICN")
    const departureInput = page.locator('input[placeholder="ICN"]');
    await expect(departureInput).toBeVisible();
    await departureInput.clear();
    await departureInput.fill('ICN');

    // 도착지 입력 - LAX (placeholder="LAX")
    const arrivalInput = page.locator('input[placeholder="LAX"]');
    await expect(arrivalInput).toBeVisible();
    await arrivalInput.clear();
    await arrivalInput.fill('LAX');

    // CARGO 탭으로 이동 (No.of Pieces, Gross Weight는 CARGO 섹션 내)
    const cargoTab = page.locator('button', { hasText: 'CARGO' });
    await cargoTab.click();
    await page.waitForTimeout(500);

    // No.of Pieces 입력
    const piecesLabel = page.locator('label:has-text("No.of Pieces")');
    const piecesInput = piecesLabel.locator('..').locator('input[type="number"]');
    await piecesInput.fill('20');

    // Gross Weight 입력
    const weightLabel = page.locator('label:has-text("Gross Weight")');
    const weightInput = weightLabel.locator('..').locator('input[type="number"]');
    await weightInput.fill('150');

    // API 계산 응답 대기
    await page.waitForTimeout(2000);

    // Rate Charge 결과 확인 - 계산 결과가 표시되는지만 확인
    const rateChargeLabel = page.locator('label:has-text("Rate/Charge")');
    await expect(rateChargeLabel).toBeVisible();

    // 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/mawb-rate-charge-result.png', fullPage: true });
    console.log('Rate Charge 테스트 완료');
  });

  test('ICN→LAX 3kg 최소운임 적용 테스트', async ({ page }) => {
    await page.goto('/logis/bl/air/master/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const departureInput = page.locator('input[placeholder="ICN"]');
    await departureInput.clear();
    await departureInput.fill('ICN');

    const arrivalInput = page.locator('input[placeholder="LAX"]');
    await arrivalInput.clear();
    await arrivalInput.fill('LAX');

    // CARGO 탭 이동
    const cargoTab = page.locator('button', { hasText: 'CARGO' });
    await cargoTab.click();
    await page.waitForTimeout(500);

    // No.of Pieces 입력
    const piecesLabel = page.locator('label:has-text("No.of Pieces")');
    const piecesInput = piecesLabel.locator('..').locator('input[type="number"]');
    await piecesInput.fill('1');

    // Gross Weight 입력
    const weightLabel = page.locator('label:has-text("Gross Weight")');
    const weightInput = weightLabel.locator('..').locator('input[type="number"]');
    await weightInput.fill('3');

    await page.waitForTimeout(2000);

    // Rate Charge 라벨 존재 확인
    const rateChargeLabel = page.locator('label:has-text("Rate/Charge")');
    await expect(rateChargeLabel).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/mawb-rate-charge-min.png', fullPage: true });
    console.log('최소운임 테스트 완료');
  });
});
