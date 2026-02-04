import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pre-Alert CRUD 테스트', () => {
  test('1. Mail Group 목록 조회 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // Mail Group 탭에서 등록된 그룹 확인
    await expect(page.getByText('GRP-001')).toBeVisible();
    await expect(page.getByText('GRP-002')).toBeVisible();
    await expect(page.getByText('GRP-003')).toBeVisible();
    console.log('✓ Mail Group 목록 조회 확인');
  });

  test('2. Mail Group 선택 시 Address List 표시', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // GRP-001 클릭
    await page.getByText('GRP-001').click();
    await page.waitForTimeout(500);

    // Address List에 주소 표시 확인
    await expect(page.getByText('kim.logistics@samsung.com')).toBeVisible();
    await expect(page.getByText('lee.export@samsung.com')).toBeVisible();
    await expect(page.getByText('park.manager@samsung.com')).toBeVisible();
    console.log('✓ Address List 표시 확인');
  });

  test('3. 설정 관리 탭에서 설정 목록 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 설정 관리 탭 클릭
    await page.getByRole('button', { name: '설정 관리' }).click();
    await page.waitForTimeout(500);

    // Samsung Pre-Alert 설정 확인
    await expect(page.getByText('Samsung ICN-LAX Pre-Alert')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ICN → LAX' }).first()).toBeVisible();
    console.log('✓ 설정 목록 조회 확인');
  });

  test('4. Mail Group 신규 등록 모달 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 신규 등록 버튼 클릭
    await page.getByRole('button', { name: '신규 등록' }).click();
    await page.waitForTimeout(300);

    // 모달이 열렸는지 확인
    await expect(page.getByText('Mail Group 등록')).toBeVisible();
    
    // 주소 추가 버튼 확인
    await expect(page.getByRole('button', { name: '+ 추가' })).toBeVisible();
    console.log('✓ Mail Group 등록 모달 테스트 완료');

    // 취소
    await page.getByRole('button', { name: '취소' }).click();
  });

  test('5. LA Forwarder 그룹 수정 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // GRP-002 클릭 (수정된 LA Global Forwarder)
    await page.getByText('GRP-002').click();
    await page.waitForTimeout(500);

    // 수정된 그룹명 확인 (Address List 패널의 span 태그)
    await expect(page.getByText('- LA Global Forwarder')).toBeVisible();

    // 수정된 이메일 주소 확인
    await expect(page.getByText('john.smith@laglobal.com')).toBeVisible();
    await expect(page.getByText('mike.w@laglobal.com')).toBeVisible();
    await expect(page.getByText('sarah.j@laglobal.com')).toBeVisible();
    console.log('✓ 수정된 Mail Group 확인');
  });
});
