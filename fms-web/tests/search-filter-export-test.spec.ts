import { test, expect } from '@playwright/test';

// ========================================
// 해상수출 Master B/L 검색 테스트
// ========================================
test.describe('해상수출 Master B/L 검색', () => {
  test('Shipper 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/master');
    await page.waitForLoadState('networkidle');

    // Shipper 필드에 값 입력
    await page.locator('input[placeholder="송하인"]').fill('삼성');

    // 검색 버튼 클릭
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/export-sea-master-shipper.png', fullPage: true });

    const resultText = await page.locator('body').textContent();
    expect(resultText).toContain('총');
  });

  test('Consignee 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="수하인"]').fill('ABC');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-master-consignee.png', fullPage: true });
  });

  test('CTNR NO 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="컨테이너번호"]').fill('MSCU');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-master-ctnr.png', fullPage: true });
  });

  test('License No 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="라이센스번호"]').fill('LIC001');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-master-license.png', fullPage: true });
  });
});

// ========================================
// 해상수출 House B/L 검색 테스트
// ========================================
test.describe('해상수출 House B/L 검색', () => {
  test('Notify 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="통지처"]').fill('ABC');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-house-notify.png', fullPage: true });
  });

  test('Partner 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="파트너"]').fill('Partner');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-house-partner.png', fullPage: true });
  });

  test('CTNR NO 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="컨테이너번호"]').fill('TCLU');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-house-ctnr.png', fullPage: true });
  });
});

// ========================================
// 항공수출 Master AWB 검색 테스트
// ========================================
test.describe('항공수출 Master AWB 검색', () => {
  test('Shipper 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="송하인"]').fill('LG');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-master-shipper.png', fullPage: true });
  });

  test('Consignee 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="수하인"]').fill('Apple');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-master-consignee.png', fullPage: true });
  });

  test('Partner 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="파트너"]').fill('DHL');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-master-partner.png', fullPage: true });
  });

  test('Sales Man 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/master');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="영업담당"]').fill('김철수');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-master-salesman.png', fullPage: true });
  });
});

// ========================================
// 항공수출 House AWB 검색 테스트
// ========================================
test.describe('항공수출 House AWB 검색', () => {
  test('Destination 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="목적지"]').fill('LAX');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-house-destination.png', fullPage: true });
  });

  test('Notify 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="통지처"]').fill('Notify');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-house-notify.png', fullPage: true });
  });

  test('License No 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="라이센스번호"]').fill('AIR123');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-house-license.png', fullPage: true });
  });

  test('Sales Man 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="영업담당"]').fill('박영희');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-house-salesman.png', fullPage: true });
  });
});

// ========================================
// 복합 검색 테스트
// ========================================
test.describe('복합 검색 테스트', () => {
  test('해상수출 Master - 다중 조건 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/sea/master');
    await page.waitForLoadState('networkidle');

    // 여러 조건 입력
    await page.locator('input[placeholder="송하인"]').fill('삼성');
    await page.locator('input[placeholder="선적항"]').fill('KRPUS');

    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-sea-master-multi.png', fullPage: true });
  });

  test('항공수출 House - 다중 조건 검색', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/bl/air/house');
    await page.waitForLoadState('networkidle');

    // 여러 조건 입력
    await page.locator('input[placeholder="목적지"]').fill('NRT');
    await page.locator('input[placeholder="영업담당"]').fill('김');

    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/export-air-house-multi.png', fullPage: true });
  });
});
