const mysql = require('mysql2/promise');

async function testKoreanEncoding() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic',
    charset: 'utf8mb4'
  });

  console.log('=== 한글 인코딩 테스트 ===\n');

  // 테스트 데이터 삽입
  const testData = {
    bookingNo: 'TEST-KR-' + Date.now(),
    shipperName: '한국물류주식회사',
    shipperAddress: '서울특별시 강남구 테헤란로 123',
    consigneeName: '미국수입업체',
    commodityDesc: '전자제품 및 기계류',
    remarks: '위험물 아님, 신속 배송 요청'
  };

  try {
    // 1. INSERT 테스트
    console.log('1. 데이터 삽입 중...');
    const [insertResult] = await connection.execute(`
      INSERT INTO ORD_OCEAN_BOOKING (
        BOOKING_NO, SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM,
        COMMODITY_DESC, REMARKS, POL_PORT_CD, POD_PORT_CD,
        STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, 'KRPUS', 'USLAX', 'DRAFT', 'N', 'test', NOW())
    `, [
      testData.bookingNo,
      testData.shipperName,
      testData.shipperAddress,
      testData.consigneeName,
      testData.commodityDesc,
      testData.remarks
    ]);

    const insertedId = insertResult.insertId;
    console.log(`   삽입 완료! BOOKING_ID: ${insertedId}`);

    // 2. SELECT 테스트
    console.log('\n2. 데이터 조회 중...');
    const [rows] = await connection.execute(`
      SELECT BOOKING_ID, BOOKING_NO, SHIPPER_NM, SHIPPER_ADDR,
             CONSIGNEE_NM, COMMODITY_DESC, REMARKS
      FROM ORD_OCEAN_BOOKING
      WHERE BOOKING_ID = ?
    `, [insertedId]);

    if (rows.length > 0) {
      const saved = rows[0];
      console.log('\n[ 저장된 데이터 확인 ]');
      console.log(`  BOOKING_NO: ${saved.BOOKING_NO}`);
      console.log(`  화주명(SHIPPER_NM): ${saved.SHIPPER_NM}`);
      console.log(`  화주주소(SHIPPER_ADDR): ${saved.SHIPPER_ADDR}`);
      console.log(`  수하인명(CONSIGNEE_NM): ${saved.CONSIGNEE_NM}`);
      console.log(`  품명(COMMODITY_DESC): ${saved.COMMODITY_DESC}`);
      console.log(`  비고(REMARKS): ${saved.REMARKS}`);

      // 3. 검증
      console.log('\n[ 인코딩 검증 ]');
      const checks = [
        { field: 'SHIPPER_NM', expected: testData.shipperName, actual: saved.SHIPPER_NM },
        { field: 'SHIPPER_ADDR', expected: testData.shipperAddress, actual: saved.SHIPPER_ADDR },
        { field: 'CONSIGNEE_NM', expected: testData.consigneeName, actual: saved.CONSIGNEE_NM },
        { field: 'COMMODITY_DESC', expected: testData.commodityDesc, actual: saved.COMMODITY_DESC },
        { field: 'REMARKS', expected: testData.remarks, actual: saved.REMARKS }
      ];

      let allPassed = true;
      for (const check of checks) {
        const passed = check.expected === check.actual;
        console.log(`  ${check.field}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
        if (!passed) {
          console.log(`    Expected: ${check.expected}`);
          console.log(`    Actual: ${check.actual}`);
          allPassed = false;
        }
      }

      console.log('\n' + '='.repeat(50));
      if (allPassed) {
        console.log('✓ 한글 인코딩 테스트 성공!');
        console.log('  모든 한글 데이터가 정상적으로 저장되었습니다.');
      } else {
        console.log('✗ 한글 인코딩 테스트 실패');
        console.log('  일부 데이터가 손상되었습니다.');
      }
      console.log('='.repeat(50));
    }

    // 4. 테스트 데이터 삭제 (정리)
    console.log('\n3. 테스트 데이터 정리 중...');
    await connection.execute(`DELETE FROM ORD_OCEAN_BOOKING WHERE BOOKING_ID = ?`, [insertedId]);
    console.log('   테스트 데이터 삭제 완료');

  } catch (error) {
    console.error('에러 발생:', error.message);
  }

  await connection.end();
}

testKoreanEncoding().catch(console.error);
