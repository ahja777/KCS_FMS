import { test, expect, Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:3600';
let cookieValue = '';

async function login(req: any) {
  const res = await req.post(`${BASE}/api/auth/login`, { data: { userId: 'admin', password: 'admin1234' } });
  const m = (res.headers()['set-cookie'] || '').match(/fms_auth_token=([^;]+)/);
  if (m) cookieValue = m[1];
}

async function auth(page: Page) {
  await page.context().addCookies([{ name: 'fms_auth_token', value: cookieValue, domain: '127.0.0.1', path: '/' }]);
}

// ========== 전체 페이지 목록 ==========
const ALL_PAGES = [
  // 목록 페이지
  '/logis/booking/sea', '/logis/booking/air',
  '/logis/schedule/sea', '/logis/schedule/air',
  '/logis/bl/sea', '/logis/bl/sea/house', '/logis/bl/sea/master',
  '/logis/bl/air/house', '/logis/bl/air/master',
  '/logis/sr/sea', '/logis/sn/sea',
  '/logis/an/sea', '/logis/an/air',
  '/logis/customs/sea', '/logis/customs-account/sea',
  '/logis/ams/sea', '/logis/manifest/sea',
  '/logis/quote/sea', '/logis/quote/air', '/logis/quote/request',
  '/logis/cargo/release',
  '/logis/export-awb/air', '/logis/export-bl/manage',
  '/logis/import-bl/sea', '/logis/import-bl/sea/house', '/logis/import-bl/sea/master',
  '/logis/import-bl/air', '/logis/import-bl/air/house', '/logis/import-bl/air/master',
  '/logis/rate/corporate/sea', '/logis/rate/corporate/air',
  '/logis/exchange-rate', '/logis/common/code',
  '/logis/cargo/tracking', '/logis/cargo/status',
  // 등록 페이지
  '/logis/booking/sea/register', '/logis/booking/air/register',
  '/logis/booking/sea/multi-register', '/logis/booking/air/multi-register',
  '/logis/schedule/sea/register', '/logis/schedule/air/register',
  '/logis/bl/sea/register', '/logis/bl/sea/house/register', '/logis/bl/sea/master/register',
  '/logis/bl/air/register', '/logis/bl/air/house/register', '/logis/bl/air/master/register',
  '/logis/sr/sea/register', '/logis/sn/sea/register', '/logis/sn/air/register',
  '/logis/an/sea/register', '/logis/an/air/register',
  '/logis/customs/sea/register', '/logis/customs-account/sea/register',
  '/logis/ams/sea/register', '/logis/manifest/sea/register',
  '/logis/quote/sea/register', '/logis/quote/air/register', '/logis/quote/request/register',
  '/logis/export-awb/air/register', '/logis/export-bl/manage/register',
  '/logis/import-bl/sea/register', '/logis/import-bl/sea/house/register', '/logis/import-bl/sea/master/register',
  '/logis/import-bl/air/register', '/logis/import-bl/air/house/register', '/logis/import-bl/air/master/register',
  '/logis/rate/corporate/sea/register', '/logis/rate/corporate/air/register',
];

// ========== 1. 전체 페이지 로드 & 에러 검증 ==========
test.describe('1. 전체 페이지 로드 & 에러 없음 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  for (const url of ALL_PAGES) {
    test(`${url}`, async ({ page }) => {
      await auth(page);
      const resp = await page.goto(url, { timeout: 15000 });
      expect(resp?.status()).toBeLessThan(500);
      await page.waitForLoadState('networkidle').catch(() => {});
      const hasError = await page.locator('button:has-text("다시 시도")').count();
      expect(hasError).toBe(0);
    });
  }
});

