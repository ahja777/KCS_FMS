const mysql = require('mysql2/promise');

async function verify() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  const [rows] = await connection.execute(`
    SELECT
      BOOKING_NO, BOOKING_TYPE, SERVICE_TYPE, INCOTERMS, FREIGHT_TERMS, PAYMENT_TERMS,
      SHIPPER_CODE, SHIPPER_NM, SHIPPER_ADDR, SHIPPER_CONTACT, SHIPPER_TEL, SHIPPER_EMAIL,
      CONSIGNEE_NM, CONSIGNEE_ADDR, CONSIGNEE_CONTACT, CONSIGNEE_TEL,
      NOTIFY_NM, NOTIFY_ADDR,
      VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POL_TERMINAL, POD_PORT_CD, POD_TERMINAL, FINAL_DEST,
      ETD_DT, ETA_DT, CLOSING_DT, CLOSING_TIME,
      TOTAL_CNTR_QTY, MBL_NO, HBL_NO, BL_TYPE,
      COMMODITY_DESC, GROSS_WEIGHT_KG, VOLUME_CBM,
      SPECIAL_REQUEST, DG_YN, DG_CLASS, UN_NUMBER, IMO_CLASS,
      STATUS_CD, REMARKS
    FROM ORD_OCEAN_BOOKING
    WHERE BOOKING_ID = 14
  `);

  console.log('=== 해상 부킹 저장 결과 (새 컬럼 포함) ===\n');

  if (rows.length > 0) {
    const booking = rows[0];

    console.log('[ 기본정보 ]');
    console.log(`  부킹번호: ${booking.BOOKING_NO}`);
    console.log(`  부킹유형: ${booking.BOOKING_TYPE}`);
    console.log(`  서비스유형: ${booking.SERVICE_TYPE}`);
    console.log(`  인코텀즈: ${booking.INCOTERMS}`);
    console.log(`  운임조건: ${booking.FREIGHT_TERMS}`);
    console.log(`  결제조건: ${booking.PAYMENT_TERMS}`);

    console.log('\n[ 화주정보 ]');
    console.log(`  화주코드: ${booking.SHIPPER_CODE}`);
    console.log(`  화주명: ${booking.SHIPPER_NM}`);
    console.log(`  화주주소: ${booking.SHIPPER_ADDR}`);
    console.log(`  담당자: ${booking.SHIPPER_CONTACT}`);
    console.log(`  전화번호: ${booking.SHIPPER_TEL}`);
    console.log(`  이메일: ${booking.SHIPPER_EMAIL}`);

    console.log('\n[ 수하인정보 ]');
    console.log(`  수하인명: ${booking.CONSIGNEE_NM}`);
    console.log(`  수하인주소: ${booking.CONSIGNEE_ADDR}`);
    console.log(`  담당자: ${booking.CONSIGNEE_CONTACT}`);
    console.log(`  전화번호: ${booking.CONSIGNEE_TEL}`);

    console.log('\n[ Notify Party ]');
    console.log(`  명칭: ${booking.NOTIFY_NM}`);
    console.log(`  주소: ${booking.NOTIFY_ADDR}`);

    console.log('\n[ 스케줄정보 ]');
    console.log(`  선명: ${booking.VESSEL_NM}`);
    console.log(`  항차: ${booking.VOYAGE_NO}`);
    console.log(`  선적항: ${booking.POL_PORT_CD} (터미널: ${booking.POL_TERMINAL})`);
    console.log(`  양하항: ${booking.POD_PORT_CD} (터미널: ${booking.POD_TERMINAL})`);
    console.log(`  최종목적지: ${booking.FINAL_DEST}`);
    console.log(`  ETD: ${booking.ETD_DT}`);
    console.log(`  ETA: ${booking.ETA_DT}`);
    console.log(`  Closing: ${booking.CLOSING_DT} ${booking.CLOSING_TIME}`);

    console.log('\n[ B/L 정보 ]');
    console.log(`  MBL No: ${booking.MBL_NO || '(미입력)'}`);
    console.log(`  HBL No: ${booking.HBL_NO || '(미입력)'}`);
    console.log(`  B/L Type: ${booking.BL_TYPE}`);

    console.log('\n[ 화물정보 ]');
    console.log(`  컨테이너수: ${booking.TOTAL_CNTR_QTY}`);
    console.log(`  품명: ${booking.COMMODITY_DESC}`);
    console.log(`  총중량: ${booking.GROSS_WEIGHT_KG} KG`);
    console.log(`  용적: ${booking.VOLUME_CBM} CBM`);

    console.log('\n[ 기타 ]');
    console.log(`  특별요청: ${booking.SPECIAL_REQUEST}`);
    console.log(`  위험물: ${booking.DG_YN}`);
    console.log(`  비고: ${booking.REMARKS}`);
    console.log(`  상태: ${booking.STATUS_CD}`);

    console.log('\n=== 저장 테스트 성공! ===');
  }

  await connection.end();
}

verify().catch(console.error);
