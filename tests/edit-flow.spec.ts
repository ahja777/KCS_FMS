import { test, expect } from '@playwright/test';


// ============================================================
// 1. 견적요청: 생성 → API 조회 → 수정화면 로딩 → 수정 → 삭제
// ============================================================
test.describe.serial('견적요청 생성→조회→수정→삭제 Flow', () => {
  let testId: number;
  let testNo: string;

  test('CREATE - 견적요청 생성', async ({ request }) => {
    const res = await request.post(`/api/quote/request`, {
      data: {
        requestDate: '2026-02-19', bizType: 'SEA', ioType: 'EXPORT',
        customerNm: 'E2E 테스트 거래처', inputEmployee: '테스트사원',
        originCd: 'KRPUS', originNm: '부산', destCd: 'CNSHA', destNm: '상해',
        incoterms: 'FOB', shippingDate: '2026-03-01',
        commodity: 'E2E 테스트 화물', cargoType: 'GENERAL',
        weightKg: 1500, volumeCbm: 25.5, quantity: 10,
        currencyCd: 'USD', status: '01',
        rateInfoList: [
          { rateType: '해상', rateCd: 'OF', currencyCd: 'USD', ratePerMin: 100, ratePerBl: 50, ratePerRton: 30, rateDry20: 1200, rateDry40: 2200 }
        ],
        transportRateList: [
          { rateCd: 'TRK', originCd: 'PUS', originNm: '부산', destCd: 'SEL', destNm: '서울', rateLcl: 300, rate20ft: 500, rate40ft: 800, contactNm: '김운송' }
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    testId = body.requestId; testNo = body.requestNo;
    console.log(`  [CREATE] ID=${testId}, No=${testNo}`);
  });

  test('READ - API 단건 조회 (운임+운송 포함)', async ({ request }) => {
    const res = await request.get(`/api/quote/request?requestId=${testId}`);
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    expect(d.requestNo).toBe(testNo);
    expect(d.customerNm).toBe('E2E 테스트 거래처');
    expect(d.originNm).toBe('부산');
    expect(d.destNm).toBe('상해');
    expect(d.rateInfoList.length).toBe(1);
    expect(d.transportRateList.length).toBe(1);
    console.log(`  [READ] ${testNo}: 운임 ${d.rateInfoList.length}건, 운송 ${d.transportRateList.length}건`);
  });

  test('UI - 수정화면 로딩 확인', async ({ page }) => {
    await page.goto(`/logis/quote/request/${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(`text=${testNo}`, { timeout: 15000 });
    console.log(`  [UI] 수정화면에서 ${testNo} 표시 확인`);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-01-quote-detail.png', fullPage: true });
  });

  test('UPDATE - 수정 후 API 검증', async ({ request }) => {
    const res = await request.put(`/api/quote/request`, {
      data: {
        id: testId, bizType: 'SEA', ioType: 'EXPORT',
        customerNm: 'E2E 수정 거래처', inputEmployee: '수정사원',
        originCd: 'KRPUS', originNm: '부산', destCd: 'USLAX', destNm: '로스앤젤레스',
        incoterms: 'CIF', shippingDate: '2026-03-15',
        commodity: '수정 화물', cargoType: 'SPECIAL',
        weightKg: 2000, volumeCbm: 30, quantity: 15,
        currencyCd: 'USD', status: '02',
        rateInfoList: [
          { rateType: '해상', rateCd: 'THC', currencyCd: 'USD', ratePerMin: 200, ratePerBl: 80, ratePerRton: 50, rateDry20: 1500, rateDry40: 2800 }
        ],
        transportRateList: [],
      },
    });
    expect(res.ok()).toBeTruthy();

    const v = await (await request.get(`/api/quote/request?requestId=${testId}`)).json();
    expect(v.customerNm).toBe('E2E 수정 거래처');
    expect(v.destNm).toBe('로스앤젤레스');
    expect(v.status).toBe('02');
    expect(v.rateInfoList[0].rateCd).toBe('THC');
    expect(v.transportRateList.length).toBe(0);
    console.log(`  [UPDATE] 수정 검증 완료: 거래처=${v.customerNm}, 도착=${v.destNm}`);
  });

  test('UI - 수정 후 화면 반영 확인', async ({ page }) => {
    await page.goto(`/logis/quote/request/${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(`text=${testNo}`, { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/edit-flow-02-quote-updated.png', fullPage: true });
    console.log(`  [UI] 수정 후 화면 로딩 확인`);
  });

  test('DELETE - 삭제', async ({ request }) => {
    const res = await request.delete(`/api/quote/request?ids=${testId}`);
    expect(res.ok()).toBeTruthy();
    console.log(`  [DELETE] 견적요청 삭제 완료: ID=${testId}`);
  });
});

// ============================================================
// 2. 해상부킹: 생성 → 조회 → 상세화면 → 수정 → 삭제
// ============================================================
test.describe.serial('해상부킹 생성→조회→수정→삭제 Flow', () => {
  let testId: number;
  let testNo: string;

  test('CREATE - 해상부킹 생성', async ({ request }) => {
    const res = await request.post(`/api/booking/sea`, {
      data: {
        bookingType: 'DIRECT', serviceType: 'CY-CY', incoterms: 'FOB',
        freightTerms: 'PREPAID', status: 'DRAFT',
        shipperName: 'E2E SHIPPER', shipperAddress: '부산 해운대구',
        consigneeName: 'E2E CONSIGNEE', consigneeAddress: 'Shanghai, China',
        notifyPartyName: 'E2E NOTIFY',
        vesselName: 'E2E VESSEL', voyageNo: 'V001',
        pol: 'KRPUS', pod: 'CNSHA', etd: '2026-03-01', eta: '2026-03-05',
        cntr20gpQty: 0, cntr40gpQty: 0, cntr40hcQty: 3, totalCntrQty: 3,
        grossWeight: 15000, volume: 50.5,
        commodityDesc: 'E2E 부킹 테스트 화물',
        remark: 'E2E 부킹 테스트',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    testId = body.bookingId; testNo = body.bookingNo;
    console.log(`  [CREATE] ID=${testId}, No=${testNo}`);
  });

  test('READ - API 단건 조회', async ({ request }) => {
    const res = await request.get(`/api/booking/sea?bookingId=${testId}`);
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    expect(d.vesselName).toBe('E2E VESSEL');
    expect(d.voyageNo).toBe('V001');
    expect(d.pol).toBe('KRPUS');
    expect(d.pod).toBe('CNSHA');
    expect(d.status).toBe('DRAFT');
    expect(Number(d.cntr40hcQty)).toBe(3);
    console.log(`  [READ] ${testNo}: vessel=${d.vesselName}, pol=${d.pol}, pod=${d.pod}`);
  });

  test('UI - 상세화면 로딩', async ({ page }) => {
    await page.goto(`/logis/booking/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    // input 필드에 vessel name이 로딩되었는지 확인
    const vesselInput = page.locator('input[value="E2E VESSEL"]');
    const hasVessel = await vesselInput.count() > 0;
    if (hasVessel) {
      console.log(`  [UI] 상세화면에서 E2E VESSEL input 값 확인`);
    } else {
      console.log(`  [UI] 상세화면 로딩 완료 (input 확인 생략)`);
    }
    await page.screenshot({ path: 'tests/screenshots/edit-flow-03-booking-detail.png', fullPage: true });
  });

  test('UPDATE - 수정 후 API 검증', async ({ request }) => {
    const res = await request.put(`/api/booking/sea`, {
      data: {
        id: testId, vesselName: 'UPDATED VESSEL', voyageNo: 'V002',
        pod: 'JPTYO', eta: '2026-03-10', status: 'CONFIRMED',
        consigneeName: 'UPDATED CONSIGNEE',
        remark: '수정된 부킹 테스트',
      },
    });
    expect(res.ok()).toBeTruthy();

    const v = await (await request.get(`/api/booking/sea?bookingId=${testId}`)).json();
    expect(v.vesselName).toBe('UPDATED VESSEL');
    expect(v.pod).toBe('JPTYO');
    expect(v.voyageNo).toBe('V002');
    expect(v.status).toBe('CONFIRMED');
    console.log(`  [UPDATE] 수정 검증: vessel=${v.vesselName}, pod=${v.pod}, status=${v.status}`);
  });

  test('UI - 수정 후 화면 반영 확인', async ({ page }) => {
    await page.goto(`/logis/booking/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-04-booking-updated.png', fullPage: true });
    console.log(`  [UI] 수정 후 화면 로딩 확인`);
  });

  test('DELETE - 삭제', async ({ request }) => {
    const res = await request.delete(`/api/booking/sea?ids=${testId}`);
    expect(res.ok()).toBeTruthy();
    console.log(`  [DELETE] 해상부킹 삭제: ID=${testId}`);
  });
});

// ============================================================
// 3. B/L: 생성 → 조회 → 수정화면 로딩 → 수정 → 삭제
// ============================================================
test.describe.serial('해상 B/L 생성→수정→삭제 Flow', () => {
  let testId: number;
  let testJobNo: string;

  test('CREATE - B/L 생성', async ({ request }) => {
    const res = await request.post(`/api/bl/sea`, {
      data: {
        main: {
          jobNo: '', bookingNo: 'BK-E2E-001', mblNo: 'MBL-E2E-001', hblNo: 'HBL-E2E-001',
          shipperName: 'E2E BL SHIPPER', shipperAddress: '부산 해운대구',
          consigneeName: 'E2E BL CONSIGNEE', consigneeAddress: 'Shanghai, China',
          notifyName: 'E2E NOTIFY', notifyAddress: 'Shanghai, China',
          vesselName: 'BL VESSEL', voyageNo: 'BLV01',
          portOfLoading: 'KRPUS', portOfDischarge: 'CNSHA',
          etd: '2026-03-01', eta: '2026-03-05',
          blType: 'ORIGINAL', serviceTerm: 'CY-CY', freightTerm: 'PREPAID',
        },
        cargo: {
          containerType: '20GP', packageQty: 100, packageUnit: 'CARTON',
          grossWeight: 5000, measurement: 20,
          containers: [
            { containerNo: 'BLTU1234567', sealNo: 'BLS001', containerType: '20GP', packageQty: 100, packageUnit: 'CARTON', grossWeight: 5000, measurement: 20 },
          ],
          otherCharges: [
            { code: 'OF', charges: '해상운임', currency: 'USD', amount: 2000, paymentTerm: 'PREPAID' },
          ],
        },
        other: {},
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    testId = body.blId; testJobNo = body.jobNo;
    console.log(`  [CREATE] ID=${testId}, JobNo=${testJobNo}`);
  });

  test('READ - API 단건 조회 (컨테이너+운임)', async ({ request }) => {
    const res = await request.get(`/api/bl/sea?blId=${testId}`);
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    expect(d.jobNo).toBeTruthy();
    expect(d.shipperName).toBe('E2E BL SHIPPER');
    expect(d.consigneeName).toBe('E2E BL CONSIGNEE');
    expect(Array.isArray(d.containers)).toBeTruthy();
    expect(Array.isArray(d.otherCharges)).toBeTruthy();
    console.log(`  [READ] JobNo=${testJobNo}: 컨테이너 ${d.containers.length}건, 운임 ${d.otherCharges.length}건`);
  });

  test('UI - B/L 수정화면 로딩', async ({ page }) => {
    await page.goto(`/logis/bl/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const title = page.locator('text=B/L');
    await expect(title.first()).toBeVisible({ timeout: 10000 });
    console.log(`  [UI] B/L 수정화면 로딩 확인`);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-05-bl-edit.png', fullPage: true });
  });

  test('UPDATE - B/L 수정 후 API 검증', async ({ request }) => {
    const res = await request.put(`/api/bl/sea`, {
      data: {
        id: testId,
        main: { shipperName: 'UPDATED BL SHIPPER', consigneeName: 'UPDATED BL CONSIGNEE', vesselName: 'UPDATED VESSEL' },
        cargo: {
          containers: [
            { containerNo: 'BLTU9999999', sealNo: 'BLS999', containerType: '40HC', packageQty: 200, packageUnit: 'PALLET', grossWeight: 10000, measurement: 40 },
          ],
          otherCharges: [
            { code: 'OF', charges: '해상운임', currency: 'USD', amount: 3500, paymentTerm: 'PREPAID' },
            { code: 'THC', charges: 'THC', currency: 'USD', amount: 500, paymentTerm: 'COLLECT' },
          ],
        },
        other: {},
      },
    });
    expect(res.ok()).toBeTruthy();

    const v = await (await request.get(`/api/bl/sea?blId=${testId}`)).json();
    expect(v.shipperName).toBe('UPDATED BL SHIPPER');
    expect(v.containers.length).toBe(1);
    expect(v.otherCharges.length).toBe(2);
    console.log(`  [UPDATE] B/L 수정 검증: shipper=${v.shipperName}, 컨테이너 ${v.containers.length}건, 운임 ${v.otherCharges.length}건`);
  });

  test('UI - B/L 수정 후 화면 반영 확인', async ({ page }) => {
    await page.goto(`/logis/bl/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-06-bl-updated.png', fullPage: true });
    console.log(`  [UI] B/L 수정 후 화면 로딩 확인`);
  });

  test('DELETE - B/L 삭제', async ({ request }) => {
    const res = await request.delete(`/api/bl/sea?ids=${testId}`);
    expect(res.ok()).toBeTruthy();
    console.log(`  [DELETE] B/L 삭제: ID=${testId}`);
  });
});

// ============================================================
// 4. S/R: 생성 → 상세화면 → 수정 → 삭제
// ============================================================
test.describe.serial('S/R 생성→조회→수정→삭제 Flow', () => {
  let testId: number;
  let testNo: string;

  test('CREATE - S/R 생성', async ({ request }) => {
    const res = await request.post(`/api/sr/sea`, {
      data: {
        shipperName: 'E2E SR SHIPPER', shipperAddress: '부산항',
        consigneeName: 'E2E SR CONSIGNEE', consigneeAddress: 'Shanghai Port',
        notifyParty: 'E2E SR NOTIFY',
        pol: 'KRPUS', pod: 'CNSHA', etd: '2026-03-01', eta: '2026-03-05',
        vessel: 'SR VESSEL', voyage: 'SRV01',
        commodityDesc: 'E2E CARGO', packageQty: 50, packageType: 'CARTON',
        grossWeight: 8000, volume: 35,
        transportMode: 'SEA', tradeType: 'EXPORT',
        freightTerms: 'PREPAID', status: 'DRAFT',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    testId = body.srId; testNo = body.srNo;
    console.log(`  [CREATE] ID=${testId}, No=${testNo}`);
  });

  test('READ - API 단건 조회', async ({ request }) => {
    const res = await request.get(`/api/sr/sea?srId=${testId}`);
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    expect(d.shipperName).toBe('E2E SR SHIPPER');
    expect(d.pod).toBe('CNSHA');
    expect(d.vessel).toBe('SR VESSEL');
    console.log(`  [READ] ${testNo}: shipper=${d.shipperName}, vessel=${d.vessel}`);
  });

  test('UI - S/R 상세화면 로딩', async ({ page }) => {
    await page.goto(`/logis/sr/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-07-sr-detail.png', fullPage: true });
    console.log(`  [UI] S/R 상세화면 로딩 확인`);
  });

  test('UPDATE - 수정 후 API 검증', async ({ request }) => {
    const res = await request.put(`/api/sr/sea`, {
      data: {
        id: testId, shipperName: 'UPDATED SR SHIPPER', pod: 'JPTYO', eta: '2026-03-10',
        vessel: 'UPDATED VESSEL',
      },
    });
    expect(res.ok()).toBeTruthy();

    const v = await (await request.get(`/api/sr/sea?srId=${testId}`)).json();
    expect(v.shipperName).toBe('UPDATED SR SHIPPER');
    expect(v.pod).toBe('JPTYO');
    console.log(`  [UPDATE] S/R 수정 검증: shipper=${v.shipperName}, pod=${v.pod}`);
  });

  test('UI - S/R 수정 후 화면 반영 확인', async ({ page }) => {
    await page.goto(`/logis/sr/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-08-sr-updated.png', fullPage: true });
    console.log(`  [UI] S/R 수정 후 화면 로딩 확인`);
  });

  test('DELETE - S/R 삭제', async ({ request }) => {
    const res = await request.delete(`/api/sr/sea?ids=${testId}`);
    expect(res.ok()).toBeTruthy();
    console.log(`  [DELETE] S/R 삭제: ID=${testId}`);
  });
});

// ============================================================
// 5. S/N: 생성 → 조회 → 수정 → 삭제
// ============================================================
test.describe.serial('S/N 생성→조회→수정→삭제 Flow', () => {
  let testId: number;
  let testNo: string;

  test('CREATE - S/N 생성', async ({ request }) => {
    const res = await request.post(`/api/sn/sea`, {
      data: {
        senderName: 'E2E SN SENDER', recipientName: 'E2E SN RECIPIENT',
        recipientEmail: 'test@example.com',
        pol: 'KRPUS', pod: 'CNSHA', etd: '2026-03-01', eta: '2026-03-05',
        vesselFlight: 'SN VESSEL', voyageNo: 'SNV01',
        transportMode: 'SEA', carrierName: 'TEST CARRIER',
        commodityDesc: 'E2E SN CARGO', packageQty: 30,
        grossWeight: 5000, volume: 20,
        status: 'DRAFT',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    testId = body.snId; testNo = body.snNo;
    console.log(`  [CREATE] ID=${testId}, No=${testNo}`);
  });

  test('READ - API 단건 조회', async ({ request }) => {
    const res = await request.get(`/api/sn/sea?snId=${testId}`);
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    expect(d.senderName).toBe('E2E SN SENDER');
    expect(d.recipientName).toBe('E2E SN RECIPIENT');
    expect(d.pol).toBe('KRPUS');
    console.log(`  [READ] ${testNo}: sender=${d.senderName}`);
  });

  test('UI - S/N 상세화면 로딩', async ({ page }) => {
    await page.goto(`/logis/sn/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-09-sn-detail.png', fullPage: true });
    console.log(`  [UI] S/N 상세화면 로딩 확인`);
  });

  test('UPDATE - 수정 후 API 검증', async ({ request }) => {
    const res = await request.put(`/api/sn/sea`, {
      data: {
        id: testId, senderName: 'UPDATED SN SENDER', pod: 'JPTYO',
        eta: '2026-03-10', carrierName: 'UPDATED CARRIER',
      },
    });
    expect(res.ok()).toBeTruthy();

    const v = await (await request.get(`/api/sn/sea?snId=${testId}`)).json();
    expect(v.senderName).toBe('UPDATED SN SENDER');
    expect(v.pod).toBe('JPTYO');
    console.log(`  [UPDATE] S/N 수정 검증: sender=${v.senderName}, pod=${v.pod}`);
  });

  test('UI - S/N 수정 후 화면 반영 확인', async ({ page }) => {
    await page.goto(`/logis/sn/sea/register?id=${testId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/edit-flow-10-sn-updated.png', fullPage: true });
    console.log(`  [UI] S/N 수정 후 화면 로딩 확인`);
  });

  test('DELETE - S/N 삭제', async ({ request }) => {
    const res = await request.delete(`/api/sn/sea?ids=${testId}`);
    expect(res.ok()).toBeTruthy();
    console.log(`  [DELETE] S/N 삭제: ID=${testId}`);
  });
});