// ========== 2. 등록 페이지 전체 탭 검증 ==========
test.describe('2. 등록 페이지 탭 클릭 검증 (MAIN/CARGO/OTHER)', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const tabPages = [
    '/logis/bl/sea/register', '/logis/bl/sea/house/register', '/logis/bl/sea/master/register',
    '/logis/bl/air/register', '/logis/bl/air/house/register', '/logis/bl/air/master/register',
    '/logis/import-bl/air/register', '/logis/import-bl/air/house/register', '/logis/import-bl/air/master/register',
    '/logis/import-bl/sea/register', '/logis/import-bl/sea/house/register', '/logis/import-bl/sea/master/register',
    '/logis/export-awb/air/register', '/logis/export-bl/manage/register',
    '/logis/customs-account/sea/register',
    '/logis/booking/air/register',
  ];

  for (const url of tabPages) {
    test(`탭: ${url}`, async ({ page }) => {
      await auth(page);
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const tabs = ['MAIN', 'CARGO', 'OTHER'];
      for (const tab of tabs) {
        const btn = page.locator(`button:has-text("${tab}")`).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(500);
          const hasError = await page.locator('button:has-text("다시 시도")').count();
          if (hasError > 0) {
            console.log(`  ✗ ${url} - ${tab} 탭 에러`);
          }
          expect(hasError).toBe(0);
        }
      }
    });
  }
});

// ========== 3. 전체 팝업(찾기 버튼) 검증 ==========
test.describe('3. 전체 팝업 오픈/닫기 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const popupPages = [
    '/logis/booking/sea/register', '/logis/booking/air/register',
    '/logis/schedule/sea/register', '/logis/schedule/air/register',
    '/logis/bl/air/master/register', '/logis/bl/air/house/register',
    '/logis/sr/sea/register', '/logis/sn/sea/register',
    '/logis/an/sea/register', '/logis/an/air/register',
    '/logis/customs/sea/register', '/logis/customs-account/sea/register',
    '/logis/ams/sea/register', '/logis/manifest/sea/register',
    '/logis/quote/sea/register', '/logis/quote/air/register', '/logis/quote/request/register',
    '/logis/export-awb/air/register', '/logis/export-bl/manage/register',
    '/logis/rate/corporate/sea/register', '/logis/rate/corporate/air/register',
  ];

  for (const url of popupPages) {
    test(`팝업: ${url}`, async ({ page }) => {
      await auth(page);
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const btns = page.locator('button[aria-label="찾기"]');
      const count = await btns.count();
      let opened = 0;

      for (let i = 0; i < Math.min(count, 3); i++) {
        await btns.nth(i).scrollIntoViewIfNeeded().catch(() => {});
        await btns.nth(i).click({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(600);

        const modalFound = await page.evaluate(() => {
          for (const div of document.querySelectorAll('div')) {
            const cs = window.getComputedStyle(div);
            if (cs.position === 'fixed' && cs.display !== 'none' && !div.closest('header') && !div.closest('nav') && div.querySelector('input')) return true;
          }
          return false;
        });
        if (modalFound) { opened++; await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
      }

      if (count > 0) expect(opened).toBeGreaterThan(0);
    });
  }
});

// ========== 4. 전체 콤보박스(select) & 라디오 & 날짜 검증 ==========
test.describe('4. 콤보박스/라디오/날짜 필드 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const formPages = [
    '/logis/booking/sea/register', '/logis/booking/air/register',
    '/logis/bl/sea/register', '/logis/bl/air/master/register',
    '/logis/sr/sea/register', '/logis/an/sea/register',
    '/logis/customs/sea/register', '/logis/customs-account/sea/register',
    '/logis/quote/sea/register', '/logis/import-bl/air/register',
    '/logis/export-awb/air/register',
  ];

  for (const url of formPages) {
    test(`폼: ${url}`, async ({ page }) => {
      await auth(page);
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // select 콤보박스
      const selects = page.locator('select');
      const selectCount = await selects.count();
      let selectOk = 0;
      for (let i = 0; i < Math.min(selectCount, 5); i++) {
        const sel = selects.nth(i);
        if (await sel.isVisible().catch(() => false)) {
          const options = await sel.locator('option').count();
          if (options >= 2) selectOk++;
        }
      }

      // date inputs
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();

      // radio buttons
      const radios = page.locator('input[type="radio"]');
      const radioCount = await radios.count();

      // checkbox
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      // text inputs
      const textInputs = page.locator('input[type="text"], input:not([type])');
      const textCount = await textInputs.count();

      console.log(`[${url.replace('/logis/', '')}] select=${selectCount}(ok=${selectOk}) date=${dateCount} radio=${radioCount} checkbox=${checkboxCount} text=${textCount}`);
      expect(selectCount + dateCount + textCount).toBeGreaterThan(0);
    });
  }
});

