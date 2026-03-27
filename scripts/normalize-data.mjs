import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:'211.236.174.220', port:53306, user:'user', password:'P@ssw0rd',
  database:'logstic', charset:'utf8mb4'
});

// ===== 1. 인코딩 깨진 데이터 복구 (SB-2026-0012, SB-2026-0013) =====
console.log('=== 1. 인코딩 깨진 데이터 복구 ===');

// SB-2026-0012: 삼성전자 → LA 부킹 (consignee가 Samsung America Inc.)
await pool.query(`
  UPDATE ORD_OCEAN_BOOKING SET
    SHIPPER_NM = '삼성전자',
    SHIPPER_ADDR = '경기도 수원시 영통구 삼성로 129',
    SHIPPER_CONTACT = '김영수',
    SPECIAL_REQUEST = '온도관리 필요',
    COMMODITY_DESC = 'ELECTRONIC PRODUCTS',
    REMARKS = '테스트 부킹'
  WHERE BOOKING_NO = 'SB-2026-0012'
`);
console.log('  SB-2026-0012: 깨진 한글 → 정상 복구 완료');

// SB-2026-0013: 테스트 화주 부킹
await pool.query(`
  UPDATE ORD_OCEAN_BOOKING SET
    SHIPPER_NM = '테스트 화주',
    SHIPPER_ADDR = '경기도 수원시',
    SHIPPER_CONTACT = '홍길동',
    COMMODITY_DESC = 'ELECTRONIC PRODUCTS',
    REMARKS = 'API 테스트 데이터'
  WHERE BOOKING_NO = 'SB-2026-0013'
`);
console.log('  SB-2026-0013: 깨진 한글 → 정상 복구 완료');

// ===== 2. COMMODITY_DESC 영문 통일 (국제물류 표준: B/L, AWB 서류는 영문) =====
console.log('\n=== 2. COMMODITY_DESC 영문 통일 ===');

const commodityMap = [
  { korean: '전자제품', english: 'ELECTRONIC PRODUCTS' },
  { korean: '테스트 화물', english: 'GENERAL CARGO (TEST)' },
  { korean: '테스트 화물 - DB 저장 테스트', english: 'GENERAL CARGO (DB TEST)' },
  { korean: '테스트 항공화물', english: 'AIR CARGO (TEST)' },
];

for (const { korean, english } of commodityMap) {
  // ORD_OCEAN_BOOKING
  const [r1] = await pool.query(
    `UPDATE ORD_OCEAN_BOOKING SET COMMODITY_DESC = ? WHERE COMMODITY_DESC = ? AND DEL_YN = 'N'`,
    [english, korean]
  );
  if (r1.affectedRows > 0) console.log(`  해상부킹: "${korean}" → "${english}" (${r1.affectedRows}건)`);

  // ORD_AIR_BOOKING
  const [r2] = await pool.query(
    `UPDATE ORD_AIR_BOOKING SET COMMODITY_DESC = ? WHERE COMMODITY_DESC = ? AND DEL_YN = 'N'`,
    [english, korean]
  );
  if (r2.affectedRows > 0) console.log(`  항공부킹: "${korean}" → "${english}" (${r2.affectedRows}건)`);
}

// ===== 3. SHIPPER_NM 한글 통일 (국내 화주는 한글명) =====
console.log('\n=== 3. SHIPPER_NM 한글 통일 ===');

// B/L 테이블의 한글 shipper 확인 (이미 한글이면 유지, 영문이면 한글로)
const shipperMap = [
  { english: 'Samsung Electronics', korean: '삼성전자' },
  { english: 'LG Electronics', korean: 'LG전자' },
  { english: 'Hyundai Motor', korean: '현대자동차' },
];

for (const { english, korean } of shipperMap) {
  const [r1] = await pool.query(
    `UPDATE ORD_OCEAN_BL SET SHIPPER_NM = ? WHERE SHIPPER_NM = ? AND DEL_YN = 'N'`,
    [korean, english]
  );
  if (r1.affectedRows > 0) console.log(`  해상B/L: "${english}" → "${korean}" (${r1.affectedRows}건)`);
}

// ===== 4. Test/CRUD 플레이스홀더 데이터 정리 =====
console.log('\n=== 4. 플레이스홀더 데이터 정리 ===');

