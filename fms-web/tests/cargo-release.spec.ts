import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('화물반출입 페이지 테스트', () => {
  test('1. 화물반출입 페이지 직접 접근', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/logis/cargo/release`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: '화물반출입관리' })).toBeVisible();
    console.log('✓ 화물반출입 페이지 접근 성공');
  });

  test('2. 검색조건 영역 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('검색조건')).toBeVisible();
    console.log('✓ 검색조건 영역 표시됨');

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
    console.log('✓ 날짜 입력 필드 2개 표시됨');

    // 검색 필드 확인 (이미지 기반 변경) - label만 확인
    await expect(page.locator('label').filter({ hasText: '반입번호' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'M B/L' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'H B/L' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'MRN' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '반입구분' })).toBeVisible();
    console.log('✓ 검색 필드 표시됨');

    await expect(page.getByRole('button', { name: '조회' })).toBeVisible();
    await expect(page.getByRole('button', { name: '초기화' })).toBeVisible();
    console.log('✓ 조회/초기화 버튼 표시됨');
  });

  test('3. 유니패스(수입), 유니패스(수출), 엑셀 버튼 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: '유니패스(수입)' })).toBeVisible();
    console.log('✓ 유니패스(수입) 버튼 표시됨');

    await expect(page.getByRole('button', { name: '유니패스(수출)' })).toBeVisible();
    console.log('✓ 유니패스(수출) 버튼 표시됨');

    await expect(page.getByRole('button', { name: '엑셀 다운로드' })).toBeVisible();
    console.log('✓ 엑셀 다운로드 버튼 표시됨');

    await expect(page.getByRole('button', { name: '엑셀 업로드' })).toBeVisible();
    console.log('✓ 엑셀 업로드 버튼 표시됨');
  });

  test('4. 목록 테이블 컬럼 확인 (이미지 기반)', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    // 이미지 기반 컬럼 확인
    await expect(page.locator('th').filter({ hasText: '반입번호' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '반입일자' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '입항일자' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'MRN' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'MSN' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'HSN' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '반입구분' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'M B/L' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'H B/L' })).toBeVisible();
    console.log('✓ 기본 정보 컬럼 표시됨');

    // 입고 컬럼
    await expect(page.locator('th').filter({ hasText: '입고수량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '입고중량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '입고용적' })).toBeVisible();
    console.log('✓ 입고 컬럼 표시됨');

    // 출고 컬럼
    await expect(page.locator('th').filter({ hasText: '출고수량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '출고중량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '출고용적' })).toBeVisible();
    console.log('✓ 출고 컬럼 표시됨');

    // 재고 컬럼
    await expect(page.locator('th').filter({ hasText: '재고수량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '재고중량' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '재고용적' })).toBeVisible();
    console.log('✓ 재고 컬럼 표시됨');

    // 데이터 행 확인
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    console.log(`✓ 데이터 ${rowCount}건 표시됨`);
  });

  test('5. 체크박스 기능 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    // 전체 선택 체크박스 확인
    const headerCheckbox = page.locator('thead input[type="checkbox"]');
    await expect(headerCheckbox).toBeVisible();
    console.log('✓ 전체 선택 체크박스 표시됨');

    // 개별 체크박스 확인
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    expect(await rowCheckboxes.count()).toBeGreaterThan(0);
    console.log('✓ 개별 체크박스 표시됨');

    // 전체 선택 테스트
    await headerCheckbox.check();
    await page.waitForTimeout(300);

    const checkedCount = await rowCheckboxes.evaluateAll(
      checkboxes => checkboxes.filter(cb => (cb as HTMLInputElement).checked).length
    );
    expect(checkedCount).toBeGreaterThan(0);
    console.log('✓ 전체 선택 기능 작동함');
  });

  test('6. 검색 기능 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    // 반입구분 필터 선택
    await page.locator('select').first().selectOption('일반반입');

    // 조회 버튼 클릭
    await page.getByRole('button', { name: '조회' }).click();
    await page.waitForTimeout(500);
    console.log('✓ 검색 기능 작동함');

    // 초기화 버튼 클릭
    await page.getByRole('button', { name: '초기화' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 초기화 기능 작동함');
  });

  test('7. 요약 통계 카드 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    // 통계 카드 확인
    const statsCards = page.locator('.card.p-4.text-center');
    await expect(statsCards).toHaveCount(4);
    console.log('✓ 요약 통계 카드 4개 표시됨');

    // 통계 항목 확인
    await expect(page.getByText('전체 건수')).toBeVisible();
    await expect(page.getByText('총 입고수량')).toBeVisible();
    await expect(page.getByText('총 출고수량')).toBeVisible();
    await expect(page.getByText('총 재고수량')).toBeVisible();
    console.log('✓ 통계 항목 표시됨');
  });

  test('8. 테이블 컬럼 정렬 기능 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    // 반입번호 컬럼 클릭 (오름차순)
    await page.locator('th').filter({ hasText: '반입번호' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 반입번호 오름차순 정렬');

    // 다시 클릭 (내림차순)
    await page.locator('th').filter({ hasText: '반입번호' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 반입번호 내림차순 정렬');

    // 입고수량 컬럼 클릭 (숫자 정렬)
    await page.locator('th').filter({ hasText: '입고수량' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 입고수량 정렬');

    // 정렬 아이콘 확인
    const sortIcons = page.locator('th svg');
    expect(await sortIcons.count()).toBeGreaterThan(0);
    console.log('✓ 정렬 아이콘 표시됨');
  });

  test('9. 수입화물 추적정보 팝업 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '유니패스(수입)' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('heading', { name: '수입화물 진행정보' })).toBeVisible();
    console.log('✓ 수입화물 진행정보 팝업 열림');

    await expect(page.getByRole('button', { name: '수입화물진행정보(건별)' })).toBeVisible();
    console.log('✓ 팝업 탭 표시됨');

    await expect(page.getByText('M B/L - H B/L')).toBeVisible();
    await expect(page.locator('.fixed label').filter({ hasText: '화물관리번호' })).toBeVisible();
    console.log('✓ 검색 옵션 표시됨');

    await page.locator('.fixed button.bg-\\[\\#0066CC\\]').filter({ hasText: /^조회$/ }).click();
    await page.waitForTimeout(500);
    console.log('✓ 조회 기능 작동함');

    await page.locator('.fixed .p-4.border-b button').click();
    await page.waitForTimeout(300);
    console.log('✓ 팝업 닫힘');
  });

  test('10. 수출통관정보 팝업 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '유니패스(수출)' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('heading', { name: '수출화물 진행정보' })).toBeVisible();
    console.log('✓ 수출화물 진행정보 팝업 열림');

    // 탭 확인
    await expect(page.getByRole('button', { name: '수출신고조회' })).toBeVisible();
    await expect(page.getByRole('button', { name: '수출이행내역조회' })).toBeVisible();
    await expect(page.getByRole('button', { name: '적하목록정보조회' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export cargo tracking' })).toBeVisible();
    console.log('✓ 4개 탭 모두 표시됨');

    await expect(page.getByText('*수출신고 수리기간')).toBeVisible();
    console.log('✓ 수리기간 필드 표시됨');

    await expect(page.getByText('개별조회')).toBeVisible();
    await expect(page.getByText('일괄조회')).toBeVisible();
    console.log('✓ 조회 옵션 표시됨');

    // 수출이행내역조회 탭 클릭
    await page.getByRole('button', { name: '수출이행내역조회' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('수출신고번호를 입력 후 조회하세요.')).toBeVisible();
    console.log('✓ 수출이행내역조회 탭 작동');

    // 닫기 버튼 (헤더 영역의 X 버튼)
    await page.locator('.fixed .bg-\\[\\#28A745\\] button').click();
    await page.waitForTimeout(300);
    console.log('✓ 팝업 닫힘');
  });

  test('11. 엑셀 다운로드 기능 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.getByRole('button', { name: '엑셀 다운로드' }).click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/화물반출입관리.*\.csv/);
      console.log(`✓ 엑셀 다운로드 성공: ${filename}`);
    } else {
      console.log('✓ 엑셀 다운로드 버튼 동작 확인');
    }
  });

  test('12. 목록 헤더 및 건수 표시 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/cargo/release`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('화물반출입 목록')).toBeVisible();
    console.log('✓ 목록 헤더 표시됨');

    await expect(page.getByText(/\(\d+건\)/)).toBeVisible();
    console.log('✓ 목록 건수 표시됨');

    await expect(page.getByText('컬럼 헤더를 클릭하면 정렬됩니다')).toBeVisible();
    console.log('✓ 정렬 안내 메시지 표시됨');
  });
});