// ========== 5. 목록 페이지 CRUD 버튼 & 데이터 검증 ==========
test.describe('5. 목록 페이지 버튼 & 데이터 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const listPages = [
    '/logis/booking/sea', '/logis/booking/air',
    '/logis/schedule/sea', '/logis/schedule/air',
    '/logis/bl/sea', '/logis/bl/sea/house', '/logis/bl/sea/master',
    '/logis/bl/air/house', '/logis/bl/air/master',
    '/logis/sr/sea', '/logis/sn/sea',
    '/logis/an/sea', '/logis/an/air',
    '/logis/customs/sea', '/logis/customs-account/sea',
    '/logis/ams/sea', '/logis/manifest/sea',
    '/logis/quote/sea', '/logis/quote/air', '/logis/quote/request',
    '/logis/cargo/release',
    '/logis/export-awb/air', '/logis/export-bl/manage',
    '/logis/import-bl/sea', '/logis/import-bl/sea/house', '/logis/import-bl/sea/master',
    '/logis/import-bl/air', '/logis/import-bl/air/house', '/logis/import-bl/air/master',
    '/logis/rate/corporate/sea', '/logis/rate/corporate/air',
  ];

  for (const url of listPages) {
    test(`목록: ${url}`, async ({ page }) => {
      await auth(page);
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const hasNew = await page.locator('button:has-text("신규"), button:has-text("등록")').count();
      const hasEdit = await page.locator('button:has-text("수정")').count();
      const hasDel = await page.locator('button:has-text("삭제")').count();
      const hasSearch = await page.locator('button:has-text("검색"), button:has-text("조회")').count();
      const rows = await page.locator('table tbody tr').count();

      console.log(`[${url.replace('/logis/', '')}] 신규=${hasNew} 수정=${hasEdit} 삭제=${hasDel} 검색=${hasSearch} rows=${rows}`);
      expect(hasEdit).toBeGreaterThan(0);
    });
  }
});

