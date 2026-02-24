import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button:has-text("로그인")');
  await page.waitForTimeout(5000);
}

test.describe.serial('자사관리 목록 → 수정 → DB 저장 테스트', () => {
  test('1. 자사관리 목록 페이지 로드', async ({ page }) => {
    await login(page);
    if (page.url().includes('/login')) {
      test.skip(true, 'DB 연결 실패로 로그인 불가');
      return;
    }

    await page.goto('/admin/company');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 테이블이 렌더링되는지 확인
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // 회사코드 컬럼 헤더 확인
    await expect(page.locator('th:has-text("회사코드")')).toBeVisible();
    await expect(page.locator('th:has-text("회사명")')).toBeVisible();

    console.log('OK: 자사관리 목록 페이지 로드 성공');
  });

  test('2. 행 클릭 시 수정 페이지로 이동', async ({ page }) => {
    await login(page);
    if (page.url().includes('/login')) {
      test.skip(true, 'DB 연결 실패로 로그인 불가');
      return;
    }

    await page.goto('/admin/company');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 테이블 행이 있는지 확인
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0 || (await rows.first().locator('td').count()) < 2) {
      console.log('SKIP: 등록된 회사가 없어 행 클릭 테스트 건너뜀');
      test.skip(true, '등록된 회사 없음');
      return;
    }

    // 첫 번째 행의 회사코드 가져오기
    const companyCd = await rows.first().locator('td').nth(1).innerText();
    console.log(`클릭할 회사코드: ${companyCd}`);

    // 행 클릭
    await rows.first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // URL이 수정 페이지로 변경되었는지 확인
    expect(page.url()).toContain(`/admin/company/${companyCd}`);

    // 수정 페이지 필드 확인
    await expect(page.locator('text=기본 정보')).toBeVisible();
    await expect(page.locator('text=사업자 정보')).toBeVisible();
    await expect(page.locator('text=연락처 정보')).toBeVisible();

    // 회사코드 필드가 비활성화(disabled)인지 확인 (수정 모드)
    const companyCdInput = page.locator('input').first();
    await expect(companyCdInput).toBeDisabled();

    console.log(`OK: 회사코드 ${companyCd} 수정 페이지 이동 성공`);
  });

  test('3. 신규등록 버튼 → 등록 페이지 이동', async ({ page }) => {
    await login(page);
    if (page.url().includes('/login')) {
      test.skip(true, 'DB 연결 실패로 로그인 불가');
      return;
    }

    await page.goto('/admin/company');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 신규등록 버튼 클릭
    await page.click('button:has-text("신규등록")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // URL 확인
    expect(page.url()).toContain('/admin/company/new');

    // 신규 등록 페이지 확인
    await expect(page.locator('text=회사 신규 등록')).toBeVisible();

    // 회사코드 필드가 편집 가능한지 확인
    const companyCdInput = page.locator('input').first();
    await expect(companyCdInput).toBeEnabled();

    console.log('OK: 신규등록 페이지 이동 성공');
  });

  test('4. 데이터 수정 후 저장 → DB 저장 확인', async ({ page }) => {
    await login(page);
    if (page.url().includes('/login')) {
      test.skip(true, 'DB 연결 실패로 로그인 불가');
      return;
    }

    // 목록 페이지에서 회사 목록 확인 (page context로 API 호출)
    await page.goto('/admin/company');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const companies = await page.evaluate(async () => {
      const res = await fetch('/api/admin/company');
      return res.json();
    });

    if (!Array.isArray(companies) || companies.length === 0) {
      console.log('SKIP: 등록된 회사가 없어 수정 테스트 건너뜀');
      test.skip(true, '등록된 회사 없음');
      return;
    }

    const target = companies[0];
    const companyCd = target.COMPANY_CD;
    const originalNmEn = target.COMPANY_NM_EN || '';
    const testValue = `TEST_EN_${Date.now()}`;

    console.log(`테스트 대상 회사: ${companyCd}, 원래 영문명: "${originalNmEn}"`);

    // 수정 페이지로 이동
    await page.goto(`/admin/company/${companyCd}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // alert 다이얼로그 핸들링 (저장 전에 등록)
    page.on('dialog', async dialog => {
      console.log(`Dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // 영문 회사명 필드 찾아서 수정
    const nmEnLabel = page.locator('label:has-text("영문 회사명")');
    const nmEnInput = nmEnLabel.locator('..').locator('input');
    await nmEnInput.clear();
    await nmEnInput.fill(testValue);

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(5000);

    // DB에서 변경된 값 확인 (page context에서 fetch)
    // 저장 후 목록으로 돌아갔을 수 있으므로 목록 페이지에서 API 확인
    await page.goto('/admin/company');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const verifyData = await page.evaluate(async (cd: string) => {
      const res = await fetch(`/api/admin/company?companyCd=${cd}`);
      return res.json();
    }, companyCd);

    expect(verifyData).toHaveLength(1);
    expect(verifyData[0].COMPANY_NM_EN).toBe(testValue);
    console.log(`OK: DB 저장 확인 - 영문명이 "${testValue}"로 변경됨`);

    // 원래 값으로 복원
    const restoreResult = await page.evaluate(async (data: { target: typeof companies[0]; originalNmEn: string }) => {
      const res = await fetch('/api/admin/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data.target, COMPANY_NM_EN: data.originalNmEn }),
      });
      return res.ok;
    }, { target, originalNmEn });

    expect(restoreResult).toBeTruthy();
    console.log(`OK: 원래 영문명 "${originalNmEn}"으로 복원 완료`);
  });

  test('5. 목록으로 버튼 → 목록 페이지 복귀', async ({ page }) => {
    await login(page);
    if (page.url().includes('/login')) {
      test.skip(true, 'DB 연결 실패로 로그인 불가');
      return;
    }

    // 신규 등록 페이지로 이동
    await page.goto('/admin/company/new');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 목록으로 버튼 클릭
    await page.click('button:has-text("목록으로")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 목록 페이지로 복귀 확인
    expect(page.url()).toContain('/admin/company');
    expect(page.url()).not.toContain('/new');

    await expect(page.locator('th:has-text("회사코드")')).toBeVisible();
    console.log('OK: 목록으로 복귀 성공');
  });
});
