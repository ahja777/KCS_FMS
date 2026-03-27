const mysql = require('mysql2/promise');

async function checkSeaBLTables() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(60));
  console.log('해상 BL 테이블 및 데이터 현황 점검');
  console.log('='.repeat(60));

  try {
    // 1. 테이블 존재 여부 확인
    console.log('\n[1] 테이블 존재 여부 확인...');

    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'logstic'
      AND TABLE_NAME LIKE '%BL%' OR TABLE_NAME LIKE '%SHIPMENT%'
      ORDER BY TABLE_NAME
    `);

    console.log('  발견된 BL/SHIPMENT 관련 테이블:');
    if (tables.length === 0) {
      console.log('  - 관련 테이블 없음');
    } else {
      tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
    }

    // 2. 모든 테이블 목록 확인
    console.log('\n[2] 전체 테이블 목록...');
    const [allTables] = await connection.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'logstic'
      ORDER BY TABLE_NAME
    `);

    console.log('  전체 테이블:');
    allTables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));

    // 3. 해상 BL 테이블 데이터 확인 (있을 경우)
    const blTables = ['BL_MASTER_BL', 'BL_HOUSE_BL', 'MASTER_BL', 'HOUSE_BL', 'MBL', 'HBL'];

    console.log('\n[3] 해상 BL 테이블 데이터 확인...');
    for (const tableName of blTables) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
        console.log(`  - ${tableName}: ${count[0].cnt}건`);
      } catch (e) {
        // 테이블이 없으면 무시
      }
    }

    // 4. AWB 테이블 데이터 확인
    console.log('\n[4] AWB 테이블 데이터 확인...');
    try {
      const [mawbCount] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_MASTER_AWB WHERE DEL_YN = "N"');
      const [hawbCount] = await connection.query('SELECT COUNT(*) as cnt FROM AWB_HOUSE_AWB WHERE DEL_YN = "N"');
      console.log(`  - AWB_MASTER_AWB: ${mawbCount[0].cnt}건`);
      console.log(`  - AWB_HOUSE_AWB: ${hawbCount[0].cnt}건`);
    } catch (e) {
      console.log('  - AWB 테이블 없음 또는 오류:', e.message);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('점검 오류:', error);
  } finally {
    await connection.end();
  }
}

checkSeaBLTables();
