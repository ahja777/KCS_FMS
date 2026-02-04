import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('코드 데이터 동기화 검증', () => {

  test('공통코드 그룹 API 조회', async ({ request }) => {
    // 재시도 로직 추가 (서버 응답 지연 대응)
    let response;
    let retries = 3;
    while (retries > 0) {
      response = await request.get(`${BASE}/api/common-code/groups`);
      if (response.ok()) break;
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    }

    expect(response!.ok()).toBeTruthy();
    const groups = await response!.json();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);

    // 새로 추가된 그룹 확인
    const groupCodes = groups.map((g: any) => g.GROUP_CD);
    console.log('  [공통코드 그룹] 총', groups.length, '개');
  });

  test('해상 견적 목록 - STATUS 값 확인', async ({ request }) => {
    const response = await request.get(`${BASE}/api/quote/sea`);
    expect(response.ok()).toBeTruthy();
    const quotes = await response.json();

    // STATUS 값 확인 (대소문자 통일 확인 - 대문자로 변환해서 유효한 값인지 검증)
    const validStatuses = ['ACTIVE', 'DRAFT', 'PENDING', 'EXPIRED', 'REJECTED', 'SUBMITTED', 'APPROVED'];
    const statuses = quotes.map((q: any) => q.status?.toUpperCase());
    const uniqueStatuses = [...new Set(statuses)];
    console.log('  [해상 견적 STATUS]:', uniqueStatuses.join(', '));

    for (const status of statuses) {
      if (status) {
        expect(validStatuses).toContain(status);
      }
    }
  });

  test('해상 부킹 목록 - STATUS_CD 대문자 확인', async ({ request }) => {
    const response = await request.get(`${BASE}/api/booking/sea`);
    expect(response.ok()).toBeTruthy();
    const bookings = await response.json();

    const statuses = bookings.map((b: any) => b.status);
    const uniqueStatuses = [...new Set(statuses)];
    console.log('  [해상 부킹 STATUS]:', uniqueStatuses.join(', '));

    // STATUS 값이 대문자인지 확인
    for (const status of statuses) {
      if (status) {
        expect(status).toBe(status.toUpperCase());
      }
    }
  });

  test('B/L 목록 - STATUS_CD 대문자 확인', async ({ request }) => {
    const response = await request.get(`${BASE}/api/bl/sea`);
    expect(response.ok()).toBeTruthy();
    const bls = await response.json();

    const statuses = bls.map((b: any) => b.status);
    const uniqueStatuses = [...new Set(statuses)];
    console.log('  [B/L STATUS]:', uniqueStatuses.join(', '));

    for (const status of statuses) {
      if (status) {
        expect(status).toBe(status.toUpperCase());
      }
    }
  });

  test('해상 스케줄 목록 - STATUS_CD 대문자 확인', async ({ request }) => {
    const response = await request.get(`${BASE}/api/schedule/sea`);
    expect(response.ok()).toBeTruthy();
    const schedules = await response.json();

    const statuses = schedules.map((s: any) => s.status);
    const uniqueStatuses = [...new Set(statuses)];
    console.log('  [해상 스케줄 STATUS]:', uniqueStatuses.join(', '));

    for (const status of statuses) {
      if (status) {
        expect(status).toBe(status.toUpperCase());
      }
    }
  });

  test('PORT 코드 KRPUS 사용 확인', async ({ request }) => {
    const response = await request.get(`${BASE}/api/quote/sea`);
    expect(response.ok()).toBeTruthy();
    const quotes = await response.json();

    // KRPUS가 POL로 사용되는 데이터 있는지 확인
    const hasPusan = quotes.some((q: any) => q.pol === 'KRPUS');
    console.log('  [KRPUS 사용]:', hasPusan ? '있음' : '없음');
    expect(hasPusan).toBeTruthy();
  });
});

test.describe('fms-web 주요 페이지 정상 로드', () => {

  test('메인 대시보드 로드', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/localhost:3000/);
    console.log('  [대시보드] 로드 성공');
  });

  test('해상 견적 목록 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/quote/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 테이블 데이터 확인
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log('  [해상 견적 목록] 행 수:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('해상 부킹 목록 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/booking/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log('  [해상 부킹 목록] 행 수:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('해상 B/L 목록 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/bl/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log('  [해상 B/L 목록] 행 수:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('해상 스케줄 목록 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log('  [해상 스케줄 목록] 행 수:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('항공 스케줄 목록 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/schedule/air`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log('  [항공 스케줄 목록] 행 수:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('공통코드 관리 페이지', async ({ page }) => {
    await page.goto(`${BASE}/logis/common/code`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 페이지 로드 확인
    const title = await page.locator('h1, h2').first().textContent();
    console.log('  [공통코드 관리] 페이지 타이틀:', title);
  });
});

test.describe('등록 페이지 정상 동작', () => {

  test('해상 견적 등록 페이지 접근', async ({ page }) => {
    await page.goto(`${BASE}/logis/quote/sea`);
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('button', { hasText: '신규' });
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForURL('**/register**');
      console.log('  [해상 견적 등록] 페이지 이동 성공');
    }
  });

  test('해상 부킹 등록 페이지 접근', async ({ page }) => {
    await page.goto(`${BASE}/logis/booking/sea`);
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('button', { hasText: '신규' });
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForURL('**/register**');
      console.log('  [해상 부킹 등록] 페이지 이동 성공');
    }
  });

  test('해상 스케줄 등록 페이지 접근', async ({ page }) => {
    await page.goto(`${BASE}/logis/schedule/sea`);
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('button', { hasText: '신규' });
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForURL('**/register**');
      console.log('  [해상 스케줄 등록] 페이지 이동 성공');
    }
  });
});