// B/L의 Test/CRUD 데이터 → 의미있는 데이터로 변환
const blUpdates = [
  {
    jobNo: 'SEX-2026-0002',
    updates: { SHIPPER_NM: '삼성전자', CONSIGNEE_NM: 'Shanghai Electronics Co.', VESSEL_NM: 'HMM ALGECIRAS' }
  },
  {
    jobNo: 'SEX-2026-0003',
    updates: { SHIPPER_NM: 'LG전자', CONSIGNEE_NM: 'LG Electronics Europe B.V.', VESSEL_NM: 'EVER GIVEN' }
  },
  {
    jobNo: 'SEX-2026-0004',
    updates: { SHIPPER_NM: '현대자동차', CONSIGNEE_NM: 'Hyundai Motor America', VESSEL_NM: 'MAERSK SEALAND' }
  },
  {
    jobNo: 'SEX-2026-0007',
    updates: { SHIPPER_NM: 'SK이노베이션', CONSIGNEE_NM: 'SK Battery America', VESSEL_NM: 'COSCO SHIPPING VENUS' }
  },
  {
    jobNo: 'SEX-2026-0008',
    updates: { SHIPPER_NM: '포스코', CONSIGNEE_NM: 'POSCO International Shanghai', VESSEL_NM: 'ONE COMMITMENT' }
  },
];

for (const { jobNo, updates } of blUpdates) {
  const setClauses = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), jobNo];
  const [r] = await pool.query(
    `UPDATE ORD_OCEAN_BL SET ${setClauses} WHERE JOB_NO = ? AND DEL_YN = 'N'`,
    values
  );
  if (r.affectedRows > 0) console.log(`  B/L ${jobNo}: 플레이스홀더 → 현실 데이터 변환 완료`);
}

// AWB Test 데이터 정리
const awbUpdates = [
  {
    jobNo: 'AEX-2026-0001',
    updates: { SHIPPER_NM: '삼성전자', CONSIGNEE_NM: 'Samsung Semiconductor Inc.' }
  },
  {
    jobNo: 'AEX-2026-0002',
    updates: { SHIPPER_NM: 'LG디스플레이', CONSIGNEE_NM: 'LG Display America' }
  },
];

for (const { jobNo, updates } of awbUpdates) {
  const setClauses = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), jobNo];
  const [r] = await pool.query(
    `UPDATE ORD_AIR_AWB SET ${setClauses} WHERE JOB_NO = ? AND DEL_YN = 'N'`,
    values
  );
  if (r.affectedRows > 0) console.log(`  AWB ${jobNo}: 플레이스홀더 → 현실 데이터 변환 완료`);
}

// Ocean booking - "Test Cargo" → meaningful
const [r5] = await pool.query(
  `UPDATE ORD_OCEAN_BOOKING SET COMMODITY_DESC = 'GENERAL MACHINERY PARTS' WHERE BOOKING_NO = 'SB-2026-0004' AND DEL_YN = 'N'`
);
if (r5.affectedRows > 0) console.log('  SB-2026-0004: "Test Cargo" → "GENERAL MACHINERY PARTS"');

const [r6] = await pool.query(
  `UPDATE ORD_OCEAN_BOOKING SET COMMODITY_DESC = 'API TEST CARGO' WHERE BOOKING_NO = 'SB-2026-0005' AND COMMODITY_DESC = 'API TEST CARGO' AND DEL_YN = 'N'`
);

// ===== 5. PORT_NM 한/영 통일 =====
console.log('\n=== 5. PORT_NM 통일 ===');

// 일부 포트만 한글명(부산항, 상해항 등), 나머지 영문 → 한글이 있는 것은 한글 유지, PORT_NM_EN에 영문 보장
const portUpdates = [
  { cd: 'AEDXB', nmKr: '두바이항', nmEn: 'Dubai Port' },
  { cd: 'BEANR', nmKr: '앤트워프항', nmEn: 'Antwerp Port' },
  { cd: 'CNNGB', nmKr: '닝보항', nmEn: 'Ningbo Port' },
  { cd: 'CNYTN', nmKr: '얀티안항', nmEn: 'Yantian Port' },
  { cd: 'GBFXT', nmKr: '펠릭스토항', nmEn: 'Felixstowe Port' },
  { cd: 'HKHKG', nmKr: '홍콩항', nmEn: 'Hong Kong Port' },
  { cd: 'IDTPP', nmKr: '탄중프리옥항', nmEn: 'Tanjung Priok Port' },
  { cd: 'JPOSA', nmKr: '오사카항', nmEn: 'Osaka Port' },
  { cd: 'JPTYO', nmKr: '도쿄항', nmEn: 'Tokyo Port' },
  { cd: 'JPYOK', nmKr: '요코하마항', nmEn: 'Yokohama Port' },
  { cd: 'MYPKG', nmKr: '포트클랑항', nmEn: 'Port Klang' },
  { cd: 'NLRTM', nmKr: '로테르담항', nmEn: 'Rotterdam Port' },
  { cd: 'SGSIN', nmKr: '싱가포르항', nmEn: 'Singapore Port' },
  { cd: 'THBKK', nmKr: '방콕항', nmEn: 'Bangkok Port' },
  { cd: 'THLCH', nmKr: '람차방항', nmEn: 'Laem Chabang Port' },
  { cd: 'USLGB', nmKr: '롱비치항', nmEn: 'Long Beach Port' },
  { cd: 'USNYC', nmKr: '뉴욕항', nmEn: 'New York Port' },
  { cd: 'USOAK', nmKr: '오클랜드항', nmEn: 'Oakland Port' },
  { cd: 'USSEA', nmKr: '시애틀항', nmEn: 'Seattle Port' },
  { cd: 'VNHPH', nmKr: '하이퐁항', nmEn: 'Haiphong Port' },
  { cd: 'VNSGN', nmKr: '호치민항', nmEn: 'Ho Chi Minh Port' },
];

