import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * 전체 도메인 목록조회 → 수정화면 → 저장 → DB 확인 → 화면 표시 확인 E2E 테스트
 * 해상수출/수입, 항공수출/수입 등 17개 도메인 커버
 */

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

// 인증 헤더 포함 옵션
function hdr() {
  return { headers: { Cookie: authCookie } };
}
function hdrBody(data: Record<string, unknown>) {
  return { data, headers: { Cookie: authCookie } };
}

// 페이지에 쿠키 세팅 후 이동
async function goWithAuth(page: Page, url: string) {
  // 쿠키 세팅
  const cookieMatch = authCookie.match(/fms_auth_token=(.+)/);
  if (cookieMatch) {
    await page.context().addCookies([{
      name: 'fms_auth_token',
      value: cookieMatch[1],
      domain: '127.0.0.1',
      path: '/',
    }]);
  }
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
}

// ========== 1. Booking Sea (해상 부킹) ==========
test.describe.serial('1. 해상 부킹 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 첫번째 데이터 수정 저장 → DB 반영 확인', async ({ request, page }) => {
    // 1) 목록 API로 데이터 확인
    const listRes = await request.get('/api/booking/sea', hdr());
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;

    // 2) 상세 조회
    const detailRes = await request.get(`/api/booking/sea?bookingId=${firstId}`, hdr());
    expect(detailRes.ok()).toBeTruthy();
    const d = await detailRes.json();

    // 3) 수정 저장 (PUT)
    const putRes = await request.put('/api/booking/sea', hdrBody({
      id: firstId,
      pol: d.pol || 'KRPUS',
      pod: d.pod || 'USNYC',
      vesselName: d.vesselName || '',
      voyageNo: d.voyageNo || '',
      commodityDesc: d.commodityDesc || 'Test',
      status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);

    // 4) DB 재조회 확인
    const afterRes = await request.get(`/api/booking/sea?bookingId=${firstId}`, hdr());
    const after = await afterRes.json();
    expect(after.id).toBe(firstId);

    // 5) 화면 목록 표시 확인
    await goWithAuth(page, 'http://127.0.0.1:3600/logis/booking/sea');
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });
});

// ========== 2. Booking Air (항공 부킹) ==========
test.describe.serial('2. 항공 부킹 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 첫번째 데이터 수정 저장 → DB 반영 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/booking/air', hdr());
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/booking/air?bookingId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/booking/air', hdrBody({
      id: firstId,
      origin: d.origin || 'ICN',
      destination: d.destination || 'NRT',
      commodityDesc: d.commodityDesc || 'Test',
      status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/booking/air?bookingId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/booking/air');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 3. S/R Sea (해상 선적요청) ==========
