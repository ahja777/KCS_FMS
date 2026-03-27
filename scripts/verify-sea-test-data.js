const mysql = require('mysql2/promise');

async function verifySeaTestData() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(80));
  console.log('해상 수입/수출 데이터 검증 테스트');
  console.log('='.repeat(80));

  try {
    // =====================================================
    // 1. 해상수입 데이터 검증
    // =====================================================
    console.log('\n[해상수입 데이터 검증]');
    console.log('-'.repeat(60));

    const importMBLs = [
      'SMLMVAN2A0923400',  // CASE 1: SIMPLE
      'HDMUCGPA64044900',  // CASE 2: CONSOL FCL
      'HASLS11220700423',  // CASE 3: CONSOL LCL
      'ONEYRICCEE635400'   // CASE 4: CONSOL LCL (환적)
    ];

    for (let i = 0; i < importMBLs.length; i++) {
      const mblNo = importMBLs[i];
      const [mblRows] = await connection.query(`
        SELECT m.MBL_ID, m.MBL_NO, m.VESSEL_NM, m.VOYAGE_NO, m.POL_PORT_CD, m.POD_PORT_CD,
               m.BL_TYPE_CD, m.STATUS_CD, m.GROSS_WEIGHT_KG,
               (SELECT COUNT(*) FROM BL_HOUSE_BL h WHERE h.MBL_ID = m.MBL_ID AND h.DEL_YN = 'N') as hbl_cnt,
               (SELECT COUNT(*) FROM BL_CONTAINER c WHERE c.MBL_ID = m.MBL_ID AND c.DEL_YN = 'N') as cntr_cnt
        FROM BL_MASTER_BL m
        WHERE m.MBL_NO = ? AND m.DEL_YN = 'N'
      `, [mblNo]);

      if (mblRows.length > 0) {
        const mbl = mblRows[0];
        console.log(`\n  [수입 CASE ${i + 1}] ${mbl.MBL_NO}`);
        console.log(`    - ID: ${mbl.MBL_ID}`);
        console.log(`    - 선박/항차: ${mbl.VESSEL_NM} / ${mbl.VOYAGE_NO}`);
        console.log(`    - 구간: ${mbl.POL_PORT_CD} → ${mbl.POD_PORT_CD}`);
        console.log(`    - BL타입: ${mbl.BL_TYPE_CD}`);
        console.log(`    - 상태: ${mbl.STATUS_CD}`);
        console.log(`    - 중량: ${mbl.GROSS_WEIGHT_KG} KG`);
        console.log(`    - 연결된 HBL: ${mbl.hbl_cnt}건`);
        console.log(`    - 연결된 컨테이너: ${mbl.cntr_cnt}건`);
        console.log(`    ✓ 검증 완료`);
      } else {
        console.log(`\n  [수입 CASE ${i + 1}] ${mblNo} - ✗ 데이터 없음!`);
      }
    }

    // =====================================================
    // 2. 해상수출 데이터 검증
    // =====================================================
    console.log('\n\n[해상수출 데이터 검증]');
    console.log('-'.repeat(60));

    const exportMBLs = [
      'SMLMSEL2J1252700',   // CASE 1: SIMPLE
      'ONEYSELCA1341900',   // CASE 2: CONSOL FCL
      'ONEYSELCA3460600',   // CASE 3: CONSOL LCL
      'ONEYPUSC06215501'    // CASE 4: SIMPLE (환적)
    ];

    for (let i = 0; i < exportMBLs.length; i++) {
      const mblNo = exportMBLs[i];
      const [mblRows] = await connection.query(`
        SELECT m.MBL_ID, m.MBL_NO, m.VESSEL_NM, m.VOYAGE_NO, m.POL_PORT_CD, m.POD_PORT_CD,
               m.BL_TYPE_CD, m.STATUS_CD, m.GROSS_WEIGHT_KG, m.ETD_DT,
               (SELECT COUNT(*) FROM BL_HOUSE_BL h WHERE h.MBL_ID = m.MBL_ID AND h.DEL_YN = 'N') as hbl_cnt,
               (SELECT COUNT(*) FROM BL_CONTAINER c WHERE c.MBL_ID = m.MBL_ID AND c.DEL_YN = 'N') as cntr_cnt
        FROM BL_MASTER_BL m
        WHERE m.MBL_NO = ? AND m.DEL_YN = 'N'
      `, [mblNo]);

      if (mblRows.length > 0) {
        const mbl = mblRows[0];
        console.log(`\n  [수출 CASE ${i + 1}] ${mbl.MBL_NO}`);
        console.log(`    - ID: ${mbl.MBL_ID}`);
        console.log(`    - 선박/항차: ${mbl.VESSEL_NM} / ${mbl.VOYAGE_NO}`);
        console.log(`    - 구간: ${mbl.POL_PORT_CD} → ${mbl.POD_PORT_CD}`);
        console.log(`    - BL타입: ${mbl.BL_TYPE_CD}`);
        console.log(`    - 상태: ${mbl.STATUS_CD}`);
        console.log(`    - ETD: ${mbl.ETD_DT ? new Date(mbl.ETD_DT).toISOString().split('T')[0] : 'N/A'}`);
        console.log(`    - 연결된 HBL: ${mbl.hbl_cnt}건`);
        console.log(`    - 연결된 컨테이너: ${mbl.cntr_cnt}건`);
        console.log(`    ✓ 검증 완료`);
      } else {
        console.log(`\n  [수출 CASE ${i + 1}] ${mblNo} - ✗ 데이터 없음!`);
      }
    }

    // =====================================================
    // 3. 전체 현황 요약
    // =====================================================
    console.log('\n\n[전체 데이터 현황 요약]');
    console.log('='.repeat(60));

    const [totalMBL] = await connection.query('SELECT COUNT(*) as cnt FROM BL_MASTER_BL WHERE DEL_YN = "N"');
    const [totalHBL] = await connection.query('SELECT COUNT(*) as cnt FROM BL_HOUSE_BL WHERE DEL_YN = "N"');
    const [totalCNTR] = await connection.query('SELECT COUNT(*) as cnt FROM BL_CONTAINER WHERE DEL_YN = "N"');

    console.log(`\n  [해상 BL]`);
    console.log(`    - Master BL (MBL): ${totalMBL[0].cnt}건`);
    console.log(`    - House BL (HBL): ${totalHBL[0].cnt}건`);
    console.log(`    - Container: ${totalCNTR[0].cnt}건`);

    // BL 타입별 현황
    const [blTypeStats] = await connection.query(`
      SELECT BL_TYPE_CD, COUNT(*) as cnt
      FROM BL_MASTER_BL WHERE DEL_YN = 'N'
      GROUP BY BL_TYPE_CD
    `);
    console.log(`\n  [BL 타입별 현황]`);
    blTypeStats.forEach(row => {
      console.log(`    - ${row.BL_TYPE_CD || '미지정'}: ${row.cnt}건`);
    });

    // 상태별 현황
    const [statusStats] = await connection.query(`
      SELECT STATUS_CD, COUNT(*) as cnt
      FROM BL_MASTER_BL WHERE DEL_YN = 'N'
      GROUP BY STATUS_CD
    `);
    console.log(`\n  [상태별 현황]`);
    statusStats.forEach(row => {
      console.log(`    - ${row.STATUS_CD || '미지정'}: ${row.cnt}건`);
    });

    // AWB 데이터 현황
    const [totalMAWB] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_MASTER_AWB WHERE DEL_YN = "N"');
    const [totalHAWB] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_HOUSE_AWB WHERE DEL_YN = "N"');

    console.log(`\n  [항공 AWB]`);
    console.log(`    - Master AWB (MAWB): ${totalMAWB[0].cnt}건`);
    console.log(`    - House AWB (HAWB): ${totalHAWB[0].cnt}건`);

    console.log('\n' + '='.repeat(80));
    console.log('검증 테스트 완료!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('검증 오류:', error);
  } finally {
    await connection.end();
  }
}

verifySeaTestData();
