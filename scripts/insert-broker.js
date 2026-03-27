const mysql = require('mysql2/promise');

async function insertBrokers() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  try {
    console.log('Connected to database');

    // 관세사 데이터 삽입 (BROKER_ID를 정수로)
    console.log('Inserting customs brokers...');
    const brokers = [
      { BROKER_ID: 1, BROKER_CD: 'KB001', BROKER_NM: '한국관세사', LICENSE_NO: '2024-001', BIZ_REG_NO: '123-45-67890', CEO_NM: '김관세', COUNTRY_CD: 'KR', ADDR: '서울시 강남구 테헤란로 123', TEL_NO: '02-1234-5678', FAX_NO: '02-1234-5679', EMAIL: 'korea@customs.com', CONTACT_NM: '김담당', EDI_ID: 'KCS001', USE_YN: 'Y' },
      { BROKER_ID: 2, BROKER_CD: 'KB002', BROKER_NM: '대한통관', LICENSE_NO: '2024-002', BIZ_REG_NO: '234-56-78901', CEO_NM: '이통관', COUNTRY_CD: 'KR', ADDR: '서울시 중구 을지로 456', TEL_NO: '02-2345-6789', FAX_NO: '02-2345-6790', EMAIL: 'daehan@customs.com', CONTACT_NM: '이담당', EDI_ID: 'KCS002', USE_YN: 'Y' },
      { BROKER_ID: 3, BROKER_CD: 'KB003', BROKER_NM: '글로벌관세법인', LICENSE_NO: '2024-003', BIZ_REG_NO: '345-67-89012', CEO_NM: '박글로벌', COUNTRY_CD: 'KR', ADDR: '인천시 중구 공항로 789', TEL_NO: '032-123-4567', FAX_NO: '032-123-4568', EMAIL: 'global@customs.com', CONTACT_NM: '박담당', EDI_ID: 'KCS003', USE_YN: 'Y' },
      { BROKER_ID: 4, BROKER_CD: 'KB004', BROKER_NM: '인천관세사', LICENSE_NO: '2024-004', BIZ_REG_NO: '456-78-90123', CEO_NM: '최인천', COUNTRY_CD: 'KR', ADDR: '인천시 연수구 송도동 111', TEL_NO: '032-234-5678', FAX_NO: '032-234-5679', EMAIL: 'incheon@customs.com', CONTACT_NM: '최담당', EDI_ID: 'KCS004', USE_YN: 'Y' },
      { BROKER_ID: 5, BROKER_CD: 'KB005', BROKER_NM: '부산통관법인', LICENSE_NO: '2024-005', BIZ_REG_NO: '567-89-01234', CEO_NM: '정부산', COUNTRY_CD: 'KR', ADDR: '부산시 중구 중앙대로 222', TEL_NO: '051-345-6789', FAX_NO: '051-345-6790', EMAIL: 'busan@customs.com', CONTACT_NM: '정담당', EDI_ID: 'KCS005', USE_YN: 'Y' }
    ];

    for (const broker of brokers) {
      try {
        await connection.query(
          `INSERT INTO MST_CUSTOMS_BROKER (BROKER_ID, BROKER_CD, BROKER_NM, LICENSE_NO, BIZ_REG_NO, CEO_NM, COUNTRY_CD, ADDR, TEL_NO, FAX_NO, EMAIL, CONTACT_NM, EDI_ID, USE_YN)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE BROKER_NM = VALUES(BROKER_NM)`,
          [broker.BROKER_ID, broker.BROKER_CD, broker.BROKER_NM, broker.LICENSE_NO, broker.BIZ_REG_NO, broker.CEO_NM, broker.COUNTRY_CD, broker.ADDR, broker.TEL_NO, broker.FAX_NO, broker.EMAIL, broker.CONTACT_NM, broker.EDI_ID, broker.USE_YN]
        );
        console.log(`  Inserted: ${broker.BROKER_NM}`);
      } catch (e) {
        console.log(`  Warning: ${broker.BROKER_ID} - ${e.message}`);
      }
    }

    // 통관 데이터의 CUSTOMS_BROKER_ID도 업데이트
    console.log('\nUpdating declaration broker IDs...');
    await connection.query(`UPDATE CUS_DECLARATION SET CUSTOMS_BROKER_ID = 1 WHERE DECLARATION_ID = 'DEC001'`);
    await connection.query(`UPDATE CUS_DECLARATION SET CUSTOMS_BROKER_ID = 2 WHERE DECLARATION_ID = 'DEC002'`);
    await connection.query(`UPDATE CUS_DECLARATION SET CUSTOMS_BROKER_ID = 3 WHERE DECLARATION_ID = 'DEC003'`);
    await connection.query(`UPDATE CUS_DECLARATION SET CUSTOMS_BROKER_ID = 4 WHERE DECLARATION_ID = 'DEC004'`);
    await connection.query(`UPDATE CUS_DECLARATION SET CUSTOMS_BROKER_ID = 5 WHERE DECLARATION_ID = 'DEC005'`);
    console.log('Declaration broker IDs updated');

    // Verify
    const [brokersCount] = await connection.query('SELECT COUNT(*) as cnt FROM MST_CUSTOMS_BROKER');
    console.log('\nCustoms Brokers:', brokersCount[0].cnt, 'records');

    // 샘플 데이터 확인
    const [samples] = await connection.query('SELECT BROKER_ID, BROKER_CD, BROKER_NM FROM MST_CUSTOMS_BROKER LIMIT 5');
    console.log('\nSample brokers:');
    samples.forEach(s => console.log(`  ${s.BROKER_ID}: ${s.BROKER_CD} - ${s.BROKER_NM}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
    console.log('\nDone');
  }
}

insertBrokers();
