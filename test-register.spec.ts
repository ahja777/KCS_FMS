import { test, expect } from '@playwright/test';

test.describe('등록 화면 테스트', () => {

  test('해상 견적 등록 화면 테스트', async ({ page }) => {
    // 페이지 이동
    await page.goto('http://localhost:3000/logis/quote/sea/register');
    await page.waitForLoadState('networkidle');

    // 화면 요소 확인
    console.log('=== 해상 견적 등록 화면 테스트 ===');

    // 제목 확인
    const title = await page.locator('h1, h2').first().textContent();
    console.log('제목:', title);

    // 버튼 확인
    const buttons = ['스케줄조회', '운임조회', 'E-mail', '목록', '저장'];
    for (const btn of buttons) {
      const button = page.getByRole('button', { name: btn });
      const isVisible = await button.isVisible().catch(() => false);
      console.log(`버튼 [${btn}]: ${isVisible ? '있음' : '없음'}`);
    }

    // 기본정보 섹션 확인
    const basicInfo = page.locator('text=기본정보');
    expect(await basicInfo.isVisible()).toBeTruthy();
    console.log('기본정보 섹션: 있음');

    // 운임정보 섹션 확인
    const freightInfo = page.locator('text=운임정보');
    expect(await freightInfo.isVisible()).toBeTruthy();
    console.log('운임정보 섹션: 있음');

    // 기타정보 섹션 확인
    const otherInfo = page.locator('text=기타정보');
    expect(await otherInfo.isVisible()).toBeTruthy();
    console.log('기타정보 섹션: 있음');

    // 합계 카드 확인
    const totals = ['외화합계', '원화합계', '부가세합계', '총 합계'];
    for (const total of totals) {
      const element = page.locator(`text=${total}`);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${total}: ${isVisible ? '있음' : '없음'}`);
    }

    // 스케줄조회 버튼 클릭 테스트
    console.log('\n--- 스케줄조회 버튼 클릭 테스트 ---');
    await page.getByRole('button', { name: '스케줄조회' }).click();
    await page.waitForTimeout(500);
    const scheduleModal = page.locator('text=스케줄 조회');
    const modalVisible = await scheduleModal.isVisible().catch(() => false);
    console.log('스케줄조회 모달:', modalVisible ? '열림' : '닫힘');

    // 모달 닫기
    const closeBtn = page.locator('[aria-label="Close"], button:has-text("닫기"), button:has-text("취소")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    // 운임조회 버튼 클릭 테스트
    console.log('\n--- 운임조회 버튼 클릭 테스트 ---');
    await page.getByRole('button', { name: '운임조회' }).click();
    await page.waitForTimeout(500);
    const freightModal = page.locator('text=운임 조회');
    const freightModalVisible = await freightModal.isVisible().catch(() => false);
    console.log('운임조회 모달:', freightModalVisible ? '열림' : '닫힘');

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/sea-register.png', fullPage: true });
    console.log('\n스크린샷 저장: test-results/sea-register.png');
  });

  test('항공 견적 등록 화면 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/quote/air/register');
    await page.waitForLoadState('networkidle');

    console.log('\n=== 항공 견적 등록 화면 테스트 ===');

    // 제목 확인
    const title = await page.locator('h1, h2').first().textContent();
    console.log('제목:', title);

    // 버튼 확인
    const buttons = ['스케줄조회', '운임조회', 'E-mail', '목록', '저장'];
    for (const btn of buttons) {
      const button = page.getByRole('button', { name: btn });
      const isVisible = await button.isVisible().catch(() => false);
      console.log(`버튼 [${btn}]: ${isVisible ? '있음' : '없음'}`);
    }

    // 기타정보 섹션 확인
    const otherInfo = page.locator('text=기타정보');
    expect(await otherInfo.isVisible()).toBeTruthy();
    console.log('기타정보 섹션: 있음');

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/air-register.png', fullPage: true });
    console.log('스크린샷 저장: test-results/air-register.png');
  });

  test('수입 B/L 등록 화면 탭 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/import-bl/sea/register');
    await page.waitForLoadState('networkidle');

    console.log('\n=== 수입 B/L 등록 화면 테스트 ===');

    // 제목 확인
    const title = await page.locator('h1, h2').first().textContent();
    console.log('제목:', title);

    // 탭 확인
    const tabs = ['Main Information', 'Cargo Information', 'Other Charges'];
    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`);
      const isVisible = await tabElement.isVisible().catch(() => false);
      console.log(`탭 [${tab}]: ${isVisible ? '있음' : '없음'}`);
    }

    // 버튼 확인
    const buttons = ['스케줄조회', '운임조회', 'E-mail', '목록', '저장'];
    for (const btn of buttons) {
      const button = page.getByRole('button', { name: btn });
      const isVisible = await button.isVisible().catch(() => false);
      console.log(`버튼 [${btn}]: ${isVisible ? '있음' : '없음'}`);
    }

    // CARGO 탭 클릭 테스트
    console.log('\n--- CARGO 탭 클릭 테스트 ---');
    await page.locator('text=Cargo Information').click();
    await page.waitForTimeout(300);
    const cargoContent = page.locator('text=Mark');
    const cargoVisible = await cargoContent.isVisible().catch(() => false);
    console.log('CARGO 탭 내용:', cargoVisible ? '표시됨' : '표시안됨');

    // OTHER 탭 클릭 테스트
    console.log('\n--- OTHER 탭 클릭 테스트 ---');
    await page.locator('text=Other Charges').click();
    await page.waitForTimeout(300);

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/bl-register.png', fullPage: true });
    console.log('스크린샷 저장: test-results/bl-register.png');
  });

  test('저장 기능 테스트 (해상 견적)', async ({ page }) => {
    await page.goto('http://localhost:3000/logis/quote/sea/register');
    await page.waitForLoadState('networkidle');

    console.log('\n=== 저장 기능 테스트 ===');

    // 필수 항목 입력
    // 등록일자는 이미 오늘 날짜로 설정됨

    // 거래처 입력
    const customerInput = page.locator('input[placeholder*="거래처"]').first();
    if (await customerInput.isVisible()) {
      await customerInput.fill('테스트 거래처');
      console.log('거래처 입력: 테스트 거래처');
    }

    // 거래처명 필드 찾기
    const customerNameField = page.locator('label:has-text("거래처")').locator('..').locator('input').first();
    if (await customerNameField.isVisible()) {
      await customerNameField.fill('테스트 화주');
      console.log('거래처명 입력: 테스트 화주');
    }

    // 저장 버튼 클릭
    page.on('dialog', async dialog => {
      console.log('Alert 메시지:', dialog.message());
      await dialog.accept();
    });

    await page.getByRole('button', { name: '저장' }).click();
    await page.waitForTimeout(1000);

    console.log('저장 버튼 클릭 완료');
  });
});
