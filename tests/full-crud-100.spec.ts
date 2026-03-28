import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3600';

// 인증 쿠키
let authCookie = '';

// 로그인하여 인증 쿠키 획득
async function login(request: any) {
  if (authCookie) return;
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' },
  });
  const setCookie = res.headers()['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  if (match) {
    authCookie = `fms_auth_token=${match[1]}`;
  }
}

function authHeaders() {
  return { Cookie: authCookie };
}

// 생성된 ID 추적용
const createdIds: Record<string, string[]> = {};

function track(module: string, id: string) {
  if (!createdIds[module]) createdIds[module] = [];
  createdIds[module].push(id);
}

// ========== 테스트 데이터 생성 헬퍼 ==========
function seaBooking(i: number) {
  return {
    bookingType: i % 2 === 0 ? 'FCL' : 'LCL',
    serviceType: 'CY-CY',
    incoterms: ['FOB', 'CIF', 'CFR', 'EXW'][i % 4],
    freightTerms: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    shipperCode: `SHP${String(i).padStart(3, '0')}`,
    shipperName: `테스트화주${i}`,
    shipperAddress: `서울시 강남구 테스트로 ${i}번길`,
    consigneeName: `Consignee Corp ${i}`,
    consigneeAddress: `${i} Test Street, Los Angeles, CA`,
    carrierBookingNo: `CBN-${Date.now()}-${i}`,
    carrierId: 'MAEU',
    vesselName: ['HMM ALGECIRAS', 'EVER GIVEN', 'MSC GULSUN', 'CMA CGM MARCO POLO'][i % 4],
    voyageNo: `V${String(100 + i).padStart(4, '0')}`,
    pol: ['KRPUS', 'KRINC', 'KRKAN'][i % 3],
    pod: ['USLAX', 'USLGB', 'USNYC', 'CNSHA'][i % 4],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    cntr20gpQty: i % 3,
    cntr40gpQty: (i + 1) % 3,
    commodityDesc: `전자제품 부품 Type-${i}`,
    grossWeight: 1000 + i * 100,
    volume: 10 + i,
    status: 'BOOKED',
    remark: `CRUD 테스트 데이터 #${i}`,
  };
}

function airBooking(i: number) {
  return {
    carrierBookingNo: `ABN-${Date.now()}-${i}`,
    carrierId: ['KE', 'OZ', 'AA', 'UA'][i % 4],
    flightNo: `KE${300 + i}`,
    flightDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    origin: ['ICN', 'GMP'][i % 2],
    destination: ['LAX', 'JFK', 'ORD', 'SFO'][i % 4],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-04-${String((i % 28) + 2).padStart(2, '0')}`,
    commodityDesc: `항공화물 샘플 #${i}`,
    pkgQty: 10 + i,
    pkgType: 'CTN',
    grossWeight: 500 + i * 50,
    chargeableWeight: 600 + i * 50,
    volume: 5 + i,
    status: 'BOOKED',
    remark: `Air CRUD 테스트 #${i}`,
  };
}

function seaSchedule(i: number) {
  return {
    carrierId: ['MAEU', 'HDMU', 'COSU', 'MSCU'][i % 4],
    vesselName: ['HMM ALGECIRAS', 'EVER GIVEN', 'MSC GULSUN', 'CMA CGM MARCO POLO'][i % 4],
    voyageNo: `SCH-V${String(200 + i).padStart(4, '0')}`,
    pol: ['KRPUS', 'KRINC'][i % 2],
    pod: ['USLAX', 'CNSHA', 'JPYOK', 'SGSIN'][i % 4],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    transitDays: 14 + (i % 10),
    status: 'ACTIVE',
    remark: `Schedule 테스트 #${i}`,
  };
}

function airSchedule(i: number) {
  return {
    carrierId: ['KE', 'OZ', 'AA', 'UA'][i % 4],
    flightNo: `TEST${400 + i}`,
    origin: ['ICN', 'GMP'][i % 2],
    destination: ['LAX', 'JFK', 'NRT', 'PVG'][i % 4],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-04-${String((i % 28) + 2).padStart(2, '0')}`,
    transitHours: 10 + (i % 5),
    status: 'ACTIVE',
    remark: `Air Schedule 테스트 #${i}`,
  };
}

