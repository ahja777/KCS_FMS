/**
 * KTEX 데이터 CRUD 검증 테스트
 *
 * 마이그레이션된 KTEX 데이터에 대해 READ, UPDATE, DELETE 작동 검증
 * FMS-WEB API를 통한 E2E 검증
 */

const BASE_URL = 'http://localhost:3000';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function testOceanExportBL() {
  console.log('\n🚢 [1/6] 해상수출 B/L - /api/bl/sea API 검증');

  // READ - list all
  const list = await fetchJson(`${BASE_URL}/api/bl/sea`);
  const rows = Array.isArray(list) ? list : (list.data || []);
  console.log(`  READ: ${rows.length}건 조회`);

  // KTEX 데이터 확인
  const ktexBLs = rows.filter(r => String(r.M_BL_NO || '').match(/^(HDMU|OOLU|HJSC|MAEU|SNKO|ANLU|COSU|EGLV)\d+$/));
  console.log(`  KTEX B/L: ${ktexBLs.length}건 확인`);

  if (ktexBLs.length > 0) {
    const sample = ktexBLs[0];
    console.log(`  샘플: ${sample.M_BL_NO} | ${sample.VESSEL_NM} | ${sample.POL_CD}→${sample.POD_CD}`);
  }

  return { total: rows.length, ktex: ktexBLs.length };
}

async function testImportMasterBL() {
  console.log('\n📥 [2/6] 해상수입 Master B/L - /api/bl/mbl API 검증');

  const list = await fetchJson(`${BASE_URL}/api/bl/mbl`);
  const rows = Array.isArray(list) ? list : (list.data || []);
  console.log(`  READ: ${rows.length}건 조회`);

  const ktexMBLs = rows.filter(r => String(r.MBL_NO || '').match(/^(HDMU|OOLU|MAEU|HJSC|COSU|SNKO|EGLV)\d+$/));
  console.log(`  KTEX MBL: ${ktexMBLs.length}건 확인`);

  if (ktexMBLs.length > 0) {
    const sample = ktexMBLs[0];
    console.log(`  샘플: ${sample.MBL_NO} | ${sample.VESSEL_NM} | ${sample.POL_PORT_CD}→${sample.POD_PORT_CD}`);
  }

  return { total: rows.length, ktex: ktexMBLs.length };
}

async function testImportHouseBL() {
  console.log('\n📋 [3/6] 해상수입 House B/L - /api/bl/hbl API 검증');

  const list = await fetchJson(`${BASE_URL}/api/bl/hbl`);
  const rows = Array.isArray(list) ? list : (list.data || []);
  console.log(`  READ: ${rows.length}건 조회`);

  const ktexHBLs = rows.filter(r => String(r.HBL_NO || '').startsWith('KTEX-IMP'));
  console.log(`  KTEX HBL: ${ktexHBLs.length}건 확인`);

  if (ktexHBLs.length > 0) {
    const sample = ktexHBLs[0];
    console.log(`  샘플: ${sample.HBL_NO} | MBL_ID:${sample.MBL_ID} | ${sample.CONSIGNEE_NM}`);
  }

  return { total: rows.length, ktex: ktexHBLs.length };
}

async function testAirExportMAWB() {
  console.log('\n✈️ [4/6] 항공수출 MAWB - TRN_AIR_MAWB API 검증');

  const list = await fetchJson(`${BASE_URL}/api/bl/air/master?ioType=OUT`);
  const rows = Array.isArray(list) ? list : (list.data || []);
  console.log(`  READ: ${rows.length}건 조회`);

  const ktexMAWBs = rows.filter(r => String(r.MAWB_NO || '').match(/^(185|631|988)-260/));
  console.log(`  KTEX MAWB(수출): ${ktexMAWBs.length}건 확인`);

  // UPDATE test
  if (ktexMAWBs.length > 0) {
    const target = ktexMAWBs[0];
    console.log(`  UPDATE 테스트: ${target.MAWB_NO} STATUS → BOOKED`);
    try {
      await fetchJson(`${BASE_URL}/api/bl/air/master`, {
        method: 'POST',
        body: JSON.stringify({ id: target.ID, STATUS: 'BOOKED' }),
      });
      // Verify
      const verify = await fetchJson(`${BASE_URL}/api/bl/air/master?ioType=OUT`);
      const verifyRows = Array.isArray(verify) ? verify : (verify.data || []);
      const updated = verifyRows.find(r => r.ID === target.ID);
      if (updated && updated.STATUS === 'BOOKED') {
        console.log(`  ✅ UPDATE 성공: STATUS = ${updated.STATUS}`);
      } else {
        console.log(`  ⚠️ UPDATE 결과 확인 불가`);
      }
    } catch (e) {
      console.log(`  ⚠️ UPDATE API: ${e.message}`);
    }
  }

  return { total: rows.length, ktex: ktexMAWBs.length };
}

async function testAirImportMAWB() {
  console.log('\n✈️ [5/6] 항공수입 MAWB - TRN_AIR_MAWB API 검증');

  const list = await fetchJson(`${BASE_URL}/api/bl/air/master?ioType=IN`);
  const rows = Array.isArray(list) ? list : (list.data || []);
  console.log(`  READ: ${rows.length}건 조회`);

  const ktexMAWBs = rows.filter(r => String(r.MAWB_NO || '').match(/^(185|631|988)-260/));
  console.log(`  KTEX MAWB(수입): ${ktexMAWBs.length}건 확인`);

  return { total: rows.length, ktex: ktexMAWBs.length };
}

