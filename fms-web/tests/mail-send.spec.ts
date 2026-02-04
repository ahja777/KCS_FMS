import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pre-Alert 메일 발송 테스트', () => {
  test('1. API를 통한 메일 발송 테스트', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/pre-alert/send-mail`, {
      data: {
        setting_id: 1,
        doc_no: 'TEST-' + Date.now(),
        mail_to: 'test@example.com',
        mail_cc: 'cc@example.com',
        mail_subject: '[Pre-Alert 테스트] 항공화물 도착 예정 안내',
        mail_body: 'Dear Partner,\n\nThis is a test Pre-Alert email.\n\nBest regards,\nFMS Logistics',
        mawb_no: '180-' + Date.now().toString().slice(-8),
        flight_no: 'KE001',
        origin: 'ICN',
        destination: 'LAX',
        etd: '2026-02-10',
        shipper: 'Test Shipper Co., Ltd.',
        consignee: 'Test Consignee Inc.',
        pieces: 10,
        weight: 150.5,
        commodity: 'Electronic Parts',
      }
    });

    const result = await response.json();
    console.log('메일 발송 결과:', JSON.stringify(result, null, 2));

    expect(response.ok()).toBe(true);
    expect(result.success).toBe(true);
    expect(result.data.log_id).toBeGreaterThan(0);

    // Ethereal 테스트 메일인 경우 미리보기 URL 출력
    if (result.data.previewUrl) {
      console.log('\n===========================================');
      console.log('테스트 메일 미리보기 URL:');
      console.log(result.data.previewUrl);
      console.log('===========================================\n');
    }
  });

  test('2. 메일 재발송 테스트', async ({ request }) => {
    // 먼저 메일 로그 조회
    const logsResponse = await request.get(`${BASE_URL}/api/pre-alert/mail-log?docType=PRE_ALERT_AIR`);
    const logsResult = await logsResponse.json();

    if (logsResult.data && logsResult.data.length > 0) {
      const logId = logsResult.data[0].log_id;

      const response = await request.put(`${BASE_URL}/api/pre-alert/send-mail`, {
        data: { log_id: logId }
      });

      const result = await response.json();
      console.log('메일 재발송 결과:', JSON.stringify(result, null, 2));

      expect(response.ok()).toBe(true);
      expect(result.success).toBe(true);

      if (result.data?.previewUrl) {
        console.log('\n===========================================');
        console.log('재발송 메일 미리보기 URL:');
        console.log(result.data.previewUrl);
        console.log('===========================================\n');
      }
    }
  });

  test('3. UI를 통한 메일 발송 플로우', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 설정 목록에서 발송 버튼 확인
    const sendButton = page.getByRole('button', { name: '발송' }).first();

    if (await sendButton.isVisible()) {
      // 발송 버튼 클릭
      await sendButton.click();
      await page.waitForTimeout(500);

      // 발송 모달 확인
      await expect(page.getByText('Pre-Alert 메일 발송')).toBeVisible();
      console.log('✓ 발송 모달 열림');

      // 화물 정보 입력
      await page.locator('input[placeholder="180-12345678"]').fill('180-' + Date.now().toString().slice(-8));
      await page.locator('input[placeholder="KE001"]').fill('KE001');
      await page.locator('input[placeholder="ICN"]').fill('ICN');
      await page.locator('input[placeholder="LAX"]').fill('LAX');
      await page.locator('input[placeholder="General Cargo"]').fill('Test Cargo');
      console.log('✓ 화물 정보 입력 완료');

      // 메일 발송 버튼 클릭
      await page.getByRole('button', { name: '메일 발송' }).click();
      console.log('✓ 메일 발송 버튼 클릭');

      // 알림 처리
      page.on('dialog', async dialog => {
        console.log('Alert:', dialog.message());

        // 미리보기 URL이 포함된 경우 출력
        if (dialog.message().includes('ethereal.email')) {
          const match = dialog.message().match(/https:\/\/ethereal\.email[^\s]+/);
          if (match) {
            console.log('\n===========================================');
            console.log('테스트 메일 미리보기 URL:');
            console.log(match[0]);
            console.log('===========================================\n');
          }
        }

        await dialog.accept();
      });

      await page.waitForTimeout(5000);
      console.log('✓ 메일 발송 완료');
    }
  });

  test('4. 발송 이력 조회 및 재발송', async ({ page }) => {
    await page.goto(`${BASE_URL}/logis/pre-alert/air`);
    await page.waitForLoadState('networkidle');

    // 발송 이력 탭 클릭
    await page.getByText('발송 이력').click();
    await page.waitForTimeout(500);

    // 재발송 버튼 확인
    const resendButton = page.getByRole('button', { name: '재발송' }).first();

    if (await resendButton.isVisible()) {
      console.log('✓ 재발송 버튼 확인됨');

      // 재발송 버튼 클릭
      page.on('dialog', async dialog => {
        console.log('Dialog:', dialog.message());
        await dialog.accept();
      });

      await resendButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ 재발송 완료');
    }
  });
});