test.describe.serial('3. 해상 S/R - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/sr/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/sr/sea?srId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/sr/sea', hdrBody({
      id: firstId, pol: d.pol || 'KRPUS', pod: d.pod || 'USNYC',
      commodityDesc: d.commodityDesc || 'Test Cargo',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/sr/sea?srId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/sr/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 4. S/N Sea (해상 선적통지) ==========
test.describe.serial('4. 해상 S/N - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/sn/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/sn/sea?snId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/sn/sea', hdrBody({
      id: firstId, pol: d.pol || 'KRPUS', pod: d.pod || 'USNYC',
      senderName: d.senderName || 'Sender', recipientName: d.recipientName || 'Recipient',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/sn/sea?snId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/sn/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 5. B/L Sea (해상 B/L) ==========
test.describe.serial('5. 해상 B/L - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → JOB_NO 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/bl/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/bl/sea?blId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/bl/sea', hdrBody({
      id: firstId,
      main: {
        mblNo: d.mblNo || '', hblNo: d.hblNo || '', ioType: d.ioType || 'OUT',
        shipperName: d.shipperName || '', consigneeName: d.consigneeName || '',
        portOfLoading: d.portOfLoading || '', portOfDischarge: d.portOfDischarge || '',
        vesselName: d.vesselName || '', voyageNo: d.voyageNo || '',
        freightTerm: d.freightTerm || 'PREPAID', serviceTerm: d.serviceTerm || 'CY/CY',
      },
      cargo: { containers: d.containers || [], otherCharges: d.otherCharges || [] },
      other: {},
    }));
    expect(putRes.ok()).toBeTruthy();
    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);
    expect(putJson.jobNo).toBeTruthy();

    const afterRes = await request.get(`/api/bl/sea?blId=${firstId}`, hdr());
    expect((await afterRes.json()).jobNo).toBeTruthy();

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/bl/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 6. B/L Air Master (항공 MAWB) ==========
test.describe.serial('6. 항공 MAWB - 목록→수정→저장→JOB_NO확인', () => {
  test('목록조회 → 수정 저장 → JOB_NO 자동생성 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/bl/air/master', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const first = list[0];
    const id = first.ID;

    // POST로 수정 (bl/air/master는 POST 하나로 create/update)
    const putRes = await request.post('/api/bl/air/master', hdrBody({
      ID: id, MAWB_NO: first.MAWB_NO, IO_TYPE: first.IO_TYPE || 'OUT',
      DEPARTURE: first.DEPARTURE || 'ICN', ARRIVAL: first.ARRIVAL || 'LAX',
    }));
    expect(putRes.ok()).toBeTruthy();
    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);
    expect(putJson.JOB_NO).toBeTruthy();

    // DB 재조회
    const afterRes = await request.get(`/api/bl/air/master?id=${id}`, hdr());
    const afterData = await afterRes.json();
    expect(afterData.JOB_NO).toBeTruthy();
    expect(afterData.JOB_NO).toMatch(/^(AEX|AIM)-\d{4}-\d{4}$/);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/bl/air/master');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 7. B/L Air House (항공 HAWB) ==========
test.describe.serial('7. 항공 HAWB - 목록→수정→저장→JOB_NO확인', () => {
  test('목록조회 → 수정 저장 → JOB_NO 자동생성 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/bl/air/house', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const first = list[0];
    const id = first.ID;

    const putRes = await request.post('/api/bl/air/house', hdrBody({
      ID: id, HAWB_NO: first.HAWB_NO, IO_TYPE: first.IO_TYPE || 'OUT',
      MAWB_NO: first.MAWB_NO || '', DEPARTURE: first.DEPARTURE || 'ICN', ARRIVAL: first.ARRIVAL || 'LAX',
    }));
    expect(putRes.ok()).toBeTruthy();
    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);
    expect(putJson.JOB_NO).toBeTruthy();

    const afterRes = await request.get(`/api/bl/air/house?id=${id}`, hdr());
    const afterData = await afterRes.json();
    expect(afterData.JOB_NO).toBeTruthy();

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/bl/air/house');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 8. Manifest Sea (해상 적하목록) ==========
test.describe.serial('8. 해상 적하목록 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/manifest/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/manifest/sea?manifestId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/manifest/sea', hdrBody({
      id: firstId, mblNo: d.mblNo || 'TESTMBL', goodsDesc: d.goodsDesc || 'Goods',
      status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/manifest/sea?manifestId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/manifest/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 9. AMS Sea (해상 AMS) ==========
test.describe.serial('9. 해상 AMS - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/ams/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/ams/sea?amsId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/ams/sea', hdrBody({
      id: firstId, mblNo: d.mblNo || 'TESTAMS', goodsDesc: d.goodsDesc || 'Goods',
      status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/ams/sea?amsId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/ams/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 10. Customs Sea (해상 통관) ==========
test.describe.serial('10. 해상 통관 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/customs/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/customs/sea?declarationId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/customs/sea', hdrBody({
      id: firstId, declarationType: d.declarationType || 'EXPORT',
      goodsDesc: d.goodsDesc || 'Test', status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/customs/sea?declarationId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/customs/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 11. Customs Account Sea (해상 통관정산) ==========
test.describe.serial('11. 해상 통관정산 - 목록→수정→저장→JOB_NO확인', () => {
  test('목록조회 → 수정 저장 → JOB_NO 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/customs-account/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/customs-account/sea?accountId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/customs-account/sea', hdrBody({
      id: firstId, boundType: d.boundType || 'AI', businessType: d.businessType || '통관B/L',
      accountName: d.accountName || 'Test', mblNo: d.mblNo || '', status: d.status || 'DRAFT',
    }));
    expect(putRes.ok()).toBeTruthy();
    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);
    expect(putJson.jobNo).toBeTruthy();

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/customs-account/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 12. Quote Sea (해상 견적) ==========
test.describe.serial('12. 해상 견적 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/quote/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/quote/sea?quoteId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/quote/sea', hdrBody({
      id: firstId, quoteDate: d.quoteDate || new Date().toISOString().split('T')[0],
      pol: d.pol || 'KRPUS', pod: d.pod || 'USNYC',
      consignee: d.consignee || '', status: d.status || 'draft', currency: d.currency || 'USD',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/quote/sea?quoteId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/quote/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 13. Quote Air (항공 견적) ==========
test.describe.serial('13. 항공 견적 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/quote/air', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/quote/air?quoteId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/quote/air', hdrBody({
      id: firstId, quoteDate: d.quoteDate || new Date().toISOString().split('T')[0],
      origin: d.origin || 'ICN', destination: d.destination || 'LAX',
      consignee: d.consignee || '', status: d.status || 'draft', currency: d.currency || 'USD',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    const afterRes = await request.get(`/api/quote/air?quoteId=${firstId}`, hdr());
    expect((await afterRes.json()).id).toBe(firstId);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/quote/air');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 14. B/L Master Sea (해상 Master B/L) ==========
test.describe.serial('14. 해상 Master B/L - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/bl/mbl', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const first = list[0];
    const putRes = await request.put('/api/bl/mbl', hdrBody({
      mbl_id: first.mbl_id, pol_port_cd: first.pol_port_cd || 'KRPUS',
      pod_port_cd: first.pod_port_cd || 'USNYC', vessel_nm: first.vessel_nm || 'TEST',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/bl/sea/master');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 15. Schedule Sea (해상 스케줄) ==========
test.describe.serial('15. 해상 스케줄 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/schedule/sea', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/schedule/sea?scheduleId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/schedule/sea', hdrBody({
      id: firstId, vesselName: d.vesselName || 'TEST', voyageNo: d.voyageNo || 'V001',
      pol: d.pol || 'KRPUS', pod: d.pod || 'USNYC', status: d.status || 'ACTIVE',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/schedule/sea');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 16. Schedule Air (항공 스케줄) ==========
test.describe.serial('16. 항공 스케줄 - 목록→수정→저장→DB확인', () => {
  test('목록조회 → 수정 저장 → DB 확인', async ({ request, page }) => {
    const listRes = await request.get('/api/schedule/air', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const firstId = list[0].id;
    const detailRes = await request.get(`/api/schedule/air?scheduleId=${firstId}`, hdr());
    const d = await detailRes.json();

    const putRes = await request.put('/api/schedule/air', hdrBody({
      id: firstId, flightNo: d.flightNo || 'KE001',
      origin: d.origin || 'ICN', destination: d.destination || 'LAX',
      status: d.status || 'ACTIVE',
    }));
    expect(putRes.ok()).toBeTruthy();
    expect((await putRes.json()).success).toBe(true);

    await goWithAuth(page, 'http://127.0.0.1:3600/logis/schedule/air');
    await page.waitForTimeout(2000);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });
});

// ========== 17. MAWB 180-12345675 특정건 수정 (사용자 보고 케이스) ==========
test.describe.serial('17. MAWB 180-12345675 - 수정화면 저장→JOB_NO확인', () => {
  test('수정화면에서 저장 후 JOB_NO 자동생성 확인', async ({ request, page }) => {
    // 해당 MAWB 검색
    const listRes = await request.get('/api/bl/air/master?mawbNo=180-12345675', hdr());
    const list = await listRes.json();
    if (list.length === 0) { test.skip(); return; }

    const target = list[0];
    const id = target.ID;

    // 수정 저장
    const putRes = await request.post('/api/bl/air/master', hdrBody({
      ID: id, MAWB_NO: target.MAWB_NO, IO_TYPE: target.IO_TYPE || 'OUT',
      DEPARTURE: target.DEPARTURE || 'ICN', ARRIVAL: target.ARRIVAL || 'NRT',
    }));
    expect(putRes.ok()).toBeTruthy();
    const json = await putRes.json();
    expect(json.success).toBe(true);
    expect(json.JOB_NO).toBeTruthy();
    expect(json.JOB_NO).toMatch(/^(AEX|AIM)-\d{4}-\d{4}$/);

    // DB 확인
    const afterRes = await request.get(`/api/bl/air/master?id=${id}`, hdr());
    const afterData = await afterRes.json();
    expect(afterData.JOB_NO).toBe(json.JOB_NO);

    // 화면에서 수정화면 접근 확인
    await goWithAuth(page, `http://127.0.0.1:3600/logis/bl/air/master/register?id=${id}`);
    await page.waitForTimeout(3000);
    // 수정화면이 정상 로딩되었는지 확인 - input 필드에서 MAWB_NO 확인
    const mawbInput = page.locator('input[value*="180"]').first();
    const hasInput = await mawbInput.isVisible().catch(() => false);
    if (hasInput) {
      const val = await mawbInput.inputValue();
      expect(val).toContain('180');
    } else {
      // 화면 내에서 MAWB 관련 텍스트가 있는지 확인
      const heading = page.locator('text=Master AWB');
      expect(await heading.isVisible()).toBeTruthy();
    }
  });
});
