const mysql = require('mysql2/promise');

async function checkSeaBLData() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(70));
  console.log('해상 BL 데이터 상세 조회');
  console.log('='.repeat(70));

  try {
    // 1. Master BL 데이터 조회
    console.log('\n[1] Master BL (MBL) 데이터 조회...');
    const [mblRows] = await connection.query(`
      SELECT MBL_ID, MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO,
             POL_CD, POD_CD, ETD_DT, ETA_DT, SHIPPER_NM, CONSIGNEE_NM,
             TOTAL_PKGS, GROSS_WEIGHT_KG, STATUS_CD, BL_TYPE,
             CREATED_DTM
      FROM BL_MASTER_BL
      WHERE DEL_YN = 'N'
      ORDER BY MBL_ID
    `);

    console.log(`\n  총 ${mblRows.length}건의 MBL 데이터:`);
    console.log('  ' + '-'.repeat(66));
    console.log('  | ID | MBL_NO              | 선박/항차       | POL→POD    | 상태   |');
    console.log('  ' + '-'.repeat(66));

    mblRows.forEach(mbl => {
      const vesselVoyage = `${(mbl.VESSEL_NM || '').substring(0, 8)}/${mbl.VOYAGE_NO || ''}`.substring(0, 14);
      const route = `${mbl.POL_CD || ''}→${mbl.POD_CD || ''}`;
      console.log(`  | ${String(mbl.MBL_ID).padStart(2)} | ${(mbl.MBL_NO || '').padEnd(19)} | ${vesselVoyage.padEnd(14)} | ${route.padEnd(10)} | ${(mbl.STATUS_CD || '').padEnd(6)} |`);
    });
    console.log('  ' + '-'.repeat(66));

    // 2. House BL 데이터 조회
    console.log('\n[2] House BL (HBL) 데이터 조회...');
    const [hblRows] = await connection.query(`
      SELECT HBL_ID, HBL_NO, MBL_ID, SHIPPER_NM, CONSIGNEE_NM,
             POL_CD, POD_CD, PKGS, GROSS_WEIGHT_KG, STATUS_CD,
             CREATED_DTM
      FROM BL_HOUSE_BL
      WHERE DEL_YN = 'N'
      ORDER BY HBL_ID
    `);

    console.log(`\n  총 ${hblRows.length}건의 HBL 데이터:`);
    console.log('  ' + '-'.repeat(80));
    console.log('  | ID | HBL_NO              | MBL_ID | Shipper          | POL→POD    | 상태   |');
    console.log('  ' + '-'.repeat(80));

    hblRows.forEach(hbl => {
      const shipper = (hbl.SHIPPER_NM || '').substring(0, 16);
      const route = `${hbl.POL_CD || ''}→${hbl.POD_CD || ''}`;
      console.log(`  | ${String(hbl.HBL_ID).padStart(2)} | ${(hbl.HBL_NO || '').padEnd(19)} | ${String(hbl.MBL_ID || '').padStart(6)} | ${shipper.padEnd(16)} | ${route.padEnd(10)} | ${(hbl.STATUS_CD || '').padEnd(6)} |`);
    });
    console.log('  ' + '-'.repeat(80));

    // 3. MBL-HBL 매핑 현황
    console.log('\n[3] MBL-HBL 매핑 현황...');
    const [mappingRows] = await connection.query(`
      SELECT m.MBL_ID, m.MBL_NO, COUNT(h.HBL_ID) as hbl_count
      FROM BL_MASTER_BL m
      LEFT JOIN BL_HOUSE_BL h ON m.MBL_ID = h.MBL_ID AND h.DEL_YN = 'N'
      WHERE m.DEL_YN = 'N'
      GROUP BY m.MBL_ID, m.MBL_NO
      ORDER BY m.MBL_ID
    `);

    mappingRows.forEach(row => {
      console.log(`  MBL_ID ${row.MBL_ID} (${row.MBL_NO}): HBL ${row.hbl_count}건`);
    });

    // 4. BL 타입별 현황 (수입/수출)
    console.log('\n[4] BL 타입별 현황...');
    const [typeRows] = await connection.query(`
      SELECT BL_TYPE, COUNT(*) as cnt
      FROM BL_MASTER_BL
      WHERE DEL_YN = 'N'
      GROUP BY BL_TYPE
    `);

    typeRows.forEach(row => {
      console.log(`  - ${row.BL_TYPE || '미지정'}: ${row.cnt}건`);
    });

    // 5. 컨테이너 데이터 확인
    console.log('\n[5] 컨테이너 데이터 확인...');
    const [cntrRows] = await connection.query(`
      SELECT COUNT(*) as cnt FROM BL_CONTAINER WHERE DEL_YN = 'N'
    `);
    console.log(`  - BL_CONTAINER: ${cntrRows[0].cnt}건`);

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('조회 오류:', error);
  } finally {
    await connection.end();
  }
}

checkSeaBLData();