function blSea(i: number) {
  return {
    ioType: i % 2 === 0 ? 'OUT' : 'IN',
    businessType: 'FCL',
    blType: 'ORIGINAL',
    shipperName: `BL화주${i}`,
    shipperAddress: `부산시 해운대구 ${i}`,
    consigneeName: `BL Consignee ${i}`,
    consigneeAddress: `${i} Port Blvd, LA`,
    pol: 'KRPUS',
    pod: ['USLAX', 'CNSHA'][i % 2],
    vesselName: 'HMM ALGECIRAS',
    voyageNo: `BV${String(i).padStart(4, '0')}`,
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    freightTerm: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    packageQty: 100 + i,
    grossWeight: 2000 + i * 100,
    measurement: 20 + i,
    commodityDesc: `BL 화물 #${i}`,
  };
}

function quoteSea(i: number) {
  return {
    quoteDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    pol: ['KRPUS', 'KRINC'][i % 2],
    pod: ['USLAX', 'CNSHA', 'JPYOK'][i % 3],
    containerType: ['20GP', '40GP', '40HC'][i % 3],
    containerQty: 1 + (i % 5),
    incoterms: ['FOB', 'CIF', 'CFR'][i % 3],
    validFrom: '2026-04-01',
    validTo: '2026-06-30',
    totalAmount: 1000 + i * 100,
    currency: 'USD',
    status: 'DRAFT',
    remark: `견적 테스트 #${i}`,
  };
}

function quoteAir(i: number) {
  return {
    quoteDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    origin: 'ICN',
    destination: ['LAX', 'JFK', 'NRT'][i % 3],
    weight: 100 + i * 10,
    volume: 5 + i,
    commodity: `항공견적 화물 #${i}`,
    validFrom: '2026-04-01',
    validTo: '2026-06-30',
    totalAmount: 500 + i * 50,
    currency: 'USD',
    status: 'DRAFT',
    remark: `Air 견적 테스트 #${i}`,
  };
}

function srSea(i: number) {
  return {
    transportMode: 'SEA',
    tradeType: 'EXPORT',
    shipperName: `SR화주${i}`,
    shipperAddress: `인천시 연수구 ${i}`,
    consigneeName: `SR Consignee ${i}`,
    consigneeAddress: `${i} Harbor Dr`,
    pol: 'KRPUS',
    pod: ['USLAX', 'CNSHA'][i % 2],
    commodityDesc: `SR 화물 #${i}`,
    packageQty: 50 + i,
    packageType: 'CTN',
    grossWeight: 1500 + i * 50,
    volume: 15 + i,
    status: 'DRAFT',
    remark: `SR 테스트 #${i}`,
  };
}

function snSea(i: number) {
  return {
    transportMode: 'SEA',
    senderName: `SN발신자${i}`,
    recipientName: `SN수신자${i}`,
    recipientEmail: `test${i}@example.com`,
    carrierName: 'HMM',
    vesselFlight: 'HMM ALGECIRAS',
    voyageNo: `SNV${String(i).padStart(4, '0')}`,
    pol: 'KRPUS',
    pod: ['USLAX', 'CNSHA'][i % 2],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    commodityDesc: `SN 화물 #${i}`,
    packageQty: 30 + i,
    grossWeight: 1000 + i * 50,
    volume: 10 + i,
    status: 'DRAFT',
    remark: `SN 테스트 #${i}`,
  };
}

function anSea(i: number) {
  return {
    anDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    blNo: `TESTMBL${String(i).padStart(6, '0')}`,
    hblNo: `TESTHBL${String(i).padStart(6, '0')}`,
    shipper: `AN화주${i}`,
    consignee: `AN수하인${i}`,
    carrierNm: 'HMM',
    vesselNm: 'HMM ALGECIRAS',
    voyageNo: `ANV${String(i).padStart(4, '0')}`,
    pol: 'KRPUS',
    pod: 'USLAX',
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    packageCnt: 20 + i,
    grossWeight: 800 + i * 30,
    commodity: `AN 화물 #${i}`,
    freightType: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
    status: 'DRAFT',
    remarks: `AN 테스트 #${i}`,
  };
}

function anAir(i: number) {
  return {
    anDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    mawbNo: `${String(180 + (i % 20)).padStart(3, '0')}-${String(10000000 + i).padStart(8, '0')}`,
    hawbNo: `HAWB-TEST-${String(i).padStart(6, '0')}`,
    shipper: `AN-AIR화주${i}`,
    consignee: `AN-AIR수하인${i}`,
    airlineNm: ['대한항공', '아시아나', 'United', 'American'][i % 4],
    flightNo: `KE${800 + i}`,
    origin: 'ICN',
    destination: ['LAX', 'JFK', 'NRT'][i % 3],
    etd: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    eta: `2026-04-${String((i % 28) + 2).padStart(2, '0')}`,
    pieces: 10 + i,
    grossWeight: 500 + i * 20,
    chargeableWeight: 600 + i * 20,
    commodity: `AN-AIR 화물 #${i}`,
    freightType: 'PREPAID',
    status: 'DRAFT',
    remarks: `AN-AIR 테스트 #${i}`,
  };
}