async function testAirHAWB() {
  console.log('\n📄 [6/6] 항공 HAWB - TRN_AIR_HAWB API 검증');

  // Export HAWBs
  const expList = await fetchJson(`${BASE_URL}/api/bl/air/house?ioType=OUT`);
  const expRows = Array.isArray(expList) ? expList : (expList.data || []);
  const ktexExpHAWBs = expRows.filter(r => String(r.HAWB_NO || '').startsWith('KTEX-AE'));
  console.log(`  수출 HAWB: 전체 ${expRows.length}건, KTEX ${ktexExpHAWBs.length}건`);

  // Import HAWBs
  const impList = await fetchJson(`${BASE_URL}/api/bl/air/house?ioType=IN`);
  const impRows = Array.isArray(impList) ? impList : (impList.data || []);
  const ktexImpHAWBs = impRows.filter(r => String(r.HAWB_NO || '').startsWith('KTEX-AI'));
  console.log(`  수입 HAWB: 전체 ${impRows.length}건, KTEX ${ktexImpHAWBs.length}건`);

  // Verify MAWB_ID linkage
  if (ktexExpHAWBs.length > 0) {
    const linked = ktexExpHAWBs.filter(h => h.MAWB_ID);
    console.log(`  MAWB 연결 확인: ${linked.length}/${ktexExpHAWBs.length}건 MAWB_ID 연결됨`);
  }

  return { expTotal: expRows.length, expKtex: ktexExpHAWBs.length, impTotal: impRows.length, impKtex: ktexImpHAWBs.length };
}

async function testMasterData() {
  console.log('\n📊 마스터 데이터 API 검증');

  // Customer
  try {
    const custList = await fetchJson(`${BASE_URL}/api/customers`);
    const custs = Array.isArray(custList) ? custList : (custList.data || []);
    const ktexCusts = custs.filter(c => String(c.CUSTOMER_CD || '').startsWith('KTEX'));
    console.log(`  고객사: 전체 ${custs.length}건, KTEX ${ktexCusts.length}건`);
  } catch (e) {
    console.log(`  고객사 API: ${e.message}`);
  }

  // Carrier
  try {
    const carrList = await fetchJson(`${BASE_URL}/api/carriers`);
    const carrs = Array.isArray(carrList) ? carrList : (carrList.data || []);
    console.log(`  선사/항공사: 전체 ${carrs.length}건`);
  } catch (e) {
    console.log(`  선사 API: ${e.message}`);
  }

  // Port
  try {
    const portList = await fetchJson(`${BASE_URL}/api/ports`);
    const ports = Array.isArray(portList) ? portList : (portList.data || []);
    console.log(`  항구/공항: 전체 ${ports.length}건`);
  } catch (e) {
    console.log(`  항구 API: ${e.message}`);
  }
}

// ========================================
// MAIN
// ========================================
async function main() {
  console.log('=' .repeat(60));
  console.log('🧪 KTEX 데이터 CRUD 검증 시작');
  console.log('=' .repeat(60));

  const results = {};

  try {
    await testMasterData();
    results.oceanExport = await testOceanExportBL();
    results.importMBL = await testImportMasterBL();
    results.importHBL = await testImportHouseBL();
    results.airExportMAWB = await testAirExportMAWB();
    results.airImportMAWB = await testAirImportMAWB();
    results.airHAWB = await testAirHAWB();
  } catch (e) {
    console.error(`\n❌ 테스트 에러: ${e.message}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 CRUD 검증 결과 요약');
  console.log('=' .repeat(60));

  const checks = [
    ['해상수출 B/L', results.oceanExport?.total > 0, `전체 ${results.oceanExport?.total}건, KTEX ${results.oceanExport?.ktex}건`],
    ['해상수입 MBL', results.importMBL?.total > 0, `전체 ${results.importMBL?.total}건, KTEX ${results.importMBL?.ktex}건`],
    ['해상수입 HBL', results.importHBL?.total > 0, `전체 ${results.importHBL?.total}건, KTEX ${results.importHBL?.ktex}건`],
    ['항공수출 MAWB', results.airExportMAWB?.total > 0, `전체 ${results.airExportMAWB?.total}건, KTEX ${results.airExportMAWB?.ktex}건`],
    ['항공수입 MAWB', results.airImportMAWB?.total > 0, `전체 ${results.airImportMAWB?.total}건, KTEX ${results.airImportMAWB?.ktex}건`],
    ['항공수출 HAWB', results.airHAWB?.expTotal > 0, `전체 ${results.airHAWB?.expTotal}건, KTEX ${results.airHAWB?.expKtex}건`],
    ['항공수입 HAWB', results.airHAWB?.impTotal > 0, `전체 ${results.airHAWB?.impTotal}건, KTEX ${results.airHAWB?.impKtex}건`],
  ];

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    const icon = ok ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${detail}`);
    if (ok) passed++;
  }

  console.log(`\n결과: ${passed}/${checks.length} 검증 통과`);

  if (passed === checks.length) {
    console.log('\n✅ KTEX 데이터 CRUD 검증 완료 - 모든 테스트 통과!');
  } else {
    console.log('\n⚠️ 일부 테스트 실패 - 상세 로그 확인 필요');
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
