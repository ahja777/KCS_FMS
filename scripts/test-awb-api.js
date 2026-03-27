const mysql = require('mysql2/promise');

async function testAWBInsert() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(60));
  console.log('AWB 테스트 데이터 입력 및 DB 저장 테스트');
  console.log('='.repeat(60));

  // 테스트 데이터 (Excel 추적 테스트 시나리오에서 가져온 항공 데이터)
  const testMAWB = {
    MAWB_NO: '180-12345678',
    CARRIER_ID: 1,
    AIRLINE_CODE: 'KE',
    FLIGHT_NO: 'KE001',
    ORIGIN_AIRPORT_CD: 'ICN',
    DEST_AIRPORT_CD: 'LAX',
    ETD_DT: '2026-01-25',
    ETD_TIME: '10:00',
    ETA_DT: '2026-01-25',
    ETA_TIME: '08:30',
    SHIPPER_NM: '삼성전자 주식회사',
    SHIPPER_ADDR: '경기도 수원시 영통구 삼성로 129',
    CONSIGNEE_NM: 'Samsung America Inc.',
    CONSIGNEE_ADDR: '85 Challenger Road, Ridgefield Park, NJ 07660',
    NOTIFY_PARTY: 'SAME AS CONSIGNEE',
    PIECES: 100,
    GROSS_WEIGHT_KG: 5000.000,
    CHARGE_WEIGHT_KG: 5500.000,
    VOLUME_CBM: 35.5000,
    COMMODITY_DESC: 'ELECTRONIC COMPONENTS',
    HS_CODE: '8528.72',
    DIMENSIONS: '120x80x100 CM',
    DECLARED_VALUE: 150000.00,
    DECLARED_CURRENCY: 'USD',
    INSURANCE_VALUE: 155000.00,
    FREIGHT_CHARGES: 5500.00,
    OTHER_CHARGES: 850.00,
    PAYMENT_TERMS: 'PREPAID',
    STATUS_CD: 'DRAFT',
    REMARKS: '파손주의 (FRAGILE)',
  };

  try {
    // 1. MAWB 데이터 입력
    console.log('\n[1] Master AWB 데이터 입력...');

    const insertMAWB = `
      INSERT INTO AWB_MASTER_AWB (
        MAWB_NO, CARRIER_ID, AIRLINE_CODE, FLIGHT_NO,
        ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD,
        ETD_DT, ETD_TIME, ETA_DT, ETA_TIME,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        PIECES, GROSS_WEIGHT_KG, CHARGE_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, HS_CODE, DIMENSIONS,
        DECLARED_VALUE, DECLARED_CURRENCY, INSURANCE_VALUE,
        FREIGHT_CHARGES, OTHER_CHARGES, PAYMENT_TERMS,
        STATUS_CD, REMARKS, DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `;

    const [insertResult] = await connection.query(insertMAWB, [
      testMAWB.MAWB_NO,
      testMAWB.CARRIER_ID,
      testMAWB.AIRLINE_CODE,
      testMAWB.FLIGHT_NO,
      testMAWB.ORIGIN_AIRPORT_CD,
      testMAWB.DEST_AIRPORT_CD,
      testMAWB.ETD_DT,
      testMAWB.ETD_TIME,
      testMAWB.ETA_DT,
      testMAWB.ETA_TIME,
      testMAWB.SHIPPER_NM,
      testMAWB.SHIPPER_ADDR,
      testMAWB.CONSIGNEE_NM,
      testMAWB.CONSIGNEE_ADDR,
      testMAWB.NOTIFY_PARTY,
      testMAWB.PIECES,
      testMAWB.GROSS_WEIGHT_KG,
      testMAWB.CHARGE_WEIGHT_KG,
      testMAWB.VOLUME_CBM,
      testMAWB.COMMODITY_DESC,
      testMAWB.HS_CODE,
      testMAWB.DIMENSIONS,
      testMAWB.DECLARED_VALUE,
      testMAWB.DECLARED_CURRENCY,
      testMAWB.INSURANCE_VALUE,
      testMAWB.FREIGHT_CHARGES,
      testMAWB.OTHER_CHARGES,
      testMAWB.PAYMENT_TERMS,
      testMAWB.STATUS_CD,
      testMAWB.REMARKS,
    ]);

    console.log(`  - 입력 성공! MAWB_ID: ${insertResult.insertId}`);
    const mawbId = insertResult.insertId;

    // 2. HAWB 데이터 입력 (MAWB에 연결)
    console.log('\n[2] House AWB 데이터 입력...');

    const testHAWB = {
      HAWB_NO: 'HAWB202600001',
      SHIPMENT_ID: 1,
      MAWB_ID: mawbId,
      CUSTOMER_ID: 1,
      CARRIER_ID: 1,
      AIRLINE_CODE: 'KE',
      FLIGHT_NO: 'KE001',
      ORIGIN_AIRPORT_CD: 'ICN',
      DEST_AIRPORT_CD: 'LAX',
      ETD_DT: '2026-01-25',
      ETD_TIME: '10:00',
      ETA_DT: '2026-01-25',
      ETA_TIME: '08:30',
      SHIPPER_NM: 'LG전자 주식회사',
      SHIPPER_ADDR: '서울시 영등포구 여의대로 128',
      CONSIGNEE_NM: 'LG Electronics USA',
      CONSIGNEE_ADDR: '1000 Sylvan Ave, Englewood Cliffs, NJ 07632',
      NOTIFY_PARTY: 'SAME AS CONSIGNEE',
      PIECES: 50,
      GROSS_WEIGHT_KG: 2500.000,
      CHARGE_WEIGHT_KG: 2800.000,
      VOLUME_CBM: 18.5000,
      COMMODITY_DESC: 'DISPLAY PANELS',
      HS_CODE: '8529.90',
      DIMENSIONS: '100x60x80 CM',
      DECLARED_VALUE: 80000.00,
      DECLARED_CURRENCY: 'USD',
      INSURANCE_VALUE: 82000.00,
      FREIGHT_CHARGES: 2800.00,
      OTHER_CHARGES: 450.00,
      PAYMENT_TERMS: 'PREPAID',
      STATUS_CD: 'DRAFT',
      REMARKS: '취급주의',
    };

    const insertHAWB = `
      INSERT INTO AWB_HOUSE_AWB (
        HAWB_NO, SHIPMENT_ID, MAWB_ID, CUSTOMER_ID, CARRIER_ID, AIRLINE_CODE, FLIGHT_NO,
        ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD,
        ETD_DT, ETD_TIME, ETA_DT, ETA_TIME,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        PIECES, GROSS_WEIGHT_KG, CHARGE_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, HS_CODE, DIMENSIONS,
        DECLARED_VALUE, DECLARED_CURRENCY, INSURANCE_VALUE,
        FREIGHT_CHARGES, OTHER_CHARGES, PAYMENT_TERMS,
        STATUS_CD, REMARKS, DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `;

    const [insertHawbResult] = await connection.query(insertHAWB, [
      testHAWB.HAWB_NO,
      testHAWB.SHIPMENT_ID,
      testHAWB.MAWB_ID,
      testHAWB.CUSTOMER_ID,
      testHAWB.CARRIER_ID,
      testHAWB.AIRLINE_CODE,
      testHAWB.FLIGHT_NO,
      testHAWB.ORIGIN_AIRPORT_CD,
      testHAWB.DEST_AIRPORT_CD,
      testHAWB.ETD_DT,
      testHAWB.ETD_TIME,
      testHAWB.ETA_DT,
      testHAWB.ETA_TIME,
      testHAWB.SHIPPER_NM,
      testHAWB.SHIPPER_ADDR,
      testHAWB.CONSIGNEE_NM,
      testHAWB.CONSIGNEE_ADDR,
      testHAWB.NOTIFY_PARTY,
      testHAWB.PIECES,
      testHAWB.GROSS_WEIGHT_KG,
      testHAWB.CHARGE_WEIGHT_KG,
      testHAWB.VOLUME_CBM,
      testHAWB.COMMODITY_DESC,
      testHAWB.HS_CODE,
      testHAWB.DIMENSIONS,
      testHAWB.DECLARED_VALUE,
      testHAWB.DECLARED_CURRENCY,
      testHAWB.INSURANCE_VALUE,
      testHAWB.FREIGHT_CHARGES,
      testHAWB.OTHER_CHARGES,
      testHAWB.PAYMENT_TERMS,
      testHAWB.STATUS_CD,
      testHAWB.REMARKS,
    ]);

    console.log(`  - 입력 성공! HAWB_ID: ${insertHawbResult.insertId}`);

    // 3. 데이터 조회 검증
    console.log('\n[3] 저장된 데이터 조회 검증...');

    const [mawbRows] = await connection.query(
      'SELECT MAWB_ID, MAWB_NO, AIRLINE_CODE, FLIGHT_NO, ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD, SHIPPER_NM, STATUS_CD FROM AWB_MASTER_AWB WHERE MAWB_ID = ?',
      [mawbId]
    );

    console.log('\n  [MAWB 조회 결과]');
    console.log('  ' + '-'.repeat(56));
    if (mawbRows.length > 0) {
      const mawb = mawbRows[0];
      console.log(`  MAWB_ID      : ${mawb.MAWB_ID}`);
      console.log(`  MAWB_NO      : ${mawb.MAWB_NO}`);
      console.log(`  AIRLINE      : ${mawb.AIRLINE_CODE}`);
      console.log(`  FLIGHT_NO    : ${mawb.FLIGHT_NO}`);
      console.log(`  ROUTE        : ${mawb.ORIGIN_AIRPORT_CD} -> ${mawb.DEST_AIRPORT_CD}`);
      console.log(`  SHIPPER      : ${mawb.SHIPPER_NM}`);
      console.log(`  STATUS       : ${mawb.STATUS_CD}`);
    }

    const [hawbRows] = await connection.query(
      'SELECT HAWB_ID, HAWB_NO, MAWB_ID, SHIPPER_NM, PIECES, GROSS_WEIGHT_KG, STATUS_CD FROM AWB_HOUSE_AWB WHERE MAWB_ID = ?',
      [mawbId]
    );

    console.log('\n  [HAWB 조회 결과]');
    console.log('  ' + '-'.repeat(56));
    if (hawbRows.length > 0) {
      const hawb = hawbRows[0];
      console.log(`  HAWB_ID      : ${hawb.HAWB_ID}`);
      console.log(`  HAWB_NO      : ${hawb.HAWB_NO}`);
      console.log(`  MAWB_ID      : ${hawb.MAWB_ID}`);
      console.log(`  SHIPPER      : ${hawb.SHIPPER_NM}`);
      console.log(`  PIECES       : ${hawb.PIECES}`);
      console.log(`  GROSS_WEIGHT : ${hawb.GROSS_WEIGHT_KG} KG`);
      console.log(`  STATUS       : ${hawb.STATUS_CD}`);
    }

    // 4. 전체 AWB 수 확인
    console.log('\n[4] 전체 AWB 현황...');
    const [mawbCount] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_MASTER_AWB WHERE DEL_YN = "N"');
    const [hawbCount] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_HOUSE_AWB WHERE DEL_YN = "N"');

    console.log(`  - 전체 MAWB: ${mawbCount[0].cnt}건`);
    console.log(`  - 전체 HAWB: ${hawbCount[0].cnt}건`);

    console.log('\n' + '='.repeat(60));
    console.log('테스트 완료! AWB 데이터가 성공적으로 DB에 저장되었습니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('테스트 오류:', error);
  } finally {
    await connection.end();
  }
}

testAWBInsert();