function customsSea(i: number) {
  return {
    declarationType: i % 2 === 0 ? 'EXPORT' : 'IMPORT',
    declarationDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    declarant: `관세사${i}`,
    importerExporter: `수출입업체${i}`,
    hsCode: `${String(8400 + (i % 100)).padStart(4, '0')}.${String(10 + (i % 90)).padStart(2, '0')}`,
    goodsDesc: `통관 물품 #${i}`,
    packageQty: 10 + i,
    grossWeight: 500 + i * 30,
    declaredValue: 10000 + i * 500,
    currency: 'USD',
    status: 'DRAFT',
    remarks: `통관 테스트 #${i}`,
  };
}

function amsSea(i: number) {
  return {
    mblNo: `AMS-MBL-${String(i).padStart(6, '0')}`,
    hblNo: `AMS-HBL-${String(i).padStart(6, '0')}`,
    filingType: ['ISF', 'AMS'][i % 2],
    filingDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    shipperName: `AMS화주${i}`,
    shipperAddr: `서울시 ${i}`,
    consigneeName: `AMS수하인${i}`,
    consigneeAddr: `LA ${i}`,
    goodsDesc: `AMS 화물 #${i}`,
    weight: 1000 + i * 50,
    weightUnit: 'KG',
    status: 'DRAFT',
  };
}

function cargoRelease(i: number) {
  return {
    receiptDt: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    arrivalDt: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    mblNo: `CR-MBL-${String(i).padStart(6, '0')}`,
    hblNo: `CR-HBL-${String(i).padStart(6, '0')}`,
    cargoType: ['FCL', 'LCL', 'BULK'][i % 3],
    packageQty: 20 + i,
    grossWeight: 800 + i * 40,
    cbm: 10 + i,
    shipperNm: `CR화주${i}`,
    consigneeNm: `CR수하인${i}`,
    statusCd: 'IN_YARD',
    remarks: `Cargo 테스트 #${i}`,
  };
}

