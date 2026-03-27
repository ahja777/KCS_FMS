const mysql = require('mysql2/promise');

async function describeSeaBLTables() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(70));
  console.log('해상 BL 테이블 구조 확인');
  console.log('='.repeat(70));

  try {
    // 1. BL_MASTER_BL 테이블 구조
    console.log('\n[1] BL_MASTER_BL 테이블 구조...');
    const [mblCols] = await connection.query('DESCRIBE BL_MASTER_BL');
    mblCols.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 2. BL_HOUSE_BL 테이블 구조
    console.log('\n[2] BL_HOUSE_BL 테이블 구조...');
    const [hblCols] = await connection.query('DESCRIBE BL_HOUSE_BL');
    hblCols.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 3. BL_CONTAINER 테이블 구조
    console.log('\n[3] BL_CONTAINER 테이블 구조...');
    const [cntrCols] = await connection.query('DESCRIBE BL_CONTAINER');
    cntrCols.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 4. MBL 데이터 샘플 조회
    console.log('\n[4] MBL 데이터 샘플 조회...');
    const [mblRows] = await connection.query('SELECT * FROM BL_MASTER_BL WHERE DEL_YN = "N" LIMIT 3');
    mblRows.forEach((row, idx) => {
      console.log(`\n  --- MBL #${idx + 1} ---`);
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== '') {
          console.log(`  ${key}: ${row[key]}`);
        }
      });
    });

    // 5. HBL 데이터 샘플 조회
    console.log('\n[5] HBL 데이터 샘플 조회...');
    const [hblRows] = await connection.query('SELECT * FROM BL_HOUSE_BL WHERE DEL_YN = "N" LIMIT 3');
    hblRows.forEach((row, idx) => {
      console.log(`\n  --- HBL #${idx + 1} ---`);
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== '') {
          console.log(`  ${key}: ${row[key]}`);
        }
      });
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('조회 오류:', error);
  } finally {
    await connection.end();
  }
}

describeSeaBLTables();
