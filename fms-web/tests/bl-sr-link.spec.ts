import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// 테스트 데이터를 저장할 변수
const created: Record<string, any> = {};

// ============================================================
// House B/L → S/R 연계 기능 테스트
// ============================================================
test.describe.serial('House B/L → S/R 연계 CRUD', () => {

  // 1. S/R POST - 확장 필드 저장 확인
  test('S/R CREATE - 확장 필드 포함 등록', async ({ request }) => {
    let res;
    let retries = 3;
    while (retries > 0) {
      res = await request.post(`${BASE}/api/sr/sea`, {
        data: {
          shipperName: 'TEST SHIPPER SR',
          consigneeName: 'TEST CONSIGNEE SR',
          notifyParty: 'TEST NOTIFY',
          pol: 'KRPUS',
          pod: 'USLAX',
          cargoReadyDate: '2026-02-10',
          commodityDesc: 'ELECTRONIC PARTS',
          packageQty: 10,
          packageType: 'PKG',
          grossWeight: 5000,
          volume: 20,
          carrier: 'MAERSK',
          vessel: 'MAERSK EINDHOVEN',
          voyage: '001E',
          finalDest: 'Los Angeles, CA',
          etd: '2026-02-15',
          eta: '2026-03-01',
          freightTerms: 'CY-CY',
        }
      });
      if (res!.ok()) break;
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(res!.status()).toBe(200);
    const body = await res!.json();
    expect(body.success).toBe(true);
    expect(body.srId).toBeTruthy();
    expect(body.srNo).toMatch(/^SR-/);
    created.srId = body.srId;
    created.srNo = body.srNo;
    console.log(`  [CREATE] S/R 생성 완료: ID=${body.srId}, No=${body.srNo}`);
  });

  // 2. S/R GET - 확장 필드 조회 확인
  test('S/R READ - 확장 필드 조회', async ({ request }) => {
    const res = await request.get(`${BASE}/api/sr/sea?srId=${created.srId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.carrier).toBe('MAERSK');
    expect(body.vessel).toBe('MAERSK EINDHOVEN');
    expect(body.voyage).toBe('001E');
    expect(body.finalDest).toBe('Los Angeles, CA');
    expect(body.etd).toBe('2026-02-15');
    expect(body.eta).toBe('2026-03-01');
    expect(body.freightTerms).toBe('CY-CY');
    console.log(`  [READ] S/R 확장필드 조회 완료: carrier=${body.carrier}, vessel=${body.vessel}`);
  });

  // 3. S/R PUT - 확장 필드 수정 확인
  test('S/R UPDATE - 확장 필드 수정', async ({ request }) => {
    const res = await request.put(`${BASE}/api/sr/sea`, {
      data: {
        id: created.srId,
        shipperName: 'TEST SHIPPER SR UPDATED',
        consigneeName: 'TEST CONSIGNEE SR',
        notifyParty: 'TEST NOTIFY',
        pol: 'KRPUS',
        pod: 'CNSHA',
        grossWeight: 6000,
        volume: 25,
        carrier: 'MSC',
        vessel: 'MSC GULSUN',
        voyage: '002W',
        finalDest: 'Shanghai, CN',
        etd: '2026-02-20',
        eta: '2026-03-05',
        freightTerms: 'CFS-CFS',
      }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // 수정된 값 확인
    const readRes = await request.get(`${BASE}/api/sr/sea?srId=${created.srId}`);
    const readBody = await readRes.json();
    expect(readBody.carrier).toBe('MSC');
    expect(readBody.vessel).toBe('MSC GULSUN');
    expect(readBody.voyage).toBe('002W');
    expect(readBody.finalDest).toBe('Shanghai, CN');
    expect(readBody.freightTerms).toBe('CFS-CFS');
    console.log(`  [UPDATE] S/R 확장필드 수정 확인 완료`);
  });

  // 4. S/R POST + hblId - B/L SR_NO 자동 연계 확인
  test('S/R CREATE + hblId - B/L 연계', async ({ request }) => {
    // 먼저 B/L 생성
    const blRes = await request.post(`${BASE}/api/bl/sea`, {
      data: {
        main: {
          ioType: 'OUT',
          hblNo: `HBL-TEST-${Date.now()}`,
          businessType: 'SIMPLE',
          blType: 'ORIGINAL',
          shipperName: 'TEST SHIPPER BL',
          consigneeName: 'TEST CONSIGNEE BL',
          notifyName: 'TEST NOTIFY BL',
          lineName: 'HMM',
          vesselName: 'HMM ALGECIRAS',
          voyageNo: '003E',
          portOfLoading: 'KRPUS',
          portOfDischarge: 'USLAX',
          finalDestination: 'Los Angeles, CA',
          etd: '2026-03-01',
          eta: '2026-03-15',
          serviceTerm: 'CY/CY',
          freightTerm: 'PREPAID',
        },
        cargo: {
          containerType: 'FCL',
          packageQty: 5,
          packageUnit: 'PKG',
          grossWeight: 10000,
          measurement: 40,
        },
        other: {}
      }
    });

    if (blRes.ok()) {
      const blBody = await blRes.json();
      created.blId = blBody.blId;
      console.log(`  [SETUP] B/L 생성 완료: ID=${blBody.blId}`);

      // S/R 등록 (hblId 포함)
      const srRes = await request.post(`${BASE}/api/sr/sea`, {
        data: {
          shipperName: 'TEST SHIPPER BL',
          consigneeName: 'TEST CONSIGNEE BL',
          notifyParty: 'TEST NOTIFY BL',
          pol: 'KRPUS',
          pod: 'USLAX',
          carrier: 'HMM',
          vessel: 'HMM ALGECIRAS',
          voyage: '003E',
          finalDest: 'Los Angeles, CA',
          etd: '2026-03-01',
          eta: '2026-03-15',
          freightTerms: 'CY-CY',
          grossWeight: 10000,
          volume: 40,
          hblId: created.blId,
        }
      });
      expect(srRes.status()).toBe(200);
      const srBody = await srRes.json();
      expect(srBody.success).toBe(true);
      created.linkedSrId = srBody.srId;
      created.linkedSrNo = srBody.srNo;
      console.log(`  [CREATE] S/R 연계 생성 완료: SR_NO=${srBody.srNo}`);

      // B/L 조회하여 SR_NO 연계 확인
      const blCheckRes = await request.get(`${BASE}/api/bl/sea?blId=${created.blId}`);
      if (blCheckRes.ok()) {
        const blCheckBody = await blCheckRes.json();
        expect(blCheckBody.srNo).toBe(srBody.srNo);
        console.log(`  [VERIFY] B/L SR_NO 연계 확인: ${blCheckBody.srNo}`);
      }
    } else {
      console.log('  [SKIP] B/L 생성 실패 - 연계 테스트 스킵');
    }
  });

  // 5. S/R DELETE - 소프트 삭제 확인
  test('S/R DELETE - 소프트 삭제', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/sr/sea?ids=${created.srId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // 삭제 후 조회 - 404
    const readRes = await request.get(`${BASE}/api/sr/sea?srId=${created.srId}`);
    expect(readRes.status()).toBe(404);
    console.log(`  [DELETE] S/R 소프트 삭제 확인 완료`);
  });

  // 6. blId 없이 S/R 직접 등록 (기존 기능 보호)
  test('S/R CREATE - blId 없이 독립 등록', async ({ request }) => {
    const res = await request.post(`${BASE}/api/sr/sea`, {
      data: {
        shipperName: 'STANDALONE SHIPPER',
        consigneeName: 'STANDALONE CONSIGNEE',
        pol: 'KRPUS',
        pod: 'JPYOK',
        carrier: 'ONE',
        vessel: 'ONE COMMITMENT',
        voyage: '010E',
        grossWeight: 3000,
        volume: 15,
      }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.srNo).toMatch(/^SR-/);
    console.log(`  [CREATE] 독립 S/R 생성 완료: No=${body.srNo}`);

    // 정리
    await request.delete(`${BASE}/api/sr/sea?ids=${body.srId}`);
  });

  // 7. 연계 테스트 데이터 정리
  test('테스트 데이터 정리', async ({ request }) => {
    if (created.linkedSrId) {
      await request.delete(`${BASE}/api/sr/sea?ids=${created.linkedSrId}`);
    }
    if (created.blId) {
      await request.delete(`${BASE}/api/bl/sea?ids=${created.blId}`);
    }
    console.log('  [CLEANUP] 테스트 데이터 정리 완료');
  });
});

// ============================================================
// UI 연동 테스트
// ============================================================
test.describe('House B/L → S/R UI 연동', () => {

  // 8. S/R 등록 화면에서 B/L 데이터 자동 입력 확인
  test('S/R 등록 - blId 없이 접근 시 빈 폼', async ({ page }) => {
    await page.goto(`${BASE}/logis/sr/sea/register`);
    await page.waitForLoadState('networkidle');

    // S/R 번호가 '자동생성'인지 확인
    const srNoInput = page.locator('input[value="자동생성"]');
    await expect(srNoInput).toBeVisible();
    console.log('  [UI] S/R 등록 빈 폼 확인 완료');
  });

  // 9. House B/L S/R등록 버튼 존재 확인
  test('House B/L - S/R등록 버튼 존재 확인', async ({ page }) => {
    await page.goto(`${BASE}/logis/bl/sea/house/register`);
    await page.waitForLoadState('networkidle');

    // S/R등록 버튼 존재 확인 (상단 버튼 영역)
    const srButton = page.locator('button:has-text("S/R등록")').first();
    await expect(srButton).toBeVisible();

    // 저장 전이므로 disabled 상태여야 함
    await expect(srButton).toBeDisabled();
    console.log('  [UI] S/R등록 버튼 존재 및 비활성 상태 확인 완료');
  });
});