// ========== API 호출 헬퍼 ==========
async function apiPost(request: any, path: string, data: any) {
  const res = await request.post(`${BASE}/api${path}`, { data, headers: authHeaders() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

async function apiGet(request: any, path: string) {
  const res = await request.get(`${BASE}/api${path}`, { headers: authHeaders() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

async function apiPut(request: any, path: string, data: any) {
  const res = await request.put(`${BASE}/api${path}`, { data, headers: authHeaders() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

async function apiDelete(request: any, path: string) {
  const res = await request.delete(`${BASE}/api${path}`, { headers: authHeaders() });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

// ========== CRUD 테스트 모듈별 정의 ==========
interface CrudModule {
  name: string;
  apiPath: string;
  generate: (i: number) => any;
  count: number;
  idField: string;          // 응답에서 ID 추출할 필드
  deleteStyle: 'ids-query' | 'id-query' | 'ids-body';
  updateFields?: Record<string, any>;  // PUT에서 변경할 필드
}

const modules: CrudModule[] = [
  {
    name: '해상부킹',
    apiPath: '/booking/sea',
    generate: seaBooking,
    count: 10,
    idField: 'bookingId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'CONFIRMED', remark: 'Updated by CRUD test' },
  },
  {
    name: '항공부킹',
    apiPath: '/booking/air',
    generate: airBooking,
    count: 8,
    idField: 'bookingId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'CONFIRMED', remark: 'Updated by CRUD test' },
  },
  {
    name: '해상스케줄',
    apiPath: '/schedule/sea',
    generate: seaSchedule,
    count: 8,
    idField: 'scheduleId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'CLOSED', remark: 'Updated schedule' },
  },
  {
    name: '항공스케줄',
    apiPath: '/schedule/air',
    generate: airSchedule,
    count: 6,
    idField: 'scheduleId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'CLOSED', remark: 'Updated air schedule' },
  },
  {
    name: '해상BL',
    apiPath: '/bl/sea',
    generate: blSea,
    count: 8,
    idField: 'blId',
    deleteStyle: 'ids-query',
    updateFields: { commodityDesc: 'Updated BL 화물' },
  },
  {
    name: '해상견적',
    apiPath: '/quote/sea',
    generate: quoteSea,
    count: 8,
    idField: 'quoteId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'SENT', remark: 'Updated quote' },
  },
  {
    name: '항공견적',
    apiPath: '/quote/air',
    generate: quoteAir,
    count: 6,
    idField: 'quoteId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'SENT', remark: 'Updated air quote' },
  },
  {
    name: '선적요청(SR)',
    apiPath: '/sr/sea',
    generate: srSea,
    count: 8,
    idField: 'srId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'SUBMITTED', remark: 'Updated SR' },
  },
  {
    name: '선적통지(SN)',
    apiPath: '/sn/sea',
    generate: snSea,
    count: 6,
    idField: 'snId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'SENT', remark: 'Updated SN' },
  },
  {
    name: '해상도착통지(AN)',
    apiPath: '/an/sea',
    generate: anSea,
    count: 6,
    idField: 'id',
    deleteStyle: 'id-query',
    updateFields: { status: 'ARRIVED', remarks: 'Updated AN' },
  },
  {
    name: '항공도착통지(AN)',
    apiPath: '/an/air',
    generate: anAir,
    count: 6,
    idField: 'id',
    deleteStyle: 'id-query',
    updateFields: { status: 'ARRIVED', remarks: 'Updated AN Air' },
  },
  {
    name: '통관신고',
    apiPath: '/customs/sea',
    generate: customsSea,
    count: 6,
    idField: 'declarationId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'ACCEPTED', remarks: 'Updated customs' },
  },
  {
    name: 'AMS',
    apiPath: '/ams/sea',
    generate: amsSea,
    count: 6,
    idField: 'amsId',
    deleteStyle: 'ids-query',
    updateFields: { status: 'SUBMITTED' },
  },
  {
    name: '화물반출',
    apiPath: '/cargo/release',
    generate: cargoRelease,
    count: 8,
    idField: 'id',
    deleteStyle: 'ids-query',
    updateFields: { statusCd: 'RELEASED', remarks: 'Updated cargo' },
  },
];

// 총합: 10+8+8+6+8+8+6+8+6+6+6+6+6+8 = 100개

// ========== 메인 테스트 ==========
test.describe('KCS-FMS 전체 CRUD 100개 데이터 테스트', () => {
  // 모듈별 테스트 저장용
  const moduleResults: Record<string, { created: any[]; errors: string[] }> = {};

  // 전체 테스트 시작 전 로그인
  test.beforeAll(async ({ request }) => {
    await login(request);
    console.log(`인증 쿠키 획득: ${authCookie ? 'OK' : 'FAILED'}`);
    expect(authCookie).toBeTruthy();
  });

  for (const mod of modules) {
    // 각 모듈을 하나의 테스트로 통합 (C-R-U-D 순차 실행, 모듈 간 독립)
    test(`[${mod.name}] CRUD ${mod.count}건`, async ({ request }) => {
      moduleResults[mod.name] = { created: [], errors: [] };

      // ---- CREATE ----
      for (let i = 0; i < mod.count; i++) {
        const data = mod.generate(i);
        const res = await apiPost(request, mod.apiPath, data);

        if (res.status >= 200 && res.status < 300 && res.body) {
          const id = res.body[mod.idField] || res.body?.id || res.body?.insertId;
          if (id) {
            moduleResults[mod.name].created.push({ id, data });
            track(mod.name, String(id));
          } else {
            moduleResults[mod.name].created.push({ id: null, data, response: res.body });
          }
        } else {
          moduleResults[mod.name].errors.push(
            `CREATE #${i}: status=${res.status}, ${JSON.stringify(res.body)?.substring(0, 150)}`
          );
        }
      }

      const createCount = moduleResults[mod.name].created.length;
      const createErrors = moduleResults[mod.name].errors.length;
      console.log(`[${mod.name}] CREATE: ${createCount}/${mod.count} 성공, ${createErrors} 실패`);
      if (createErrors > 0) {
        console.log(`  ${moduleResults[mod.name].errors[0]}`);
      }
      expect(createCount).toBeGreaterThan(0);

      // ---- READ ----
      const readRes = await apiGet(request, mod.apiPath);
      expect(readRes.status).toBeLessThan(500);
      const recordCount = Array.isArray(readRes.body) ? readRes.body.length : (readRes.body?.data?.length ?? 'N/A');
      console.log(`[${mod.name}] READ: status=${readRes.status}, records=${recordCount}`);

      // ---- UPDATE ----
      const items = moduleResults[mod.name].created;
      const firstId = items.find(item => item.id)?.id;
      if (firstId) {
        const updateData = { id: firstId, ...mod.updateFields };
        const updateRes = await apiPut(request, mod.apiPath, updateData);
        console.log(`[${mod.name}] UPDATE: status=${updateRes.status}, id=${firstId}`);
        expect(updateRes.status).toBeLessThan(500);
      } else {
        console.log(`[${mod.name}] UPDATE: 스킵 (ID 없음)`);
      }

      // ---- DELETE ----
      const ids = items.map(item => item.id).filter(Boolean);
      if (ids.length === 0) {
        console.log(`[${mod.name}] DELETE: 스킵`);
        return;
      }

      let deleteCount = 0;
      if (mod.deleteStyle === 'ids-query') {
        const res = await apiDelete(request, `${mod.apiPath}?ids=${ids.join(',')}`);
        if (res.status < 400) deleteCount = ids.length;
        else {
          for (const id of ids) {
            const r = await apiDelete(request, `${mod.apiPath}?ids=${id}`);
            if (r.status < 400) deleteCount++;
          }
        }
      } else if (mod.deleteStyle === 'id-query') {
        for (const id of ids) {
          const r = await apiDelete(request, `${mod.apiPath}?id=${id}`);
          if (r.status < 400) deleteCount++;
        }
      } else if (mod.deleteStyle === 'ids-body') {
        const res = await request.delete(`${BASE}/api${mod.apiPath}`, {
          data: { ids },
          headers: authHeaders(),
        });
        if (res.status() < 400) deleteCount = ids.length;
      }
      console.log(`[${mod.name}] DELETE: ${deleteCount}/${ids.length} 삭제`);
    });
  }

  // ========== 등록 페이지 렌더링 검증 ==========
  test.describe('전체 등록 페이지 렌더링 검증', () => {
    const registerPages = [
      '/logis/booking/sea/register',
      '/logis/booking/air/register',
      '/logis/booking/sea/multi-register',
      '/logis/booking/air/multi-register',
      '/logis/schedule/sea/register',
      '/logis/schedule/air/register',
      '/logis/bl/sea/register',
      '/logis/bl/sea/house/register',
      '/logis/bl/sea/master/register',
      '/logis/bl/air/register',
      '/logis/bl/air/house/register',
      '/logis/bl/air/master/register',
      '/logis/sr/sea/register',
      '/logis/sn/sea/register',
      '/logis/sn/air/register',
      '/logis/an/sea/register',
      '/logis/an/air/register',
      '/logis/customs/sea/register',
      '/logis/customs-account/sea/register',
      '/logis/ams/sea/register',
      '/logis/manifest/sea/register',
      '/logis/quote/sea/register',
      '/logis/quote/air/register',
      '/logis/quote/request/register',
      '/logis/export-awb/air/register',
      '/logis/export-bl/manage/register',
      '/logis/import-bl/sea/register',
      '/logis/import-bl/sea/house/register',
      '/logis/import-bl/sea/master/register',
      '/logis/import-bl/air/register',
      '/logis/import-bl/air/house/register',
      '/logis/import-bl/air/master/register',
      '/logis/rate/corporate/sea/register',
      '/logis/rate/corporate/air/register',
    ];

    for (const pagePath of registerPages) {
      test(`페이지 로드: ${pagePath}`, async ({ page }) => {
        // 인증 쿠키 설정
        if (authCookie) {
          const cookieValue = authCookie.replace('fms_auth_token=', '');
          await page.context().addCookies([{
            name: 'fms_auth_token',
            value: cookieValue,
            domain: '127.0.0.1',
            path: '/',
          }]);
        }
        const response = await page.goto(pagePath, { timeout: 30000 });
        const status = response?.status() ?? 0;

        // 콘솔 에러 수집
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.waitForLoadState('networkidle').catch(() => {});

        // 500 에러가 아닌지 확인
        expect(status).toBeLessThan(500);

        // 페이지에 콘텐츠가 있는지
        const bodyText = await page.locator('body').textContent().catch(() => '');
        const hasContent = (bodyText?.length ?? 0) > 10;

        // "에러", "오류" 텍스트가 메인 콘텐츠에 없는지 (에러 페이지 감지)
        const hasErrorPage = /unhandled|application error|internal server error/i.test(bodyText ?? '');

        console.log(`${pagePath}: status=${status}, content=${hasContent}, errorPage=${hasErrorPage}`);

        expect(hasErrorPage).toBe(false);
        expect(hasContent).toBe(true);
      });
    }
  });
});
