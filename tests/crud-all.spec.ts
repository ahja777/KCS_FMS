/**
 * FMS Web - 전체 CRUD API 테스트 (Chromium)
 * 11개 도메인 API CRUD + 16개 목록 조회 = 60건
 *
 * API 응답 패턴:
 * - POST: 각 API별 다른 ID 필드명 (srId, bookingId, hbl_id 등)
 * - PUT: 대부분 body.id, bl/hbl만 body.hbl_id
 * - DELETE: 대부분 query param ids=[...], an/sea와 bl/hbl은 id=단건
 */
import { test, expect } from '@playwright/test';

const API = '/api';

// ─────────────────────────────────────────────────
// 1. 해상 S/R (선적요청)
// ─────────────────────────────────────────────────
test.describe.serial('1. S/R 해상 CRUD', () => {
  let srId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/sr/sea`, {
      data: {
        shipperName: 'TEST-SHIPPER',
        consigneeName: 'TEST-CONSIGNEE',
        pol: 'KRPUS', pod: 'CNSHA',
        commodityDesc: 'CRUD Test Cargo',
        packageQty: 10, grossWeight: 1500, volume: 25,
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    srId = body.srId ?? body.id;
    expect(srId).toBeTruthy();
    console.log(`  [S/R CREATE] id=${srId}, no=${body.srNo}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/sr/sea?srId=${srId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.shipperName).toBe('TEST-SHIPPER');
    console.log(`  [S/R READ] shipper=${body.shipperName}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/sr/sea`, {
      data: { id: srId, shipperName: 'TEST-SHIPPER-UPD', grossWeight: 2000 },
    });
    expect(res.status()).toBe(200);
    const check = await request.get(`${API}/sr/sea?srId=${srId}`);
    const body = await check.json();
    expect(body.shipperName).toBe('TEST-SHIPPER-UPD');
    console.log(`  [S/R UPDATE] shipper=${body.shipperName}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/sr/sea?ids=${srId}`);
    expect(res.status()).toBe(200);
    console.log(`  [S/R DELETE] id=${srId}`);
  });
});

// ─────────────────────────────────────────────────
// 2. 해상 부킹
// ─────────────────────────────────────────────────
test.describe.serial('2. Booking 해상 CRUD', () => {
  let bookingId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/booking/sea`, {
      data: {
        shipperName: 'CRUD-SHIPPER', consigneeName: 'CRUD-CONSIGNEE',
        pol: 'KRPUS', pod: 'USNYC',
        vesselName: 'EVER GIVEN', voyageNo: 'V001',
        commodityDesc: 'CRUD Test', grossWeight: 5000, volume: 50,
        cntr20gpQty: 1, totalCntrQty: 1,
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    bookingId = body.bookingId ?? body.id;
    expect(bookingId).toBeTruthy();
    console.log(`  [BOOKING CREATE] id=${bookingId}, no=${body.bookingNo}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/booking/sea?bookingId=${bookingId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.vesselName).toBe('EVER GIVEN');
    console.log(`  [BOOKING READ] vessel=${body.vesselName}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/booking/sea`, {
      data: { id: bookingId, vesselName: 'EVER GIVEN V2', grossWeight: 6000 },
    });
    expect(res.status()).toBe(200);
    const check = await request.get(`${API}/booking/sea?bookingId=${bookingId}`);
    const body = await check.json();
    expect(body.vesselName).toBe('EVER GIVEN V2');
    console.log(`  [BOOKING UPDATE] vessel=${body.vesselName}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/booking/sea?ids=${bookingId}`);
    expect(res.status()).toBe(200);
    console.log(`  [BOOKING DELETE] id=${bookingId}`);
  });
});

