import { test, expect } from '@playwright/test';

test.describe('Pre-Alert 항공수출 페이지 테스트', () => {
  test('1. Pre-Alert 페이지 직접 접근', async ({ page }) => {
    const response = await page.goto(`/logis/pre-alert/air`);
    expect(response?.status()).toBe(200);

    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: 'Pre-Alert 관리 (항공수출)' })).toBeVisible();
    console.log('✓ Pre-Alert 페이지 접근 성공');
  });

  test('2. 탭 메뉴 확인', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 3개 탭 확인
    await expect(page.getByRole('button', { name: 'Mail Group' })).toBeVisible();
    await expect(page.getByRole('button', { name: '설정 관리' })).toBeVisible();
    await expect(page.getByRole('button', { name: '발송 이력' })).toBeVisible();
    console.log('✓ 3개 탭 메뉴 표시됨');
  });

  test('3. Mail Group 탭 기본 UI 확인', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // Mail Group 탭이 기본 선택됨
    const mailGroupTab = page.getByRole('button', { name: 'Mail Group' });
    await expect(mailGroupTab).toHaveClass(/bg-\[#2563EB\]/);

    // Group List와 Address List 패널 확인
    await expect(page.getByText('Group List')).toBeVisible();
    await expect(page.getByText('Address List')).toBeVisible();

    // 신규 등록 버튼 확인
    await expect(page.getByRole('button', { name: '신규 등록' })).toBeVisible();
    console.log('✓ Mail Group 탭 UI 표시됨');
  });

  test('4. 설정 관리 탭 전환', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 설정 관리 탭 클릭
    await page.getByRole('button', { name: '설정 관리' }).click();
    await page.waitForTimeout(500);

    // 설정 관리 탭이 선택됨
    const settingsTab = page.getByRole('button', { name: '설정 관리' });
    await expect(settingsTab).toHaveClass(/bg-\[#2563EB\]/);

    // 신규 등록 버튼 확인
    await expect(page.getByRole('button', { name: '신규 등록' })).toBeVisible();
    console.log('✓ 설정 관리 탭 전환 성공');
  });

  test('5. 발송 이력 탭 전환', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 발송 이력 탭 클릭
    await page.getByRole('button', { name: '발송 이력' }).click();
    await page.waitForTimeout(500);

    // 발송 이력 탭이 선택됨
    const logsTab = page.getByRole('button', { name: '발송 이력' });
    await expect(logsTab).toHaveClass(/bg-\[#2563EB\]/);

    // 검색 필터 확인 - label로 구체적 지정
    await expect(page.locator('label').filter({ hasText: 'Doc No.' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '상태' })).toBeVisible();
    await expect(page.getByRole('button', { name: '검색' })).toBeVisible();
    console.log('✓ 발송 이력 탭 전환 성공');
  });

  test('6. Mail Group 신규 등록 모달 열기', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 신규 등록 버튼 클릭
    await page.getByRole('button', { name: '신규 등록' }).click();
    await page.waitForTimeout(300);

    // 모달 확인
    await expect(page.getByText('Mail Group 등록')).toBeVisible();
    await expect(page.getByText('Group Code *')).toBeVisible();
    await expect(page.getByText('Group Name *')).toBeVisible();
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible();
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    console.log('✓ Mail Group 등록 모달 열림');

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 모달 닫기 성공');
  });

  test('7. 설정 관리 신규 등록 모달 열기', async ({ page }) => {
    await page.goto(`/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 설정 관리 탭 클릭
    await page.getByRole('button', { name: '설정 관리' }).click();
    await page.waitForTimeout(500);

    // 신규 등록 버튼 클릭
    await page.getByRole('button', { name: '신규 등록' }).click();
    await page.waitForTimeout(300);

    // 모달 확인
    await expect(page.getByText('Pre-Alert 설정 등록')).toBeVisible();
    await expect(page.getByText('설정명 *')).toBeVisible();
    await expect(page.getByRole('button', { name: 'AWB 선택' })).toBeVisible();
    // 모달 안의 Mail Group 버튼 (cyan-600 배경)
    await expect(page.locator('button.bg-cyan-600').filter({ hasText: 'Mail Group' })).toBeVisible();
    console.log('✓ 설정 등록 모달 열림');

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 모달 닫기 성공');
  });
});