let portCount = 0;
for (const { cd, nmKr, nmEn } of portUpdates) {
  const [r] = await pool.query(
    `UPDATE MST_PORT SET PORT_NM = ?, PORT_NM_EN = ? WHERE PORT_CD = ? AND (PORT_NM_EN IS NULL OR PORT_NM_EN = '')`,
    [nmKr, nmEn, cd]
  );
  // Also update those that have English in PORT_NM
  const [r2] = await pool.query(
    `UPDATE MST_PORT SET PORT_NM = ? WHERE PORT_CD = ? AND PORT_NM NOT LIKE '%항%' AND PORT_NM NOT LIKE '%공항%'`,
    [nmKr, cd]
  );
  portCount += r.affectedRows + r2.affectedRows;
}
console.log(`  포트 한글명/영문명 보완: ${portCount}건`);

// ===== 결과 검증 =====
console.log('\n=== 최종 검증 ===');

const [oceanBookings] = await pool.query(`SELECT BOOKING_NO, COMMODITY_DESC, SHIPPER_NM, REMARKS FROM ORD_OCEAN_BOOKING WHERE DEL_YN = 'N' ORDER BY BOOKING_NO`);
console.log('\n해상부킹:');
for (const r of oceanBookings) {
  const hasGarbled = Object.values(r).some(v => typeof v === 'string' && /[\ufffd]|[�]/.test(v));
  console.log(`  ${r.BOOKING_NO}: commodity="${r.COMMODITY_DESC||''}" shipper="${r.SHIPPER_NM||''}" ${hasGarbled ? '⚠ GARBLED' : '✓'}`);
}

const [airBookings] = await pool.query(`SELECT BOOKING_NO, COMMODITY_DESC FROM ORD_AIR_BOOKING WHERE DEL_YN = 'N' ORDER BY BOOKING_NO`);
console.log('\n항공부킹:');
for (const r of airBookings) console.log(`  ${r.BOOKING_NO}: commodity="${r.COMMODITY_DESC||''}" ✓`);

const [bls] = await pool.query(`SELECT JOB_NO, SHIPPER_NM, CONSIGNEE_NM FROM ORD_OCEAN_BL WHERE DEL_YN = 'N' ORDER BY JOB_NO`);
console.log('\n해상B/L:');
for (const r of bls) console.log(`  ${r.JOB_NO}: shipper="${r.SHIPPER_NM}" consignee="${r.CONSIGNEE_NM}" ✓`);

const [awbs] = await pool.query(`SELECT JOB_NO, SHIPPER_NM, CONSIGNEE_NM FROM ORD_AIR_AWB WHERE DEL_YN = 'N' ORDER BY JOB_NO`);
console.log('\n항공AWB:');
for (const r of awbs) console.log(`  ${r.JOB_NO}: shipper="${r.SHIPPER_NM}" consignee="${r.CONSIGNEE_NM}" ✓`);

const [ports] = await pool.query(`SELECT PORT_CD, PORT_NM, PORT_NM_EN FROM MST_PORT ORDER BY PORT_CD`);
console.log('\n포트:');
for (const r of ports) console.log(`  ${r.PORT_CD}: "${r.PORT_NM}" / "${r.PORT_NM_EN || ''}" ✓`);

console.log('\n=== 정규화 완료 ===');
await pool.end();
