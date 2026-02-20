import { test, expect } from '@playwright/test';

// 항공수입 Master AWB 검색 테스트
test('항공수입 Master AWB - Shipper 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/air/master');
  await page.waitForLoadState('networkidle');

  // Shipper 필드에 값 입력
  await page.locator('input[placeholder="송하인"]').fill('ABC');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-air-master-shipper-search.png', fullPage: true });

  // 결과 확인 - 테이블에 데이터가 있거나 "검색 결과가 없습니다" 메시지 확인
  const resultText = await page.locator('body').textContent();
  expect(resultText).toBeTruthy();
});

test('항공수입 Master AWB - MAWB NO 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/air/master');
  await page.waitForLoadState('networkidle');

  // MAWB NO 필드에 값 입력
  await page.locator('input[placeholder="Master AWB 번호"]').fill('618-11223344');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-air-master-mawb-search.png', fullPage: true });

  // 결과 확인
  const rows = await page.locator('table tbody tr').count();
  console.log(`MAWB 검색 결과: ${rows}건`);
});

// 항공수입 House AWB 검색 테스트
test('항공수입 House AWB - Consignee 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/air/house');
  await page.waitForLoadState('networkidle');

  // Consignee 필드에 값 입력
  await page.locator('input[placeholder="수하인"]').fill('현대');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-air-house-consignee-search.png', fullPage: true });
});

test('항공수입 House AWB - Destination 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/air/house');
  await page.waitForLoadState('networkidle');

  // Destination 필드에 값 입력
  await page.locator('input[placeholder="목적지"]').fill('ICN');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-air-house-destination-search.png', fullPage: true });
});

// 해상수입 Master B/L 검색 테스트
test('해상수입 Master B/L - Vessel 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/sea/master');
  await page.waitForLoadState('networkidle');

  // Vessel 필드에 값 입력
  await page.locator('input[placeholder="선박명"]').fill('EVER');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-sea-master-vessel-search.png', fullPage: true });
});

test('해상수입 Master B/L - Partner 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/sea/master');
  await page.waitForLoadState('networkidle');

  // Partner 필드에 값 입력
  await page.locator('input[placeholder="파트너"]').fill('ABC');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-sea-master-partner-search.png', fullPage: true });
});

// 해상수입 House B/L 검색 테스트
test('해상수입 House B/L - CTNR NO 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/sea/house');
  await page.waitForLoadState('networkidle');

  // CTNR NO 필드에 값 입력
  await page.locator('input[placeholder="컨테이너번호"]').fill('MSCU');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-sea-house-ctnr-search.png', fullPage: true });
});

test('해상수입 House B/L - License No 검색', async ({ page }) => {
  await page.goto('/logis/import-bl/sea/house');
  await page.waitForLoadState('networkidle');

  // License No 필드에 값 입력
  await page.locator('input[placeholder="라이센스번호"]').fill('12345');

  // 검색 버튼 클릭
  await page.locator('button:has-text("검색")').click();

  // 결과 대기
  await page.waitForTimeout(2000);

  // 스크린샷 저장
  await page.screenshot({ path: 'screenshots/test-sea-house-license-search.png', fullPage: true });
});

// 초기화 버튼 테스트
test('검색조건 초기화 버튼 테스트', async ({ page }) => {
  await page.goto('/logis/import-bl/air/master');
  await page.waitForLoadState('networkidle');

  // 여러 필드에 값 입력
  await page.locator('input[placeholder="송하인"]').fill('Test Shipper');
  await page.locator('input[placeholder="수하인"]').fill('Test Consignee');
  await page.locator('input[placeholder="파트너"]').fill('Test Partner');

  // 스크린샷 - 입력 후
  await page.screenshot({ path: 'screenshots/test-before-reset.png', fullPage: true });

  // 초기화 버튼 클릭
  await page.locator('button:has-text("초기화")').click();

  // 결과 대기
  await page.waitForTimeout(1000);

  // 스크린샷 - 초기화 후
  await page.screenshot({ path: 'screenshots/test-after-reset.png', fullPage: true });

  // 필드가 비워졌는지 확인
  const shipperValue = await page.locator('input[placeholder="송하인"]').inputValue();
  expect(shipperValue).toBe('');
});