// ─────────────────────────────────────────────────
// 3. 해상 스케줄
// ─────────────────────────────────────────────────
test.describe.serial('3. Schedule 해상 CRUD', () => {
  let scheduleId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/schedule/sea`, {
      data: {
        carrierId: 1,
        vesselName: 'MAERSK EULER', voyageNo: 'V999',
        pol: 'KRPUS', pod: 'CNSHA',
        etd: '2026-03-01', eta: '2026-03-10',
        transitDays: 9, status: 'ACTIVE', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    scheduleId = body.scheduleId ?? body.id;
    expect(scheduleId).toBeTruthy();
    console.log(`  [SCHEDULE CREATE] id=${scheduleId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/schedule/sea?scheduleId=${scheduleId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.vesselName).toBe('MAERSK EULER');
    console.log(`  [SCHEDULE READ] vessel=${body.vesselName}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/schedule/sea`, {
      data: { id: scheduleId, vesselName: 'MAERSK EULER V2', transitDays: 10 },
    });
    expect(res.status()).toBe(200);
    const check = await request.get(`${API}/schedule/sea?scheduleId=${scheduleId}`);
    const body = await check.json();
    expect(body.vesselName).toBe('MAERSK EULER V2');
    console.log(`  [SCHEDULE UPDATE] vessel=${body.vesselName}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/schedule/sea?ids=${scheduleId}`);
    expect(res.status()).toBe(200);
    console.log(`  [SCHEDULE DELETE] id=${scheduleId}`);
  });
});

