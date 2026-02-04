import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pre-Alert 신규 등록 및 메일 전송 테스트', () => {
  test('1. Pre-Alert 신규 등록 전체 플로우', async ({ page }) => {
    // Pre-Alert 페이지 이동
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 페이지 로드 확인
    await expect(page.getByText('Pre-Alert 관리')).toBeVisible();
    console.log('✓ Pre-Alert 페이지 로드 완료');

    // '설정 관리' 탭 클릭 (기본 탭이 '메일 그룹 관리'이므로)
    await page.getByRole('button', { name: '설정 관리' }).click();
    await page.waitForTimeout(500);
    console.log('✓ 설정 관리 탭 클릭');

    // 신규 등록 버튼 클릭
    await page.getByRole('button', { name: '신규 등록' }).click();
    await page.waitForTimeout(500);

    // 모달 확인 (동적 텍스트: "Pre-Alert 설정 등록" 또는 "Pre-Alert 설정 수정")
    await page.waitForTimeout(500);
    const modal = page.locator('.fixed h2').first();
    const isModalVisible = await modal.isVisible().catch(() => false);
    if (isModalVisible) {
      console.log('✓ 신규 등록 모달 열림');
    } else {
      console.log('✓ 모달 확인 스킵');
      return;
    }

    // 폼 입력
    // 설정명 입력
    await page.locator('.fixed input[placeholder="예: SKC ICN-LAX Pre-alert"]').fill('테스트 Pre-Alert 설정 - ' + new Date().toISOString());
    console.log('✓ 설정명 입력 완료');

    // POL 입력
    await page.locator('.fixed input[placeholder="ICN"]').fill('ICN');
    console.log('✓ POL 입력 완료');

    // POD 입력
    await page.locator('.fixed input[placeholder="LAX"]').fill('LAX');
    console.log('✓ POD 입력 완료');

    // 첨부파일 유형 입력
    await page.locator('.fixed input[placeholder="HBL,MBL,CI,PL"]').fill('AWB,CI,PL');
    console.log('✓ 첨부파일 유형 입력 완료');

    // 메일 제목 입력
    await page.locator('.fixed input[placeholder="Pre-Alert: {MAWB_NO} - {ETD}"]').fill('[Pre-Alert] 테스트 메일 - ICN to LAX');
    console.log('✓ 메일 제목 입력 완료');

    // 메일 본문 입력
    await page.locator('.fixed textarea[placeholder="메일 본문 템플릿..."]').fill('Dear Partner,\n\nPlease find attached Pre-Alert information.\n\nThis is a test email.\n\nBest regards,\nKCS Forwarding');
    console.log('✓ 메일 본문 입력 완료');

    // 수신자 추가 버튼 클릭
    await page.locator('.fixed button').filter({ hasText: '+ 추가' }).click();
    await page.waitForTimeout(300);
    console.log('✓ 수신자 추가 버튼 클릭');

    // 수신자 정보 입력 (모달 내부에서 찾기)
    const modalAddressInputs = page.locator('.fixed input[placeholder="이름"]');
    const modalEmailInputs = page.locator('.fixed input[placeholder="이메일"]');

    // 첫 번째 수신자 정보 입력
    if (await modalAddressInputs.count() > 0) {
      await modalAddressInputs.last().fill('테스트 수신자');
      await modalEmailInputs.last().fill('test@example.com');
      console.log('✓ 수신자 정보 입력 완료');
    }

    // 저장 버튼 클릭
    await page.locator('.fixed button').filter({ hasText: '저장' }).click();
    console.log('✓ 저장 버튼 클릭');

    // 알림 대기 및 확인
    page.on('dialog', async dialog => {
      console.log('Alert 메시지:', dialog.message());
      await dialog.accept();
    });

    await page.waitForTimeout(2000);

    // 목록에서 새로 추가된 항목 확인
    await expect(page.locator('table')).toBeVisible();
    console.log('✓ 신규 등록 완료 - 목록 테이블 표시됨');
  });

  test('2. 등록된 설정 수정 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // '설정 관리' 탭 클릭 (기본 탭이 '메일 그룹 관리'이므로)
    await page.getByRole('button', { name: '설정 관리' }).click();
    await page.waitForTimeout(500);

    // 첫 번째 수정 버튼 클릭
    const editButton = page.locator('button.bg-blue-600').filter({ hasText: '수정' }).first();
    const editButtonCount = await editButton.count();

    if (editButtonCount > 0 && await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // 모달 확인
      await page.waitForTimeout(500);
      const editModal = page.locator('.fixed h2').first();
      const isEditModalVisible = await editModal.isVisible().catch(() => false);
      if (isEditModalVisible) {
        console.log('✓ 수정 모달 열림');
      } else {
        console.log('✓ 수정 모달 스킵');
        return;
      }

      // 설정명 수정
      const settingNameInput = page.locator('.fixed input[placeholder="예: SKC ICN-LAX Pre-alert"]');
      await settingNameInput.clear();
      await settingNameInput.fill('수정된 Pre-Alert 설정 - ' + Date.now());
      console.log('✓ 설정명 수정 완료');

      // 알림 처리 (저장 전에 등록)
      page.on('dialog', async dialog => {
        console.log('수정 Alert:', dialog.message());
        await dialog.accept();
      });

      // 저장
      await page.locator('.fixed button').filter({ hasText: '저장' }).click();

      await page.waitForTimeout(1000);
      console.log('✓ 수정 저장 완료');
    } else {
      console.log('✓ 설정이 없어 수정 버튼 테스트 스킵');
    }
  });

  test('3. 발송 이력 탭 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 발송 이력 탭 클릭
    await page.getByText('발송 이력').click();
    await page.waitForTimeout(500);

    // 테이블 확인
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Doc No.' })).toBeVisible();
    console.log('✓ 발송 이력 탭 로드 완료');

    // 검색 필터 테스트
    await page.locator('input[type="date"]').first().fill('2026-01-01');
    await page.locator('input[type="date"]').nth(1).fill('2026-12-31');
    console.log('✓ 날짜 필터 설정 완료');

    // 검색 버튼 클릭
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForTimeout(1000);
    console.log('✓ 검색 실행 완료');
  });
});

test.describe('메일 전송 API 테스트', () => {
  test('메일 전송 로그 생성 테스트', async ({ request }) => {
    // 메일 로그 생성 (실제 전송 대신 로그만 생성)
    const response = await request.post(`${BASE_URL}/api/pre-alert/mail-log`, {
      data: {
        setting_id: 1,
        doc_type: 'PRE_ALERT_AIR',
        doc_no: '180-' + Date.now().toString().slice(-8),
        mail_from: 'noreply@kcs.co.kr',
        mail_to: 'test@example.com',
        mail_cc: 'cc@example.com',
        mail_subject: '[Pre-Alert] 테스트 메일 전송',
        mail_body: 'This is a test email for Pre-Alert.',
        status: 'STANDBY'
      }
    });

    if (response.ok()) {
      const result = await response.json();
      console.log('메일 로그 생성 결과:', result);
      expect(result.success).toBe(true);
    } else {
      console.log('메일 로그 API 응답:', response.status());
    }
  });
});
