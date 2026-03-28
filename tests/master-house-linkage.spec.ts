import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3600';
let authCookie = '';

async function login(req: any) {
  if (authCookie) return;
  const res = await req.post(`${BASE}/api/auth/login`, { data: { userId: 'admin', password: 'admin1234' } });
  const m = (res.headers()['set-cookie'] || '').match(/fms_auth_token=([^;]+)/);
  if (m) authCookie = `fms_auth_token=${m[1]}`;
}
function h() { return { Cookie: authCookie }; }

async function api(req: any, method: string, path: string, data?: any) {
  const opts: any = { headers: h() };
  if (data) opts.data = data;
  const res = method === 'GET' ? await req.get(`${BASE}/api${path}`, opts)
    : method === 'POST' ? await req.post(`${BASE}/api${path}`, opts)
    : method === 'DELETE' ? await req.delete(`${BASE}/api${path}`, opts)
    : await req.put(`${BASE}/api${path}`, opts);
  return { status: res.status(), body: await res.json().catch(() => null) };
}

// ========== 복합운송 실무 데이터 ==========
const VESSELS = ['HMM ALGECIRAS', 'EVER GIVEN', 'MSC GULSUN', 'CMA CGM MARCO POLO'];
const SHIPPERS_KR = ['삼성전자(주)', '현대자동차(주)', 'LG전자(주)', 'SK하이닉스(주)', '포스코(주)'];
const CONSIGNEES_US = ['Apple Inc.', 'Tesla Motors', 'Amazon.com LLC', 'Microsoft Corp.', 'Google LLC'];
const CONSIGNEES_JP = ['Sony Corp.', 'Toyota Motor', 'Honda Motor', 'Panasonic', 'Mitsubishi'];
const COMMODITIES = ['반도체 웨이퍼', '자동차 엔진부품', 'LCD 패널', 'DRAM 모듈', '냉연강판'];

function pad(n: number, l = 2) { return String(n).padStart(l, '0'); }