// ─────────────────────────────────────────────────
// 4. House B/L (hbl_id - snake_case 주의)
// ─────────────────────────────────────────────────
test.describe.serial('4. B/L House 해상 CRUD', () => {
  let blId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/bl/hbl`, {
      data: {
        shipment_id: 1, customer_id: 1, carrier_id: null,
        shipper_nm: 'CRUD-BL-SHIPPER', consignee_nm: 'CRUD-BL-CONSIGNEE',
        pol_port_cd: 'KRPUS', pod_port_cd: 'JPYOK',
        gross_weight_kg: 3000, volume_cbm: 30,
        direction: 'EXPORT',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    blId = body.hbl_id ?? body.id;
    expect(blId).toBeTruthy();
    console.log(`  [HBL CREATE] id=${blId}, no=${body.hbl_no}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/bl/hbl`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = Array.isArray(body) && body.some((r: any) => r.hbl_id === blId);
    expect(found).toBeTruthy();
    console.log(`  [HBL READ] found id=${blId} in list`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/bl/hbl`, {
      data: { hbl_id: blId, shipper_nm: 'CRUD-BL-SHIPPER-UPD' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [HBL UPDATE] id=${blId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/bl/hbl?id=${blId}`);
    expect(res.status()).toBe(200);
    console.log(`  [HBL DELETE] id=${blId}`);
  });
});

// ─────────────────────────────────────────────────
// 5. 해상 견적
// ─────────────────────────────────────────────────
test.describe.serial('5. Quote 해상 CRUD', () => {
  let quoteId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/quote/sea`, {
      data: {
        pol: 'KRPUS', pod: 'USNYC',
        containerType: '20GP', containerQty: 2,
        incoterms: 'FOB', totalAmount: 3500, currency: 'USD',
        validFrom: '2026-03-01', validTo: '2026-04-01',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    quoteId = body.quoteId ?? body.id;
    expect(quoteId).toBeTruthy();
    console.log(`  [QUOTE CREATE] id=${quoteId}, no=${body.quoteNo}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/quote/sea?quoteId=${quoteId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pol).toBe('KRPUS');
    console.log(`  [QUOTE READ] pol=${body.pol}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/quote/sea`, {
      data: {
        id: quoteId, quoteDate: '2026-03-01',
        pol: 'KRPUS', pod: 'USNYC',
        containerType: '20GP', containerQty: 3,
        incoterms: 'FOB', totalAmount: 4000, currency: 'USD',
        validFrom: '2026-03-01', validTo: '2026-04-01',
        status: 'DRAFT', remark: 'CRUD-TEST-UPD',
      },
    });
    expect(res.status()).toBe(200);
    console.log(`  [QUOTE UPDATE] id=${quoteId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/quote/sea?ids=${quoteId}`);
    expect(res.status()).toBe(200);
    console.log(`  [QUOTE DELETE] id=${quoteId}`);
  });
});

// ─────────────────────────────────────────────────
// 6. 해상 AMS
// ─────────────────────────────────────────────────
test.describe.serial('6. AMS 해상 CRUD', () => {
  let amsId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/ams/sea`, {
      data: {
        blNo: 'CRUD-AMS-BL001', vesselName: 'TEST VESSEL',
        voyageNo: 'V123', pol: 'KRPUS', pod: 'USNYC',
        shipperName: 'AMS SHIPPER', consigneeName: 'AMS CONSIGNEE',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    amsId = body.amsId ?? body.id;
    expect(amsId).toBeTruthy();
    console.log(`  [AMS CREATE] id=${amsId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/ams/sea?amsId=${amsId}`);
    expect(res.status()).toBe(200);
    console.log(`  [AMS READ] id=${amsId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/ams/sea`, {
      data: { id: amsId, vesselName: 'TEST VESSEL V2' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [AMS UPDATE] id=${amsId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/ams/sea?ids=${amsId}`);
    expect(res.status()).toBe(200);
    console.log(`  [AMS DELETE] id=${amsId}`);
  });
});

// ─────────────────────────────────────────────────
// 7. 해상 A/N (도착통지) - id 단수 DELETE
// ─────────────────────────────────────────────────
test.describe.serial('7. A/N 해상 CRUD', () => {
  let anId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/an/sea`, {
      data: {
        blNo: 'CRUD-AN-BL001', consignee: 'AN CONSIGNEE',
        pol: 'CNSHA', pod: 'KRPUS', vesselName: 'AN VESSEL',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    anId = body.id ?? body.anId;
    expect(anId).toBeTruthy();
    console.log(`  [A/N CREATE] id=${anId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/an/sea?id=${anId}`);
    expect(res.status()).toBe(200);
    console.log(`  [A/N READ] id=${anId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/an/sea`, {
      data: { id: anId, consignee: 'AN CONSIGNEE UPDATED' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [A/N UPDATE] id=${anId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/an/sea?id=${anId}`);
    expect(res.status()).toBe(200);
    console.log(`  [A/N DELETE] id=${anId}`);
  });
});

// ─────────────────────────────────────────────────
// 8. 해상 S/N (선적통지)
// ─────────────────────────────────────────────────
test.describe.serial('8. S/N 해상 CRUD', () => {
  let snId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/sn/sea`, {
      data: {
        blNo: 'CRUD-SN-BL001', vesselName: 'SN VESSEL',
        voyageNo: 'V456', pol: 'KRPUS', pod: 'SGSIN',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    snId = body.snId ?? body.id;
    expect(snId).toBeTruthy();
    console.log(`  [S/N CREATE] id=${snId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/sn/sea?snId=${snId}`);
    expect(res.status()).toBe(200);
    console.log(`  [S/N READ] id=${snId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/sn/sea`, {
      data: { id: snId, vesselName: 'SN VESSEL V2' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [S/N UPDATE] id=${snId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/sn/sea?ids=${snId}`);
    expect(res.status()).toBe(200);
    console.log(`  [S/N DELETE] id=${snId}`);
  });
});

// ─────────────────────────────────────────────────
// 9. 해상 세관
// ─────────────────────────────────────────────────
test.describe.serial('9. Customs 해상 CRUD', () => {
  let customsId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/customs/sea`, {
      data: {
        blNo: 'CRUD-CUSTOMS-BL001', declarationType: 'IMPORT',
        declarant: 'TEST DECLARANT',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    customsId = body.declarationId ?? body.id;
    expect(customsId).toBeTruthy();
    console.log(`  [CUSTOMS CREATE] id=${customsId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/customs/sea?customsId=${customsId}`);
    expect(res.status()).toBe(200);
    console.log(`  [CUSTOMS READ] id=${customsId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/customs/sea`, {
      data: { id: customsId, declarant: 'UPDATED DECLARANT' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [CUSTOMS UPDATE] id=${customsId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/customs/sea?ids=${customsId}`);
    expect(res.status()).toBe(200);
    console.log(`  [CUSTOMS DELETE] id=${customsId}`);
  });
});

// ─────────────────────────────────────────────────
// 10. 해상 매니페스트
// ─────────────────────────────────────────────────
test.describe.serial('10. Manifest 해상 CRUD', () => {
  let manifestId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/manifest/sea`, {
      data: {
        vesselName: 'MANIFEST VESSEL', voyageNo: 'MV001',
        pol: 'KRPUS', pod: 'CNSHA',
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    manifestId = body.manifestId ?? body.id;
    expect(manifestId).toBeTruthy();
    console.log(`  [MANIFEST CREATE] id=${manifestId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/manifest/sea?manifestId=${manifestId}`);
    expect(res.status()).toBe(200);
    console.log(`  [MANIFEST READ] id=${manifestId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/manifest/sea`, {
      data: { id: manifestId, vesselName: 'MANIFEST VESSEL V2' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [MANIFEST UPDATE] id=${manifestId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/manifest/sea?ids=${manifestId}`);
    expect(res.status()).toBe(200);
    console.log(`  [MANIFEST DELETE] id=${manifestId}`);
  });
});

// ─────────────────────────────────────────────────
// 11. 항공 부킹
// ─────────────────────────────────────────────────
test.describe.serial('11. Booking 항공 CRUD', () => {
  let bookingId: number;

  test('CREATE', async ({ request }) => {
    const res = await request.post(`${API}/booking/air`, {
      data: {
        shipperName: 'AIR-SHIPPER', consigneeName: 'AIR-CONSIGNEE',
        pol: 'KRSEL', pod: 'USNYC', flightNo: 'KE081',
        grossWeight: 500, volume: 5,
        status: 'DRAFT', remark: 'CRUD-TEST',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    bookingId = body.bookingId ?? body.id;
    expect(bookingId).toBeTruthy();
    console.log(`  [AIR BOOKING CREATE] id=${bookingId}`);
  });

  test('READ', async ({ request }) => {
    const res = await request.get(`${API}/booking/air?bookingId=${bookingId}`);
    expect(res.status()).toBe(200);
    console.log(`  [AIR BOOKING READ] id=${bookingId}`);
  });

  test('UPDATE', async ({ request }) => {
    const res = await request.put(`${API}/booking/air`, {
      data: { id: bookingId, shipperName: 'AIR-SHIPPER-UPD' },
    });
    expect(res.status()).toBe(200);
    console.log(`  [AIR BOOKING UPDATE] id=${bookingId}`);
  });

  test('DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/booking/air?ids=${bookingId}`);
    expect(res.status()).toBe(200);
    console.log(`  [AIR BOOKING DELETE] id=${bookingId}`);
  });
});

// ─────────────────────────────────────────────────
// 12. 전체 API 목록 조회 (GET)
// ─────────────────────────────────────────────────
test.describe('12. 전체 API 목록 조회 (GET)', () => {
  const apis = [
    { name: 'S/R 해상', url: '/sr/sea' },
    { name: 'Booking 해상', url: '/booking/sea' },
    { name: 'Booking 항공', url: '/booking/air' },
    { name: 'Schedule 해상', url: '/schedule/sea' },
    { name: 'B/L House', url: '/bl/hbl' },
    { name: 'B/L Master', url: '/bl/mbl' },
    { name: 'B/L Sea', url: '/bl/sea' },
    { name: 'Quote 해상', url: '/quote/sea' },
    { name: 'AMS 해상', url: '/ams/sea' },
    { name: 'A/N 해상', url: '/an/sea' },
    { name: 'S/N 해상', url: '/sn/sea' },
    { name: 'Customs 해상', url: '/customs/sea' },
    { name: 'Manifest 해상', url: '/manifest/sea' },
    { name: 'Carriers', url: '/carriers' },
    { name: 'Ports', url: '/ports' },
    { name: 'Dashboard', url: '/dashboard' },
  ];

  for (const api of apis) {
    test(`GET ${api.name}`, async ({ request }) => {
      const res = await request.get(`${API}${api.url}`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const count = Array.isArray(body) ? body.length : 'object';
      console.log(`  [GET] ${api.name}: ${count} items`);
    });
  }
});
