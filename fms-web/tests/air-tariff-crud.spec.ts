import { test, expect } from '@playwright/test';

test.describe.serial('항공운임 Tariff CRUD 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:4000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/logis/**', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('항공운임 Tariff API 직접 호출 테스트', async ({ page }) => {
    // 페이지 이동 (인증 쿠키 확보)
    await page.goto('http://localhost:4000/logis/common/air-tariff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 1. GET 테스트
    const getResult = await page.evaluate(async () => {
      const res = await fetch('/api/air-tariff?origin=ICN');
      return { status: res.status, body: await res.text() };
    });
    console.log(`GET 상태: ${getResult.status}`);
    console.log(`GET 응답 (앞 500자): ${getResult.body.substring(0, 500)}`);
    expect(getResult.status).toBe(200);

    // 2. POST 테스트 (기존 데이터 수정)
    const items = JSON.parse(getResult.body);
    if (Array.isArray(items) && items.length > 0) {
      const firstItem = items[0];
      console.log(`수정 대상: ID=${firstItem.ID}, ORIGIN=${firstItem.ORIGIN}, DEST=${firstItem.DESTINATION}`);
      console.log(`전체 필드: ${JSON.stringify(firstItem)}`);

      const postResult = await page.evaluate(async (item) => {
        const res = await fetch('/api/air-tariff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        return { status: res.status, body: await res.text() };
      }, firstItem);
      console.log(`POST 상태: ${postResult.status}`);
      console.log(`POST 응답: ${postResult.body}`);

      if (postResult.status !== 200) {
        // 에러 상세 분석
        console.error(`=== 저장 실패 상세 ===`);
        console.error(`요청 데이터: ${JSON.stringify(firstItem)}`);
        console.error(`응답: ${postResult.body}`);
      }

      expect(postResult.status).toBe(200);
    } else {
      console.log('조회된 데이터 없음 - 신규 등록 테스트');

      // 신규 등록 테스트
      const newItem = {
        ORIGIN: 'ICN',
        DESTINATION: 'NRT',
        AIRLINE: 'KE',
        CHARGE_CODE: 'AFC',
        CARGO_TYPE: 'NORMAL',
        CURRENCY: 'KRW',
        WEIGHT_UNIT: 'KG',
        RATE_MIN: 50000,
        RATE_UNDER45: 10000,
        RATE_45: 8000,
        RATE_100: 7000,
        RATE_300: 6000,
        RATE_500: 5000,
        RATE_1000: 4000,
        RATE_PER_KG: 0,
        RATE_PER_BL: 0,
        USE_YN: 'Y',
      };

      const postResult = await page.evaluate(async (item) => {
        const res = await fetch('/api/air-tariff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        return { status: res.status, body: await res.text() };
      }, newItem);
      console.log(`POST(신규) 상태: ${postResult.status}`);
      console.log(`POST(신규) 응답: ${postResult.body}`);
      expect(postResult.status).toBe(200);
    }
  });

  test('항공운임 Tariff UI 수정 저장 테스트', async ({ page }) => {
    // alert 다이얼로그 자동 처리
    const dialogMessages: string[] = [];
    page.on('dialog', async dialog => {
      dialogMessages.push(dialog.message());
      console.log(`Dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.goto('http://localhost:4000/logis/common/air-tariff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 조회
    await page.click('button:has-text("조회")');
    await page.waitForTimeout(2000);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`조회된 행 수: ${rowCount}`);

    if (rowCount === 0) {
      console.log('데이터 없음 - UI 테스트 스킵');
      return;
    }

    // 첫 번째 행 클릭
    await rows.first().click();
    await page.waitForTimeout(1000);

    // 모달 확인
    const modal = page.locator('text=항공운임 Tariff 수정').or(page.locator('text=항공운임 Tariff 등록'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // API 응답 감시
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/air-tariff') && response.request().method() === 'POST',
      { timeout: 15000 }
    );

    // 저장 클릭
    await page.click('button:has-text("저장")');

    const response = await responsePromise;
    const status = response.status();
    const body = await response.text();
    console.log(`UI 저장 API 상태: ${status}`);
    console.log(`UI 저장 API 응답: ${body}`);

    if (status !== 200) {
      // 요청 본문도 확인
      const requestBody = response.request().postData();
      console.error(`요청 본문: ${requestBody}`);
    }

    expect(status).toBe(200);
  });
});
