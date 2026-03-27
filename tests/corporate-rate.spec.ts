import { test, expect, Page } from '@playwright/test';

let authCookie = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { userId: 'admin', password: 'admin1234' }
  });
  const headers = res.headers();
  const setCookie = headers['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  if (match) {
    authCookie = `fms_auth_token=${match[1]}`;
  }
});

function hdr() {
  return { headers: { Cookie: authCookie } };
}
function hdrBody(data: Record<string, unknown>) {
  return { data, headers: { Cookie: authCookie } };
}

async function goWithAuth(page: Page, url: string) {
  const cookieMatch = authCookie.match(/fms_auth_token=(.+)/);
  if (cookieMatch) {
    await page.context().addCookies([{
      name: 'fms_auth_token',
      value: cookieMatch[1],
      domain: '127.0.0.1',
      path: '/',
    }]);
  }
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
}

test.describe.serial('기업운임관리 API CRUD 테스트', () => {
  let seaRateId: number;
  let airRateId: number;

  test('해상 기업운임 생성 (POST)', async ({ request }) => {
    const res = await request.post('/api/logis/rate/corporate', hdrBody({
      transportMode: 'SEA',
      ioType: 'EXPORT',
      bizType: 'LOCAL',
      salesRep: '테스트영업사원',
      customerCd: 'CUST001',
      customerNm: '테스트거래처',
      carrierCd: 'MAER',
      carrierNm: 'MAERSK',
      polCd: 'KRPUS',
      polNm: 'BUSAN',
      podCd: 'CNSHA',
      podNm: 'SHANGHAI',
      insuranceAmt: 50000,
      storageAmt: 30000,
      handlingAmt: 20000,
      remark: 'E2E 테스트 데이터',
      details: [
        {
          freightType: 'F',
          freightCd: 'OFC',
          currencyCd: 'USD',
          rateMin: 100,
          rateBl: 50,
          rateRton: 30,
          cntrDry20: 1500,
          cntrDry40: 2500,
          rateBulk: 3000
        }
      ],
      transports: [
        {
          freightCd: 'TRK',
          originCd: 'KRPUS',
          originNm: 'BUSAN',
          destCd: 'KRSEL',
          destNm: 'SEOUL',
          rateLcl: 200,
          rate20ft: 350,
          rate40ft: 500,
          managerNm: '홍길동',
          managerTel: '010-1234-5678'
        }
      ]
    }));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.rateId).toBeTruthy();
    expect(body.rateNo).toMatch(/^CR-\d{4}-\d{4}$/);
    seaRateId = body.rateId;
  });

  test('해상 기업운임 상세조회 (GET)', async ({ request }) => {
    const res = await request.get(`/api/logis/rate/corporate?rateId=${seaRateId}`, hdr());
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.CUSTOMER_NM).toBe('테스트거래처');
    expect(body.CARRIER_CD).toBe('MAER');
    expect(body.details.length).toBeGreaterThanOrEqual(1);
    expect(body.transports.length).toBeGreaterThanOrEqual(1);
  });

  test('해상 기업운임 목록조회 (GET list)', async ({ request }) => {
    const res = await request.get('/api/logis/rate/corporate?transportMode=SEA', hdr());
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
    const found = body.find((r: any) => r.RATE_ID === seaRateId);
    expect(found).toBeTruthy();
  });

  test('해상 기업운임 수정 (PUT)', async ({ request }) => {
    const res = await request.put('/api/logis/rate/corporate', hdrBody({
      rateId: seaRateId,
      transportMode: 'SEA',
      ioType: 'EXPORT',
      bizType: 'LOCAL',
      salesRep: '수정영업사원',
      customerCd: 'CUST001',
      customerNm: '수정거래처',
      carrierCd: 'MAER',
      carrierNm: 'MAERSK',
      polCd: 'KRPUS',
      polNm: 'BUSAN',
      podCd: 'CNSHA',
      podNm: 'SHANGHAI',
      insuranceAmt: 60000,
      storageAmt: 35000,
      handlingAmt: 25000,
      remark: 'E2E 수정 테스트',
      details: [
        {
          freightType: 'F',
          freightCd: 'OFC',
          currencyCd: 'USD',
          rateMin: 120,
          rateBl: 60,
          rateRton: 35,
          cntrDry20: 1600,
          cntrDry40: 2600,
          rateBulk: 3200
        },
        {
          freightType: 'F',
          freightCd: 'BAF',
          currencyCd: 'USD',
          rateMin: 50,
          rateBl: 25,
          rateRton: 15,
          cntrDry20: 200,
          cntrDry40: 350
        }
      ],
      transports: [
        {
          freightCd: 'TRK',
          originCd: 'KRPUS',
          originNm: 'BUSAN',
          destCd: 'KRSEL',
          destNm: 'SEOUL',
          rateLcl: 250,
          rate20ft: 400,
          rate40ft: 550,
          managerNm: '김철수',
          managerTel: '010-9876-5432'
        }
      ]
    }));
    expect(res.ok()).toBeTruthy();
  });

  test('해상 기업운임 수정 확인 (GET)', async ({ request }) => {
    const res = await request.get(`/api/logis/rate/corporate?rateId=${seaRateId}`, hdr());
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.CUSTOMER_NM).toBe('수정거래처');
    expect(body.SALES_REP).toBe('수정영업사원');
    expect(Number(body.INSURANCE_AMT)).toBe(60000);
    expect(body.details.length).toBe(2);
  });

  test('항공 기업운임 생성 (POST)', async ({ request }) => {
    const res = await request.post('/api/logis/rate/corporate', hdrBody({
      transportMode: 'AIR',
      ioType: 'EXPORT',
      bizType: 'LOCAL',
      salesRep: '항공영업사원',
      customerCd: 'CUST002',
      customerNm: '항공테스트거래처',
      carrierCd: 'KE',
      carrierNm: 'KOREAN AIR',
      polCd: 'KRICN',
      polNm: 'INCHEON',
      podCd: 'JPTYO',
      podNm: 'TOKYO',
      insuranceAmt: 30000,
      storageAmt: 20000,
      handlingAmt: 15000,
      remark: 'E2E 항공 테스트',
      details: [
        {
          freightType: 'F',
          freightCd: 'AFC',
          currencyCd: 'USD',
          kgLb: 'KG',
          rateAwb: 50,
          rateMinAir: 200,
          rate45l: 3.5,
          rate45: 3.0,
          rate100: 2.5,
          rate300: 2.0,
          rate500: 1.8,
          rate1000: 1.5
        }
      ],
      transports: []
    }));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.rateNo).toMatch(/^CA-\d{4}-\d{4}$/);
    airRateId = body.rateId;
  });

  test('항공 기업운임 상세조회 (GET)', async ({ request }) => {
    const res = await request.get(`/api/logis/rate/corporate?rateId=${airRateId}`, hdr());
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.TRANSPORT_MODE).toBe('AIR');
    expect(body.CARRIER_NM).toBe('KOREAN AIR');
    expect(body.details.length).toBe(1);
    expect(body.details[0].FREIGHT_CD).toBe('AFC');
  });

  test('해상 기업운임 삭제 (DELETE)', async ({ request }) => {
    const res = await request.delete(`/api/logis/rate/corporate?ids=${seaRateId}`, hdr());
    expect(res.ok()).toBeTruthy();
  });

  test('해상 기업운임 삭제 확인', async ({ request }) => {
    const res = await request.get('/api/logis/rate/corporate?transportMode=SEA', hdr());
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const found = body.find((r: any) => r.RATE_ID === seaRateId);
    expect(found).toBeFalsy();
  });

  test('항공 기업운임 삭제 (DELETE)', async ({ request }) => {
    const res = await request.delete(`/api/logis/rate/corporate?ids=${airRateId}`, hdr());
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('기업운임관리 페이지 로드 테스트', () => {
  test('해상 기업운임관리 목록 페이지', async ({ page }) => {
    await goWithAuth(page, '/logis/rate/corporate/sea');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await expect(page.locator('body')).toBeVisible();
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('항공 기업운임관리 목록 페이지', async ({ page }) => {
    await goWithAuth(page, '/logis/rate/corporate/air');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await expect(page.locator('body')).toBeVisible();
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('해상 기업운임관리 등록 페이지', async ({ page }) => {
    await goWithAuth(page, '/logis/rate/corporate/sea/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await expect(page.locator('text=기본정보')).toBeVisible({ timeout: 10000 });
  });

  test('항공 기업운임관리 등록 페이지', async ({ page }) => {
    await goWithAuth(page, '/logis/rate/corporate/air/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await expect(page.locator('text=기본정보')).toBeVisible({ timeout: 10000 });
  });

  test('기업운임관리 통합 페이지', async ({ page }) => {
    await goWithAuth(page, '/logis/rate/corporate');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('견적등록 기업운임조회 팝업 테스트', () => {
  test('견적등록(해상) - 기업운임조회 버튼 존재 확인', async ({ page }) => {
    await goWithAuth(page, '/logis/quote/sea/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    const btn = page.locator('button:has-text("기업운임조회")');
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('견적등록(항공) - 기업운임조회 버튼 존재 확인', async ({ page }) => {
    await goWithAuth(page, '/logis/quote/air/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    const btn = page.locator('button:has-text("기업운임조회")');
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('견적요청등록 - 기업운임조회 버튼 존재 확인', async ({ page }) => {
    await goWithAuth(page, '/logis/quote/request/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    const btn = page.locator('button:has-text("기업운임조회")');
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('견적등록(해상) - 기업운임조회 팝업 열기/닫기', async ({ page }) => {
    await goWithAuth(page, '/logis/quote/sea/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    const btn = page.locator('button:has-text("기업운임조회")');
    await btn.click();
    await expect(page.locator('text=기업운임 조회')).toBeVisible({ timeout: 5000 });
    const closeBtn = page.getByRole('button', { name: '닫기', exact: true });
    await closeBtn.click();
  });

  test('견적등록(항공) - 기업운임조회 팝업 열기/닫기', async ({ page }) => {
    await goWithAuth(page, '/logis/quote/air/register');
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    const btn = page.locator('button:has-text("기업운임조회")');
    await btn.click();
    await expect(page.locator('text=기업운임 조회')).toBeVisible({ timeout: 5000 });
    const closeBtn = page.getByRole('button', { name: '닫기', exact: true });
    await closeBtn.click();
  });
});