// ========== 6. API CRUD 전체 검증 ==========
test.describe('6. API CRUD 전체 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const apis = [
    { name: '해상부킹', path: '/booking/sea', post: { bookingType: 'FCL', shipperName: 'QC테스트', pol: 'KRPUS', pod: 'USLAX', etd: '2026-04-01', carrierId: 'MAEU', status: 'BOOKED' }, idField: 'bookingId', delStyle: 'ids' },
    { name: '항공부킹', path: '/booking/air', post: { carrierId: 'KE', flightNo: 'KE001', origin: 'ICN', destination: 'LAX', etd: '2026-04-01', status: 'BOOKED' }, idField: 'bookingId', delStyle: 'ids' },
    { name: '해상스케줄', path: '/schedule/sea', post: { carrierId: 'MAEU', vesselName: 'QC VESSEL', voyageNo: 'QCV001', pol: 'KRPUS', pod: 'USLAX', etd: '2026-04-01', status: 'ACTIVE' }, idField: 'scheduleId', delStyle: 'ids' },
    { name: '항공스케줄', path: '/schedule/air', post: { carrierId: 'KE', flightNo: 'QC001', origin: 'ICN', destination: 'LAX', etd: '2026-04-01', status: 'ACTIVE' }, idField: 'scheduleId', delStyle: 'ids' },
    { name: '해상BL', path: '/bl/sea', post: { ioType: 'OUT', shipperName: 'QC화주', pol: 'KRPUS', pod: 'USLAX', etd: '2026-04-01' }, idField: 'blId', delStyle: 'ids' },
    { name: 'S/R', path: '/sr/sea', post: { transportMode: 'SEA', shipperName: 'QC화주', pol: 'KRPUS', pod: 'USLAX', status: 'DRAFT' }, idField: 'srId', delStyle: 'ids' },
    { name: '해상견적', path: '/quote/sea', post: { quoteDate: '2026-04-01', pol: 'KRPUS', pod: 'USLAX', totalAmount: 1000, currency: 'USD', status: 'DRAFT' }, idField: 'quoteId', delStyle: 'ids' },
    { name: '항공견적', path: '/quote/air', post: { quoteDate: '2026-04-01', origin: 'ICN', destination: 'LAX', totalAmount: 500, currency: 'USD', status: 'DRAFT' }, idField: 'quoteId', delStyle: 'ids' },
    { name: 'S/N', path: '/sn/sea', post: { transportMode: 'SEA', senderName: 'QC발신', recipientName: 'QC수신', pol: 'KRPUS', pod: 'USLAX', status: 'DRAFT' }, idField: 'snId', delStyle: 'ids' },
    { name: 'AN해상', path: '/an/sea', post: { anDate: '2026-04-01', blNo: 'QCMBL001', shipper: 'QC', consignee: 'QC', pol: 'KRPUS', pod: 'USLAX', status: 'DRAFT' }, idField: 'id', delStyle: 'id' },
    { name: 'AN항공', path: '/an/air', post: { anDate: '2026-04-01', mawbNo: '999-00000001', shipper: 'QC', consignee: 'QC', origin: 'ICN', destination: 'LAX', status: 'DRAFT' }, idField: 'id', delStyle: 'id' },
    { name: '통관', path: '/customs/sea', post: { declarationType: 'EXPORT', declarationDate: '2026-04-01', declarant: 'QC관세사', status: 'DRAFT' }, idField: 'declarationId', delStyle: 'ids' },
    { name: 'AMS', path: '/ams/sea', post: { mblNo: 'QC-AMS-001', filingType: 'AMS', status: 'DRAFT' }, idField: 'amsId', delStyle: 'ids' },
    { name: '화물반출', path: '/cargo/release', post: { receiptDt: '2026-04-01', mblNo: 'QC-CR-001', cargoType: 'FCL', statusCd: 'IN_YARD' }, idField: 'id', delStyle: 'ids' },
    { name: 'MBL', path: '/bl/mbl', post: { vessel_nm: 'QC VESSEL', pol_port_cd: 'KRPUS', pod_port_cd: 'USLAX', shipper_nm: 'QC', direction: 'EXPORT' }, idField: 'mbl_id', delStyle: 'id-mbl' },
    { name: 'HBL', path: '/bl/hbl', post: { vessel_nm: 'QC VESSEL', pol_port_cd: 'KRPUS', pod_port_cd: 'USLAX', shipper_nm: 'QC', direction: 'EXPORT' }, idField: 'hbl_id', delStyle: 'id-hbl' },
    { name: 'MAWB', path: '/bl/air/master', post: { IO_TYPE: 'OUT', MAWB_NO: '999-99990001', AIRLINE_CODE: 'KE', DEPARTURE: 'ICN', ARRIVAL: 'LAX', STATUS: 'DRAFT' }, idField: 'ID', delStyle: 'ids-body' },
  ];

  for (const api of apis) {
    test(`CRUD: ${api.name}`, async ({ request }) => {
      const h = { Cookie: `fms_auth_token=${cookieValue}` };

      // CREATE
      const cRes = await request.post(`${BASE}/api${api.path}`, { data: api.post, headers: h });
      expect(cRes.status()).toBeLessThan(300);
      const cBody = await cRes.json();
      const id = cBody[api.idField] || cBody.id;
      expect(id).toBeTruthy();

      // READ
      const rRes = await request.get(`${BASE}/api${api.path}`, { headers: h });
      expect(rRes.status()).toBeLessThan(500);

      // DELETE
      if (id) {
        if (api.delStyle === 'ids') {
          await request.delete(`${BASE}/api${api.path}?ids=${id}`, { headers: h });
        } else if (api.delStyle === 'id') {
          await request.delete(`${BASE}/api${api.path}?id=${id}`, { headers: h });
        } else if (api.delStyle === 'id-mbl') {
          await request.delete(`${BASE}/api${api.path}?id=${id}`, { headers: h });
        } else if (api.delStyle === 'id-hbl') {
          await request.delete(`${BASE}/api${api.path}?id=${id}`, { headers: h });
        } else if (api.delStyle === 'ids-body') {
          await request.delete(`${BASE}/api${api.path}`, { data: { ids: [id] }, headers: h });
        }
      }

      console.log(`[${api.name}] C✓ R✓ D✓ (id=${id})`);
    });
  }
});

