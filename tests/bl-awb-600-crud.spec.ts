import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3600';
let authCookie = '';

async function login(request: any) {
  if (authCookie) return;
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' },
  });
  const sc = res.headers()['set-cookie'] || '';
  const m = sc.match(/fms_auth_token=([^;]+)/);
  if (m) authCookie = `fms_auth_token=${m[1]}`;
}
function h() { return { Cookie: authCookie }; }

async function post(req: any, path: string, data: any) {
  const res = await req.post(`${BASE}/api${path}`, { data, headers: h() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}
async function get(req: any, path: string) {
  const res = await req.get(`${BASE}/api${path}`, { headers: h() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}
async function del(req: any, path: string) {
  const res = await req.delete(`${BASE}/api${path}`, { headers: h() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

// ========== 복합운송 실무 마스터 데이터 ==========
const CARRIERS_SEA = ['HDMU', 'MAEU', 'COSU', 'MSCU', 'EGLV', 'ONEY', 'HLCU', 'YMLU'];
const AIRLINES = ['KE', 'OZ', 'AA', 'UA', 'CX', 'SQ', 'EK', 'TK'];
const POL = ['KRPUS', 'KRINC', 'KRKAN', 'KRUSN', 'KRPTK'];
const POD = ['USLAX', 'USLGB', 'USNYC', 'CNSHA', 'CNNBG', 'JPYOK', 'JPTYO', 'SGSIN', 'DEHAM', 'NLRTM'];
const APT_ORIG = ['ICN', 'GMP', 'PUS'];
const APT_DEST = ['LAX', 'JFK', 'ORD', 'NRT', 'PVG', 'SIN', 'FRA', 'LHR', 'DXB', 'HKG'];
const COMMODITIES = ['전자부품', '자동차부품', '반도체', '화장품', '의류', '식품', '의약품', '화학원료', '기계장비', '철강코일'];
const SHIPPERS = ['삼성전자(주)', '현대자동차(주)', 'LG전자(주)', 'SK하이닉스(주)', '포스코(주)', '한화솔루션', '롯데케미칼', 'CJ대한통운', '두산에너빌리티', '한국타이어'];
const CONSIGNEES = ['Apple Inc.', 'Tesla Motors Inc.', 'Amazon.com LLC', 'Microsoft Corp.', 'Google LLC', 'Sony Corporation', 'BMW AG', 'Siemens AG', 'Toyota Motor Corp.', 'Samsung America Inc.'];
const VESSELS = ['HMM ALGECIRAS', 'EVER GIVEN', 'MSC GULSUN', 'CMA CGM MARCO POLO', 'ONE INNOVATION', 'HMM COPENHAGEN', 'EVER ACE', 'MSC IRINA'];

function pad(n: number, l = 2) { return String(n).padStart(l, '0'); }
function dt(m: number, d: number) { return `2026-${pad(m)}-${pad(((d - 1) % 28) + 1)}`; }

// ========== 1. 해상수출 BL 100건 ==========
function seaExportBLs() {
  return Array.from({ length: 100 }, (_, i) => ({
    ioType: 'OUT',
    businessType: ['FCL', 'LCL', 'CONSOL'][i % 3],
    blType: ['ORIGINAL', 'SEAWAY', 'SURRENDER'][i % 3],
    shipperCode: `SHP${pad(i + 1, 3)}`,
    shipperName: SHIPPERS[i % 10],
    shipperAddress: `서울시 강남구 테헤란로 ${i + 1}`,
    consigneeCode: `CON${pad(i + 1, 3)}`,
    consigneeName: CONSIGNEES[i % 10],
    consigneeAddress: `${100 + i} Industrial Blvd, Suite ${i + 1}`,
    notifyName: `Notify Party ${i + 1}`,
    notifyAddress: `${200 + i} Notify Ave`,
    pol: POL[i % 5],
    pod: POD[i % 10],
    placeOfReceipt: POL[i % 5],
    placeOfDelivery: POD[i % 10],
    finalDestination: POD[(i + 3) % 10],
    lineCode: CARRIERS_SEA[i % 8],
    lineName: ['HMM', 'MAERSK', 'COSCO', 'MSC', 'EVERGREEN', 'ONE', 'HAPAG', 'YANG MING'][i % 8],
    vesselName: VESSELS[i % 8],
    voyageNo: `SEV${pad(2600 + i, 4)}E`,
    onboardDate: dt(4, i + 1),
    etd: dt(4, i + 1),
    eta: dt(5, i + 5),
    freightTerm: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    serviceTerm: ['CY/CY', 'CFS/CFS', 'CY/CFS', 'DOOR/DOOR'][i % 4],
    packageQty: 50 + i * 5,
    packageUnit: ['CTN', 'PLT', 'PKG'][i % 3],
    grossWeight: 2000 + i * 200,
    measurement: 20 + i * 3,
    commodityDesc: `[수출] ${COMMODITIES[i % 10]} LOT-EX${pad(i + 1, 4)}`,
    issuePlace: 'BUSAN, KOREA',
    issueDate: dt(4, i + 1),
    blIssueType: 'ORIGINAL',
    noOfOriginalBL: 3,
  }));
}

// ========== 2. 해상수입 BL 100건 ==========
function seaImportBLs() {
  return Array.from({ length: 100 }, (_, i) => ({
    ioType: 'IN',
    businessType: ['FCL', 'LCL', 'CONSOL'][i % 3],
    blType: ['ORIGINAL', 'SEAWAY'][i % 2],
    shipperName: CONSIGNEES[i % 10], // 수입은 해외가 shipper
    shipperAddress: `${i + 1} Export Blvd, City ${i + 1}`,
    consigneeName: SHIPPERS[i % 10], // 한국이 consignee
    consigneeAddress: `부산시 해운대구 ${i + 1}번길`,
    notifyName: `수입통관대리 ${i + 1}`,
    notifyAddress: `인천시 연수구 ${i + 1}`,
    pol: POD[i % 10], // 수입은 해외가 POL
    pod: POL[i % 5],  // 한국이 POD
    placeOfReceipt: POD[i % 10],
    placeOfDelivery: POL[i % 5],
    finalDestination: ['KRSEL', 'KRPUS', 'KRINC'][i % 3],
    lineCode: CARRIERS_SEA[i % 8],
    lineName: ['HMM', 'MAERSK', 'COSCO', 'MSC', 'EVERGREEN', 'ONE', 'HAPAG', 'YANG MING'][i % 8],
    vesselName: VESSELS[i % 8],
    voyageNo: `SIV${pad(3600 + i, 4)}W`,
    onboardDate: dt(3, i + 1),
    etd: dt(3, i + 1),
    eta: dt(4, i + 15),
    freightTerm: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    serviceTerm: 'CY/CY',
    packageQty: 30 + i * 4,
    packageUnit: 'CTN',
    grossWeight: 1500 + i * 150,
    measurement: 15 + i * 2,
    commodityDesc: `[수입] ${COMMODITIES[i % 10]} LOT-IM${pad(i + 1, 4)}`,
    issuePlace: ['SHANGHAI', 'TOKYO', 'LOS ANGELES', 'HAMBURG', 'SINGAPORE'][i % 5],
    issueDate: dt(3, i + 1),
    blIssueType: 'ORIGINAL',
    noOfOriginalBL: 3,
  }));
}

// ========== 3. 항공수출 MAWB 100건 ==========
function airExportMAWBs() {
  return Array.from({ length: 100 }, (_, i) => ({
    IO_TYPE: 'OUT',
    MAWB_NO: `${pad(180 + (i % 20), 3)}-${pad(50000000 + i, 8)}`,
    AIRLINE_CODE: AIRLINES[i % 8],
    AIRLINE_NAME: ['대한항공', '아시아나', 'American Airlines', 'United Airlines', 'Cathay Pacific', 'Singapore Airlines', 'Emirates', 'Turkish Airlines'][i % 8],
    DEPARTURE: APT_ORIG[i % 3],
    ARRIVAL: APT_DEST[i % 10],
    FLIGHT_NO: `${AIRLINES[i % 8]}${pad(500 + i, 3)}`,
    FLIGHT_DATE: dt(4, i + 1),
    OB_DATE: dt(4, i + 1),
    AR_DATE: dt(4, i + 3),
    SHIPPER_CODE: `SHP${pad(i + 1, 3)}`,
    SHIPPER_NAME: SHIPPERS[i % 10],
    SHIPPER_ADDRESS: `서울시 강남구 ${i + 1}번길`,
    CONSIGNEE_CODE: `CON${pad(i + 1, 3)}`,
    CONSIGNEE_NAME: CONSIGNEES[i % 10],
    CONSIGNEE_ADDRESS: `${i + 1} Airport Industrial, Suite ${i + 1}`,
    NOTIFY_NAME: CONSIGNEES[i % 10],
    NOTIFY_ADDRESS: `${i + 1} Notify Rd`,
    TOTAL_PIECES: 10 + i * 3,
    TOTAL_WEIGHT: 100 + i * 30,
    CHARGEABLE_WEIGHT: 120 + i * 30,
    HAWB_COUNT: 1 + (i % 5),
    NATURE_OF_GOODS: `[항공수출] ${COMMODITIES[i % 10]}`,
    CURRENCY: 'KRW',
    KG_LB: 'KG',
    RATE_CLASS: ['M', 'N', 'Q', 'C'][i % 4],
    RATE_CHARGE: 500 + i * 50,
    TOTAL_AMOUNT: 50000 + i * 1000,
    BIZ_TYPE: ['CONSOL', 'DIRECT', 'CO-LOAD'][i % 3],
    CONSOL_TYPE: i % 3 === 0 ? 'CONSOL' : 'DIRECT',
    EXPORT_TYPE: 'GENERAL',
    SALES_TYPE: 'NORMAL',
    PAYMENT_METHOD: i % 2 === 0 ? 'PP' : 'CC',
    AT_PLACE: 'INCHEON, KOREA',
    STATUS: 'DRAFT',
    SALES_MAN: `영업담당${(i % 5) + 1}`,
    INPUT_STAFF: 'admin',
    BRANCH_CODE: 'ICN',
  }));
}

// ========== 4. 항공수입 MAWB 100건 ==========
function airImportMAWBs() {
  return Array.from({ length: 100 }, (_, i) => ({
    IO_TYPE: 'IN',
    MAWB_NO: `${pad(200 + (i % 20), 3)}-${pad(60000000 + i, 8)}`,
    AIRLINE_CODE: AIRLINES[i % 8],
    AIRLINE_NAME: ['대한항공', '아시아나', 'American Airlines', 'United Airlines', 'Cathay Pacific', 'Singapore Airlines', 'Emirates', 'Turkish Airlines'][i % 8],
    DEPARTURE: APT_DEST[i % 10], // 수입: 해외가 출발
    ARRIVAL: APT_ORIG[i % 3],    // 한국이 도착
    FLIGHT_NO: `${AIRLINES[i % 8]}${pad(700 + i, 3)}`,
    FLIGHT_DATE: dt(3, i + 1),
    OB_DATE: dt(3, i + 1),
    AR_DATE: dt(3, i + 3),
    SHIPPER_NAME: CONSIGNEES[i % 10], // 수입: 해외가 shipper
    SHIPPER_ADDRESS: `${i + 1} Export Terminal Rd`,
    CONSIGNEE_NAME: SHIPPERS[i % 10], // 한국이 consignee
    CONSIGNEE_ADDRESS: `인천시 중구 공항로 ${i + 1}`,
    NOTIFY_NAME: SHIPPERS[i % 10],
    TOTAL_PIECES: 5 + i * 2,
    TOTAL_WEIGHT: 50 + i * 20,
    CHARGEABLE_WEIGHT: 60 + i * 20,
    HAWB_COUNT: 1 + (i % 3),
    NATURE_OF_GOODS: `[항공수입] ${COMMODITIES[i % 10]}`,
    CURRENCY: 'USD',
    KG_LB: 'KG',
    RATE_CLASS: 'N',
    RATE_CHARGE: 3 + (i % 10) * 0.5,
    BIZ_TYPE: 'DIRECT',
    PAYMENT_METHOD: 'PP',
    AT_PLACE: APT_DEST[i % 10],
    STATUS: 'DRAFT',
    INPUT_STAFF: 'admin',
  }));
}

// ========== 5. AWB (HAWB) 100건 ==========
function hawbs() {
  return Array.from({ length: 100 }, (_, i) => ({
    airline_code: AIRLINES[i % 8],
    flight_no: `${AIRLINES[i % 8]}${pad(900 + i, 3)}`,
    origin_airport_cd: APT_ORIG[i % 3],
    dest_airport_cd: APT_DEST[i % 10],
    etd_dt: dt(4, i + 1),
    eta_dt: dt(4, i + 3),
    import_type: i % 2 === 0 ? 'EXPORT' : 'IMPORT',
    shipper_nm: i % 2 === 0 ? SHIPPERS[i % 10] : CONSIGNEES[i % 10],
    shipper_addr: i % 2 === 0 ? `서울시 ${i + 1}` : `${i + 1} Overseas Rd`,
    consignee_nm: i % 2 === 0 ? CONSIGNEES[i % 10] : SHIPPERS[i % 10],
    consignee_addr: i % 2 === 0 ? `${i + 1} Dest Blvd` : `인천시 ${i + 1}`,
    notify_party: i % 2 === 0 ? CONSIGNEES[i % 10] : SHIPPERS[i % 10],
    pieces: 5 + i * 2,
    gross_weight_kg: 30 + i * 10,
    charge_weight_kg: 35 + i * 10,
    volume_cbm: 0.5 + i * 0.3,
    commodity_desc: `[HAWB] ${COMMODITIES[i % 10]} #${i + 1}`,
    hs_code: `${pad(8400 + (i % 100), 4)}.${pad(10 + (i % 90), 2)}`,
    payment_terms: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    remarks: `HAWB 테스트 #${i + 1}`,
  }));
}

// ========== 6. BL (HBL) 100건 ==========
function hbls() {
  return Array.from({ length: 100 }, (_, i) => ({
    vessel_nm: VESSELS[i % 8],
    voyage_no: `HBV${pad(4000 + i, 4)}`,
    pol_port_cd: i % 2 === 0 ? POL[i % 5] : POD[i % 10],
    pod_port_cd: i % 2 === 0 ? POD[i % 10] : POL[i % 5],
    place_of_receipt: i % 2 === 0 ? POL[i % 5] : POD[i % 10],
    place_of_delivery: i % 2 === 0 ? POD[i % 10] : POL[i % 5],
    final_dest: i % 2 === 0 ? POD[(i + 3) % 10] : ['KRSEL', 'KRPUS'][i % 2],
    etd_dt: dt(4, i + 1),
    eta_dt: dt(5, i + 5),
    on_board_dt: dt(4, i + 1),
    issue_dt: dt(4, i + 1),
    issue_place: i % 2 === 0 ? 'BUSAN' : ['SHANGHAI', 'LOS ANGELES', 'TOKYO'][i % 3],
    shipper_nm: i % 2 === 0 ? SHIPPERS[i % 10] : CONSIGNEES[i % 10],
    shipper_addr: i % 2 === 0 ? `서울시 ${i + 1}` : `${i + 1} Foreign St`,
    consignee_nm: i % 2 === 0 ? CONSIGNEES[i % 10] : SHIPPERS[i % 10],
    consignee_addr: i % 2 === 0 ? `${i + 1} Dest Ave` : `부산시 ${i + 1}`,
    notify_party: `Notify ${i + 1}`,
    total_pkg_qty: 20 + i * 3,
    pkg_type_cd: ['CTN', 'PLT', 'PKG', 'DRM'][i % 4],
    gross_weight_kg: 1000 + i * 100,
    volume_cbm: 10 + i * 2,
    commodity_desc: `[HBL] ${COMMODITIES[i % 10]} #${i + 1}`,
    hs_code: `${pad(7300 + (i % 100), 4)}.${pad(20 + (i % 80), 2)}`,
    marks_nos: `MARKS ${pad(i + 1, 4)} / NO MARKS`,
    freight_term_cd: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    bl_type_cd: ['ORIGINAL', 'SEAWAY', 'SURRENDER'][i % 3],
    original_bl_count: 3,
    direction: i % 2 === 0 ? 'EXPORT' : 'IMPORT',
  }));
}

// ========== 테스트 실행 ==========
test.describe('BL/AWB 6개 카테고리 각 100건 CRUD 테스트', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
    expect(authCookie).toBeTruthy();
  });

  // --- 해상수출 BL 100건 ---
  test('[해상수출BL] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = seaExportBLs();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/bl/sea', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.blId) ids.push(res.body.blId);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[해상수출BL] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(95);

    // READ 확인
    const readRes = await get(request, '/bl/sea?ioType=OUT');
    console.log(`[해상수출BL] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);

    // 정리: 생성된 데이터 삭제
    if (ids.length > 0) {
      const delRes = await del(request, `/bl/sea?ids=${ids.join(',')}`);
      console.log(`[해상수출BL] DELETE: ${delRes.status}, ${ids.length}건`);
    }
  });

  // --- 해상수입 BL 100건 ---
  test('[해상수입BL] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = seaImportBLs();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/bl/sea', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.blId) ids.push(res.body.blId);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[해상수입BL] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(95);

    const readRes = await get(request, '/bl/sea?ioType=IN');
    console.log(`[해상수입BL] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);

    if (ids.length > 0) {
      await del(request, `/bl/sea?ids=${ids.join(',')}`);
      console.log(`[해상수입BL] DELETE: ${ids.length}건`);
    }
  });

  // --- 항공수출 MAWB 100건 ---
  test('[항공수출MAWB] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = airExportMAWBs();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/bl/air/master', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.ID) ids.push(res.body.ID);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[항공수출MAWB] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(95);

    const readRes = await get(request, '/bl/air/master?ioType=OUT');
    console.log(`[항공수출MAWB] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);

    if (ids.length > 0) {
      await request.delete(`${BASE}/api/bl/air/master`, { data: { ids }, headers: h() });
      console.log(`[항공수출MAWB] DELETE: ${ids.length}건`);
    }
  });

  // --- 항공수입 MAWB 100건 ---
  test('[항공수입MAWB] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = airImportMAWBs();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/bl/air/master', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.ID) ids.push(res.body.ID);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[항공수입MAWB] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(95);

    const readRes = await get(request, '/bl/air/master?ioType=IN');
    console.log(`[항공수입MAWB] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);

    if (ids.length > 0) {
      await request.delete(`${BASE}/api/bl/air/master`, { data: { ids }, headers: h() });
      console.log(`[항공수입MAWB] DELETE: ${ids.length}건`);
    }
  });

  // --- AWB (HAWB) 100건 ---
  test('[AWB-HAWB] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = hawbs();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/awb/hawb', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.hawb_id) ids.push(res.body.hawb_id);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[AWB-HAWB] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(90);

    const readRes = await get(request, '/awb/hawb');
    console.log(`[AWB-HAWB] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);
  });

  // --- BL (HBL) 100건 ---
  test('[BL-HBL] 100건 생성 & 조회', async ({ request }) => {
    test.setTimeout(300000);
    const items = hbls();
    let ok = 0, fail = 0, ids: number[] = [];
    const errors: string[] = [];

    for (const item of items) {
      const res = await post(request, '/bl/hbl', item);
      if (res.status < 300 && res.body?.success) {
        ok++;
        if (res.body.hbl_id) ids.push(res.body.hbl_id);
      } else {
        fail++;
        if (errors.length < 3) errors.push(`${res.status}: ${JSON.stringify(res.body)?.substring(0, 120)}`);
      }
    }
    console.log(`[BL-HBL] CREATE: ${ok}/100, FAIL: ${fail}`);
    if (errors.length > 0) console.log(`  에러: ${errors[0]}`);
    expect(ok).toBeGreaterThanOrEqual(90);

    const readRes = await get(request, '/bl/hbl');
    console.log(`[BL-HBL] READ: status=${readRes.status}, count=${Array.isArray(readRes.body) ? readRes.body.length : '?'}`);
  });

  // --- 등록 페이지 렌더링 검증 ---
  test.describe('등록 페이지 렌더링 검증', () => {
    const pages = [
      { name: '해상수출BL', url: '/logis/bl/sea/register' },
      { name: '해상수입BL', url: '/logis/import-bl/sea/register' },
      { name: '항공수출MAWB', url: '/logis/bl/air/master/register' },
      { name: '항공수입MAWB', url: '/logis/import-bl/air/master/register' },
      { name: '항공HAWB', url: '/logis/bl/air/house/register' },
      { name: '해상HBL', url: '/logis/bl/sea/house/register' },
      { name: '해상MBL', url: '/logis/bl/sea/master/register' },
      { name: '수출AWB', url: '/logis/export-awb/air/register' },
      { name: '수출BL관리', url: '/logis/export-bl/manage/register' },
      { name: '수입해상HBL', url: '/logis/import-bl/sea/house/register' },
      { name: '수입해상MBL', url: '/logis/import-bl/sea/master/register' },
      { name: '수입항공HAWB', url: '/logis/import-bl/air/house/register' },
    ];

    for (const pg of pages) {
      test(`[페이지] ${pg.name} 렌더링 확인`, async ({ page }) => {
        if (cookieVal()) {
          await page.context().addCookies([{
            name: 'fms_auth_token', value: cookieVal(),
            domain: '127.0.0.1', path: '/',
          }]);
        }
        const resp = await page.goto(pg.url, { timeout: 30000 });
        expect(resp?.status()).toBeLessThan(500);
        await page.waitForLoadState('networkidle').catch(() => {});

        const body = await page.locator('body').textContent().catch(() => '') || '';
        const isError = /unhandled|application error|internal server error/i.test(body);
        expect(isError).toBe(false);

        const inputs = await page.locator('input').count();
        console.log(`[${pg.name}] status=${resp?.status()}, inputs=${inputs}, ok`);
        expect(inputs).toBeGreaterThan(0);
      });
    }
  });
});

function cookieVal() {
  const m = authCookie.match(/fms_auth_token=(.+)/);
  return m ? m[1] : '';
}