// ========== 테스트 ==========
test.describe('Master 1건 - House 2~3건 연결 CRUD 테스트', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
    expect(authCookie).toBeTruthy();
  });

  // =============================================
  // 해상수출: MBL 1건 + HBL 3건 x 30세트 = MBL 30건 + HBL 90건
  // =============================================
  test('[해상수출] MBL 30건 + HBL 90건 (1:3 연결)', async ({ request }) => {
    test.setTimeout(300000);
    let mblOk = 0, hblOk = 0, linkOk = 0;
    const mblIds: number[] = [];

    for (let i = 0; i < 30; i++) {
      // MBL 생성
      const mbl = await api(request, 'POST', '/bl/mbl', {
        vessel_nm: VESSELS[i % 4],
        voyage_no: `SEV${pad(100 + i, 4)}E`,
        pol_port_cd: ['KRPUS', 'KRINC', 'KRKAN'][i % 3],
        pod_port_cd: ['USLAX', 'CNSHA', 'JPYOK', 'DEHAM', 'SGSIN'][i % 5],
        etd_dt: `2026-04-${pad((i % 28) + 1)}`,
        eta_dt: `2026-05-${pad((i % 28) + 1)}`,
        on_board_dt: `2026-04-${pad((i % 28) + 1)}`,
        shipper_nm: SHIPPERS_KR[i % 5],
        consignee_nm: CONSIGNEES_US[i % 5],
        notify_party: CONSIGNEES_US[i % 5],
        total_pkg_qty: 100 + i * 10,
        pkg_type_cd: 'CTN',
        gross_weight_kg: 5000 + i * 500,
        volume_cbm: 50 + i * 5,
        commodity_desc: `[해상수출] ${COMMODITIES[i % 5]} Shipment #${i + 1}`,
        freight_term_cd: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
        bl_type_cd: 'ORIGINAL',
        direction: 'EXPORT',
      });

      if (mbl.status < 300 && mbl.body?.mbl_id) {
        mblOk++;
        const mblId = mbl.body.mbl_id;
        const mblNo = mbl.body.mbl_no;
        mblIds.push(mblId);

        // HBL 3건 연결
        for (let j = 0; j < 3; j++) {
          const hbl = await api(request, 'POST', '/bl/hbl', {
            mbl_id: mblId,
            vessel_nm: VESSELS[i % 4],
            voyage_no: `SEV${pad(100 + i, 4)}E`,
            pol_port_cd: ['KRPUS', 'KRINC', 'KRKAN'][i % 3],
            pod_port_cd: ['USLAX', 'CNSHA', 'JPYOK', 'DEHAM', 'SGSIN'][i % 5],
            etd_dt: `2026-04-${pad((i % 28) + 1)}`,
            eta_dt: `2026-05-${pad((i % 28) + 1)}`,
            on_board_dt: `2026-04-${pad((i % 28) + 1)}`,
            issue_dt: `2026-04-${pad((i % 28) + 1)}`,
            issue_place: 'BUSAN, KOREA',
            shipper_nm: `${SHIPPERS_KR[i % 5]} ${['제1공장', '제2공장', '물류센터'][j]}`,
            shipper_addr: `서울시 강남구 ${i * 3 + j + 1}번지`,
            consignee_nm: `${CONSIGNEES_US[(i + j) % 5]} - Div.${j + 1}`,
            consignee_addr: `${100 + i * 3 + j} Commerce Way, Suite ${j + 1}`,
            notify_party: CONSIGNEES_US[(i + j) % 5],
            total_pkg_qty: 30 + j * 10,
            pkg_type_cd: ['CTN', 'PLT', 'PKG'][j],
            gross_weight_kg: 1500 + j * 500,
            volume_cbm: 15 + j * 5,
            commodity_desc: `[HBL-${j + 1}] ${COMMODITIES[(i + j) % 5]} - Part ${j + 1}/3`,
            hs_code: `${pad(8400 + i, 4)}.${pad(10 + j, 2)}`,
            marks_nos: `MARKS: MBL#${mblNo}/HBL-${j + 1}`,
            freight_term_cd: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
            bl_type_cd: ['ORIGINAL', 'SEAWAY', 'SURRENDER'][j],
            original_bl_count: 3,
            direction: 'EXPORT',
          });

          if (hbl.status < 300 && hbl.body?.success) hblOk++;
        }
      }
    }

    console.log(`[해상수출] MBL: ${mblOk}/30, HBL: ${hblOk}/90`);
    expect(mblOk).toBe(30);
    expect(hblOk).toBe(90);

    // 연결 검증: 각 MBL에 HBL 3건이 연결되었는지 확인
    const mblList = await api(request, 'GET', '/bl/mbl?direction=EXPORT');
    if (Array.isArray(mblList.body)) {
      for (const mbl of mblList.body.slice(0, 10)) {
        if (mblIds.includes(mbl.mbl_id) && mbl.hbl_count === 3) linkOk++;
      }
    }
    console.log(`[해상수출] MBL→HBL 연결 검증: ${linkOk}/10 (hbl_count=3)`);
    expect(linkOk).toBeGreaterThanOrEqual(5);
  });

  // =============================================
  // 해상수입: MBL 1건 + HBL 2건 x 30세트 = MBL 30건 + HBL 60건
  // =============================================
  test('[해상수입] MBL 30건 + HBL 60건 (1:2 연결)', async ({ request }) => {
    test.setTimeout(300000);
    let mblOk = 0, hblOk = 0, linkOk = 0;
    const mblIds: number[] = [];

    for (let i = 0; i < 30; i++) {
      const mbl = await api(request, 'POST', '/bl/mbl', {
        vessel_nm: VESSELS[i % 4],
        voyage_no: `SIV${pad(200 + i, 4)}W`,
        pol_port_cd: ['CNSHA', 'USLAX', 'JPYOK', 'DEHAM', 'SGSIN'][i % 5],
        pod_port_cd: ['KRPUS', 'KRINC'][i % 2],
        etd_dt: `2026-03-${pad((i % 28) + 1)}`,
        eta_dt: `2026-04-${pad((i % 28) + 1)}`,
        shipper_nm: CONSIGNEES_US[i % 5],
        consignee_nm: SHIPPERS_KR[i % 5],
        total_pkg_qty: 80 + i * 8,
        gross_weight_kg: 4000 + i * 400,
        commodity_desc: `[해상수입] ${COMMODITIES[i % 5]} Import #${i + 1}`,
        direction: 'IMPORT',
      });

      if (mbl.status < 300 && mbl.body?.mbl_id) {
        mblOk++;
        const mblId = mbl.body.mbl_id;
        mblIds.push(mblId);

        for (let j = 0; j < 2; j++) {
          const hbl = await api(request, 'POST', '/bl/hbl', {
            mbl_id: mblId,
            vessel_nm: VESSELS[i % 4],
            voyage_no: `SIV${pad(200 + i, 4)}W`,
            pol_port_cd: ['CNSHA', 'USLAX', 'JPYOK', 'DEHAM', 'SGSIN'][i % 5],
            pod_port_cd: ['KRPUS', 'KRINC'][i % 2],
            etd_dt: `2026-03-${pad((i % 28) + 1)}`,
            eta_dt: `2026-04-${pad((i % 28) + 1)}`,
            issue_place: ['SHANGHAI', 'LOS ANGELES', 'TOKYO', 'HAMBURG', 'SINGAPORE'][i % 5],
            shipper_nm: `${CONSIGNEES_US[(i + j) % 5]} Export Div.${j + 1}`,
            consignee_nm: `${SHIPPERS_KR[(i + j) % 5]} 수입팀`,
            total_pkg_qty: 40 + j * 15,
            gross_weight_kg: 2000 + j * 800,
            commodity_desc: `[수입HBL-${j + 1}] ${COMMODITIES[(i + j) % 5]}`,
            direction: 'IMPORT',
          });
          if (hbl.status < 300 && hbl.body?.success) hblOk++;
        }
      }
    }

    console.log(`[해상수입] MBL: ${mblOk}/30, HBL: ${hblOk}/60`);
    expect(mblOk).toBe(30);
    expect(hblOk).toBe(60);

    const mblList = await api(request, 'GET', '/bl/mbl?direction=IMPORT');
    if (Array.isArray(mblList.body)) {
      for (const mbl of mblList.body.slice(0, 10)) {
        if (mblIds.includes(mbl.mbl_id) && mbl.hbl_count === 2) linkOk++;
      }
    }
    console.log(`[해상수입] MBL→HBL 연결 검증: ${linkOk}/10 (hbl_count=2)`);
    expect(linkOk).toBeGreaterThanOrEqual(5);
  });

  // =============================================
  // 항공수출: MAWB 1건 + HAWB 3건 x 30세트 = MAWB 30건 + HAWB 90건
  // =============================================
  test('[항공수출] MAWB 30건 + HAWB 90건 (1:3 연결)', async ({ request }) => {
    test.setTimeout(300000);
    let mawbOk = 0, hawbOk = 0, linkOk = 0;
    const mawbIds: number[] = [];

    for (let i = 0; i < 30; i++) {
      const airlineCode = ['KE', 'OZ', 'AA', 'UA', 'CX', 'SQ'][i % 6];
      const mawbNo = `${pad(180 + (i % 10), 3)}-${pad(70000000 + i, 8)}`;

      const mawb = await api(request, 'POST', '/bl/air/master', {
        IO_TYPE: 'OUT',
        MAWB_NO: mawbNo,
        AIRLINE_CODE: airlineCode,
        AIRLINE_NAME: ['대한항공', '아시아나', 'American Airlines', 'United Airlines', 'Cathay Pacific', 'Singapore Airlines'][i % 6],
        DEPARTURE: ['ICN', 'GMP', 'PUS'][i % 3],
        ARRIVAL: ['LAX', 'JFK', 'ORD', 'NRT', 'PVG', 'SIN'][i % 6],
        FLIGHT_NO: `${airlineCode}${pad(100 + i, 3)}`,
        FLIGHT_DATE: `2026-04-${pad((i % 28) + 1)}`,
        OB_DATE: `2026-04-${pad((i % 28) + 1)}`,
        AR_DATE: `2026-04-${pad(((i % 28) + 2) > 28 ? 28 : (i % 28) + 2)}`,
        SHIPPER_NAME: SHIPPERS_KR[i % 5],
        SHIPPER_ADDRESS: `서울시 강남구 ${i + 1}번길`,
        CONSIGNEE_NAME: CONSIGNEES_US[i % 5],
        CONSIGNEE_ADDRESS: `${i + 1} Industrial Blvd`,
        TOTAL_PIECES: 30 + i * 5,
        TOTAL_WEIGHT: 300 + i * 50,
        CHARGEABLE_WEIGHT: 350 + i * 50,
        HAWB_COUNT: 3,
        NATURE_OF_GOODS: `[항공수출] ${COMMODITIES[i % 5]}`,
        CURRENCY: 'KRW',
        KG_LB: 'KG',
        BIZ_TYPE: 'CONSOL',
        STATUS: 'DRAFT',
      });

      if (mawb.status < 300 && mawb.body?.ID) {
        mawbOk++;
        const mawbId = mawb.body.ID;
        mawbIds.push(mawbId);

        for (let j = 0; j < 3; j++) {
          const hawb = await api(request, 'POST', '/bl/air/house', {
            MAWB_ID: mawbId,
            MAWB_NO: mawbNo,
            IO_TYPE: 'OUT',
            HAWB_NO: `HAWB-EX-${pad(i + 1, 3)}-${j + 1}`,
            DEPARTURE: ['ICN', 'GMP', 'PUS'][i % 3],
            ARRIVAL: ['LAX', 'JFK', 'ORD', 'NRT', 'PVG', 'SIN'][i % 6],
            FLIGHT_NO: `${airlineCode}${pad(100 + i, 3)}`,
            FLIGHT_DATE: `2026-04-${pad((i % 28) + 1)}`,
            OB_DATE: `2026-04-${pad((i % 28) + 1)}`,
            SHIPPER_NAME: `${SHIPPERS_KR[(i + j) % 5]} 수출${j + 1}팀`,
            SHIPPER_ADDRESS: `서울시 ${i * 3 + j + 1}`,
            CONSIGNEE_NAME: `${CONSIGNEES_US[(i + j) % 5]} Dept.${j + 1}`,
            CONSIGNEE_ADDRESS: `${100 + j} Dest Blvd`,
            PIECES: 10 + j * 5,
            GROSS_WEIGHT: 100 + j * 50,
            CHARGEABLE_WEIGHT: 120 + j * 50,
            COMMODITY: `[HAWB-${j + 1}] ${COMMODITIES[(i + j) % 5]}`,
            NATURE_OF_GOODS: `${COMMODITIES[(i + j) % 5]} Part ${j + 1}/3`,
            STATUS: 'DRAFT',
          });
          if (hawb.status < 300 && hawb.body?.success) hawbOk++;
        }
      }
    }

    console.log(`[항공수출] MAWB: ${mawbOk}/30, HAWB: ${hawbOk}/90`);
    expect(mawbOk).toBe(30);
    expect(hawbOk).toBe(90);

    // HAWB에 MAWB_NO가 연결되었는지 확인
    const hawbList = await api(request, 'GET', '/bl/air/house?ioType=OUT');
    if (Array.isArray(hawbList.body)) {
      const linked = hawbList.body.filter((h: any) => h.MAWB_ID && h.MAWB_NO && mawbIds.includes(h.MAWB_ID));
      linkOk = linked.length;
    }
    console.log(`[항공수출] HAWB→MAWB 연결 검증: ${linkOk}건 (목표 90)`);
    expect(linkOk).toBeGreaterThanOrEqual(80);
  });

  // =============================================
  // 항공수입: MAWB 1건 + HAWB 2건 x 30세트 = MAWB 30건 + HAWB 60건
  // =============================================
  test('[항공수입] MAWB 30건 + HAWB 60건 (1:2 연결)', async ({ request }) => {
    test.setTimeout(300000);
    let mawbOk = 0, hawbOk = 0, linkOk = 0;
    const mawbIds: number[] = [];

    for (let i = 0; i < 30; i++) {
      const airlineCode = ['KE', 'OZ', 'CX', 'SQ', 'EK', 'TK'][i % 6];
      const mawbNo = `${pad(200 + (i % 10), 3)}-${pad(80000000 + i, 8)}`;

      const mawb = await api(request, 'POST', '/bl/air/master', {
        IO_TYPE: 'IN',
        MAWB_NO: mawbNo,
        AIRLINE_CODE: airlineCode,
        AIRLINE_NAME: ['대한항공', '아시아나', 'Cathay Pacific', 'Singapore Airlines', 'Emirates', 'Turkish Airlines'][i % 6],
        DEPARTURE: ['LAX', 'JFK', 'NRT', 'PVG', 'SIN', 'FRA'][i % 6],
        ARRIVAL: ['ICN', 'GMP', 'PUS'][i % 3],
        FLIGHT_NO: `${airlineCode}${pad(500 + i, 3)}`,
        FLIGHT_DATE: `2026-03-${pad((i % 28) + 1)}`,
        OB_DATE: `2026-03-${pad((i % 28) + 1)}`,
        AR_DATE: `2026-03-${pad(((i % 28) + 2) > 28 ? 28 : (i % 28) + 2)}`,
        SHIPPER_NAME: CONSIGNEES_US[i % 5],
        CONSIGNEE_NAME: SHIPPERS_KR[i % 5],
        TOTAL_PIECES: 20 + i * 3,
        TOTAL_WEIGHT: 200 + i * 30,
        CHARGEABLE_WEIGHT: 250 + i * 30,
        HAWB_COUNT: 2,
        NATURE_OF_GOODS: `[항공수입] ${COMMODITIES[i % 5]}`,
        CURRENCY: 'USD',
        KG_LB: 'KG',
        BIZ_TYPE: 'CONSOL',
        STATUS: 'DRAFT',
      });

      if (mawb.status < 300 && mawb.body?.ID) {
        mawbOk++;
        const mawbId = mawb.body.ID;
        mawbIds.push(mawbId);

        for (let j = 0; j < 2; j++) {
          const hawb = await api(request, 'POST', '/bl/air/house', {
            MAWB_ID: mawbId,
            MAWB_NO: mawbNo,
            IO_TYPE: 'IN',
            HAWB_NO: `HAWB-IM-${pad(i + 1, 3)}-${j + 1}`,
            DEPARTURE: ['LAX', 'JFK', 'NRT', 'PVG', 'SIN', 'FRA'][i % 6],
            ARRIVAL: ['ICN', 'GMP', 'PUS'][i % 3],
            FLIGHT_NO: `${airlineCode}${pad(500 + i, 3)}`,
            SHIPPER_NAME: `${CONSIGNEES_US[(i + j) % 5]} Export.${j + 1}`,
            CONSIGNEE_NAME: `${SHIPPERS_KR[(i + j) % 5]} 수입${j + 1}팀`,
            PIECES: 10 + j * 5,
            GROSS_WEIGHT: 100 + j * 40,
            CHARGEABLE_WEIGHT: 120 + j * 40,
            COMMODITY: `[수입HAWB-${j + 1}] ${COMMODITIES[(i + j) % 5]}`,
            STATUS: 'DRAFT',
          });
          if (hawb.status < 300 && hawb.body?.success) hawbOk++;
        }
      }
    }

    console.log(`[항공수입] MAWB: ${mawbOk}/30, HAWB: ${hawbOk}/60`);
    expect(mawbOk).toBe(30);
    expect(hawbOk).toBe(60);

    const hawbList = await api(request, 'GET', '/bl/air/house?ioType=IN');
    if (Array.isArray(hawbList.body)) {
      const linked = hawbList.body.filter((h: any) => h.MAWB_ID && h.MAWB_NO && mawbIds.includes(h.MAWB_ID));
      linkOk = linked.length;
    }
    console.log(`[항공수입] HAWB→MAWB 연결 검증: ${linkOk}건 (목표 60)`);
    expect(linkOk).toBeGreaterThanOrEqual(50);
  });

  // =============================================
  // 목록 페이지 연결 표시 검증
  // =============================================
  test.describe('목록 페이지 BL/AWB NO 연결 표시 검증', () => {
    const listChecks = [
      { name: '해상수출HBL목록', url: '/logis/bl/sea/house', cols: ['M.B/L NO', 'H.B/L NO'] },
      { name: '해상수출MBL목록', url: '/logis/bl/sea/master', cols: ['M.B/L NO', 'H.B/L'] },
      { name: '해상수입HBL목록', url: '/logis/import-bl/sea/house', cols: ['H.B/L NO', 'M.B/L NO'] },
      { name: '해상수입MBL목록', url: '/logis/import-bl/sea/master', cols: ['M.B/L NO'] },
      { name: '항공수출HAWB목록', url: '/logis/bl/air/house', cols: ['MAWB NO', 'HAWB NO'] },
      { name: '항공수출MAWB목록', url: '/logis/bl/air/master', cols: ['MAWB NO'] },
      { name: '항공수입HAWB목록', url: '/logis/import-bl/air/house', cols: ['MAWB NO', 'HAWB NO'] },
      { name: '항공수입MAWB목록', url: '/logis/import-bl/air/master', cols: ['MAWB NO'] },
    ];

    for (const pg of listChecks) {
      test(`[목록] ${pg.name} - BL/AWB NO 표시`, async ({ page }) => {
        const cv = authCookie.replace('fms_auth_token=', '');
        await page.context().addCookies([{ name: 'fms_auth_token', value: cv, domain: '127.0.0.1', path: '/' }]);
        await page.goto(pg.url, { timeout: 20000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        const headers = await page.locator('table thead th, table thead td').allTextContents();
        const headerText = headers.map(h => h.trim()).join(' | ');

        for (const col of pg.cols) {
          const found = headers.some(h => h.trim().includes(col));
          console.log(`[${pg.name}] "${col}" 컬럼: ${found ? '✓' : '✗'}`);
          expect(found).toBe(true);
        }

        // 데이터 행에서 BL/AWB 번호 존재 확인
        const rows = await page.locator('table tbody tr').count();
        console.log(`[${pg.name}] 데이터 행: ${rows}건`);
        expect(rows).toBeGreaterThan(0);
      });
    }
  });

  // =============================================
  // API 레벨 연결 무결성 검증
  // =============================================
  test('[무결성] HBL → MBL 연결 확인 (API)', async ({ request }) => {
    const hblList = await api(request, 'GET', '/bl/hbl');
    expect(hblList.status).toBe(200);
    const hbls = Array.isArray(hblList.body) ? hblList.body : [];

    const withMbl = hbls.filter((h: any) => h.mbl_no && h.mbl_no.startsWith('MBL'));
    const withoutMbl = hbls.filter((h: any) => !h.mbl_no);
    console.log(`[무결성] 전체 HBL: ${hbls.length}건, MBL 연결: ${withMbl.length}건, 미연결: ${withoutMbl.length}건`);
    expect(withMbl.length).toBeGreaterThan(0);
  });

  test('[무결성] HAWB → MAWB 연결 확인 (API)', async ({ request }) => {
    const hawbList = await api(request, 'GET', '/bl/air/house');
    expect(hawbList.status).toBe(200);
    const hawbs = Array.isArray(hawbList.body) ? hawbList.body : [];

    const withMawb = hawbs.filter((h: any) => h.MAWB_NO && h.MAWB_ID);
    const withoutMawb = hawbs.filter((h: any) => !h.MAWB_ID);
    console.log(`[무결성] 전체 HAWB: ${hawbs.length}건, MAWB 연결: ${withMawb.length}건, 미연결: ${withoutMawb.length}건`);
    expect(withMawb.length).toBeGreaterThan(0);
  });

  test('[무결성] MBL → HBL count 검증 (API)', async ({ request }) => {
    const mblList = await api(request, 'GET', '/bl/mbl');
    expect(mblList.status).toBe(200);
    const mbls = Array.isArray(mblList.body) ? mblList.body : [];

    const with3 = mbls.filter((m: any) => m.hbl_count === 3);
    const with2 = mbls.filter((m: any) => m.hbl_count === 2);
    console.log(`[무결성] MBL 총: ${mbls.length}건, HBL 3건연결: ${with3.length}건, 2건연결: ${with2.length}건`);
    expect(with3.length + with2.length).toBeGreaterThan(0);
  });
});