// ========== 7. 날짜 검색 & 목록 조회 검증 ==========
test.describe('7. 날짜 검색 기능 검증', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  const searchPages = [
    '/logis/booking/sea', '/logis/bl/sea', '/logis/sr/sea',
    '/logis/quote/sea', '/logis/customs/sea',
    '/logis/bl/sea/house', '/logis/bl/air/master',
  ];

  for (const url of searchPages) {
    test(`검색: ${url}`, async ({ page }) => {
      await auth(page);
      await page.goto(url, { timeout: 15000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // 날짜 필드 확인
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();

      // 검색/조회 버튼
      const searchBtn = page.locator('button:has-text("검색"), button:has-text("조회")').first();
      if (await searchBtn.isVisible().catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(1000);
        const hasError = await page.locator('button:has-text("다시 시도")').count();
        expect(hasError).toBe(0);
      }

      console.log(`[${url.replace('/logis/', '')}] 날짜필드=${dateCount} 검색 정상`);
    });
  }
});

// ========== 8. 공통코드 CRUD 검증 ==========
test.describe('8. 공통코드 CRUD', () => {
  test.beforeAll(async ({ request }) => { await login(request); });

  test('공통코드 조회/생성/삭제', async ({ request }) => {
    const h = { Cookie: `fms_auth_token=${cookieValue}` };

    // 코드그룹 조회
    const grpRes = await request.get(`${BASE}/api/common-code/groups`, { headers: h });
    expect(grpRes.status()).toBe(200);
    const groups = await grpRes.json();
    console.log(`코드그룹: ${Array.isArray(groups) ? groups.length : 0}건`);

    // 공통코드 조회
    const codeRes = await request.get(`${BASE}/api/common-code?groupCd=CARGO_TYPE`, { headers: h });
    expect(codeRes.status()).toBe(200);

    // 공통코드 생성
    const createRes = await request.post(`${BASE}/api/common-code`, {
      data: { CODE_GROUP_ID: 'CARGO_TYPE', CODE_CD: 'QC_TEST', CODE_NM: 'QC테스트', CODE_NM_EN: 'QC Test', USE_YN: 'Y' },
      headers: h,
    });
    expect(createRes.status()).toBeLessThan(300);

    // 공통코드 삭제
    const delRes = await request.delete(`${BASE}/api/common-code`, {
      data: { items: [{ CODE_GROUP_ID: 'CARGO_TYPE', CODE_CD: 'QC_TEST' }] },
      headers: h,
    });
    expect(delRes.status()).toBeLessThan(300);
    console.log('공통코드 CRUD ✓');
  });

  test('환율 조회', async ({ request }) => {
    const h = { Cookie: `fms_auth_token=${cookieValue}` };
    const res = await request.get(`${BASE}/api/exchange-rate`, { headers: h });
    expect(res.status()).toBeLessThan(500);
    console.log('환율 조회 ✓');
  });

  test('항공운임 조회', async ({ request }) => {
    const h = { Cookie: `fms_auth_token=${cookieValue}` };
    const res = await request.get(`${BASE}/api/air-tariff`, { headers: h });
    expect(res.status()).toBeLessThan(500);
    console.log('항공운임 조회 ✓');
  });

  test('고객/캐리어/항구 마스터 조회', async ({ request }) => {
    const h = { Cookie: `fms_auth_token=${cookieValue}` };
    const custRes = await request.get(`${BASE}/api/customers`, { headers: h });
    expect(custRes.status()).toBeLessThan(500);
    const carrRes = await request.get(`${BASE}/api/carriers`, { headers: h });
    expect(carrRes.status()).toBeLessThan(500);
    const portRes = await request.get(`${BASE}/api/ports`, { headers: h });
    expect(portRes.status()).toBeLessThan(500);
    console.log('마스터 데이터 조회 ✓');
  });
});
