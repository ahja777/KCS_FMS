const mysql = require('mysql2/promise');

async function insertData() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic',
    multipleStatements: true
  });

  try {
    console.log('Connected to database');

    // 1. 관세사 데이터 삽입 (실제 컬럼에 맞춤)
    console.log('Inserting customs brokers...');
    const brokers = [
      { BROKER_ID: 'BRK001', BROKER_CD: 'KB001', BROKER_NM: '한국관세사', LICENSE_NO: '2024-001', BIZ_REG_NO: '123-45-67890', CEO_NM: '김관세', COUNTRY_CD: 'KR', ADDR: '서울시 강남구 테헤란로 123', TEL_NO: '02-1234-5678', FAX_NO: '02-1234-5679', EMAIL: 'korea@customs.com', CONTACT_NM: '김담당', EDI_ID: 'KCS001', USE_YN: 'Y' },
      { BROKER_ID: 'BRK002', BROKER_CD: 'KB002', BROKER_NM: '대한통관', LICENSE_NO: '2024-002', BIZ_REG_NO: '234-56-78901', CEO_NM: '이통관', COUNTRY_CD: 'KR', ADDR: '서울시 중구 을지로 456', TEL_NO: '02-2345-6789', FAX_NO: '02-2345-6790', EMAIL: 'daehan@customs.com', CONTACT_NM: '이담당', EDI_ID: 'KCS002', USE_YN: 'Y' },
      { BROKER_ID: 'BRK003', BROKER_CD: 'KB003', BROKER_NM: '글로벌관세법인', LICENSE_NO: '2024-003', BIZ_REG_NO: '345-67-89012', CEO_NM: '박글로벌', COUNTRY_CD: 'KR', ADDR: '인천시 중구 공항로 789', TEL_NO: '032-123-4567', FAX_NO: '032-123-4568', EMAIL: 'global@customs.com', CONTACT_NM: '박담당', EDI_ID: 'KCS003', USE_YN: 'Y' },
      { BROKER_ID: 'BRK004', BROKER_CD: 'KB004', BROKER_NM: '인천관세사', LICENSE_NO: '2024-004', BIZ_REG_NO: '456-78-90123', CEO_NM: '최인천', COUNTRY_CD: 'KR', ADDR: '인천시 연수구 송도동 111', TEL_NO: '032-234-5678', FAX_NO: '032-234-5679', EMAIL: 'incheon@customs.com', CONTACT_NM: '최담당', EDI_ID: 'KCS004', USE_YN: 'Y' },
      { BROKER_ID: 'BRK005', BROKER_CD: 'KB005', BROKER_NM: '부산통관법인', LICENSE_NO: '2024-005', BIZ_REG_NO: '567-89-01234', CEO_NM: '정부산', COUNTRY_CD: 'KR', ADDR: '부산시 중구 중앙대로 222', TEL_NO: '051-345-6789', FAX_NO: '051-345-6790', EMAIL: 'busan@customs.com', CONTACT_NM: '정담당', EDI_ID: 'KCS005', USE_YN: 'Y' }
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
    console.log('Customs brokers done\n');

    // 2. 통관 테스트 데이터 삽입 (실제 컬럼에 맞춤)
    // DECLARATION_ID, SHIPMENT_ID, DECLARATION_NO, DECLARATION_TYPE, DECLARATION_DATE, CUSTOMS_BROKER_ID,
    // DECLARANT, IMPORTER_EXPORTER, IMPORTER_EXPORTER_BRN, HS_CODE, GOODS_DESC, COUNTRY_ORIGIN,
    // PACKAGE_QTY, GROSS_WEIGHT, DECLARED_VALUE, CURRENCY, DUTY_AMOUNT, VAT_AMOUNT, TOTAL_TAX, STATUS
    console.log('Inserting customs declarations...');
    const declarations = [
      { DECLARATION_ID: 'DEC001', SHIPMENT_ID: 'SHP001', DECLARATION_NO: 'ED2024-001234', DECLARATION_TYPE: 'EXPORT', DECLARATION_DATE: '2024-01-15', CUSTOMS_BROKER_ID: 'BRK001', DECLARANT: '김신고', IMPORTER_EXPORTER: '삼성전자', IMPORTER_EXPORTER_BRN: '123-81-12345', HS_CODE: '8528.72', GOODS_DESC: '텔레비전 LCD 50인치', COUNTRY_ORIGIN: 'KR', PACKAGE_QTY: 100, GROSS_WEIGHT: 5000, DECLARED_VALUE: 150000, CURRENCY: 'USD', DUTY_AMOUNT: 0, VAT_AMOUNT: 0, TOTAL_TAX: 0, STATUS: 'ACCEPTED' },
      { DECLARATION_ID: 'DEC002', SHIPMENT_ID: 'SHP002', DECLARATION_NO: 'ED2024-001235', DECLARATION_TYPE: 'EXPORT', DECLARATION_DATE: '2024-01-16', CUSTOMS_BROKER_ID: 'BRK002', DECLARANT: '이신고', IMPORTER_EXPORTER: 'LG전자', IMPORTER_EXPORTER_BRN: '234-81-23456', HS_CODE: '8418.10', GOODS_DESC: '냉장고 프렌치도어', COUNTRY_ORIGIN: 'KR', PACKAGE_QTY: 50, GROSS_WEIGHT: 8000, DECLARED_VALUE: 75000, CURRENCY: 'USD', DUTY_AMOUNT: 0, VAT_AMOUNT: 0, TOTAL_TAX: 0, STATUS: 'SUBMITTED' },
      { DECLARATION_ID: 'DEC003', SHIPMENT_ID: 'SHP003', DECLARATION_NO: 'ID2024-002345', DECLARATION_TYPE: 'IMPORT', DECLARATION_DATE: '2024-01-17', CUSTOMS_BROKER_ID: 'BRK003', DECLARANT: '박신고', IMPORTER_EXPORTER: '현대상사', IMPORTER_EXPORTER_BRN: '345-81-34567', HS_CODE: '8471.30', GOODS_DESC: '노트북 컴퓨터', COUNTRY_ORIGIN: 'CN', PACKAGE_QTY: 200, GROSS_WEIGHT: 1000, DECLARED_VALUE: 200000, CURRENCY: 'USD', DUTY_AMOUNT: 16000, VAT_AMOUNT: 20000, TOTAL_TAX: 36000, STATUS: 'CLEARED' },
      { DECLARATION_ID: 'DEC004', SHIPMENT_ID: 'SHP004', DECLARATION_NO: 'ID2024-002346', DECLARATION_TYPE: 'IMPORT', DECLARATION_DATE: '2024-01-18', CUSTOMS_BROKER_ID: 'BRK004', DECLARANT: '최신고', IMPORTER_EXPORTER: '동대문무역', IMPORTER_EXPORTER_BRN: '456-81-45678', HS_CODE: '6204.62', GOODS_DESC: '여성의류 면제품', COUNTRY_ORIGIN: 'VN', PACKAGE_QTY: 5000, GROSS_WEIGHT: 2500, DECLARED_VALUE: 50000, CURRENCY: 'USD', DUTY_AMOUNT: 6500, VAT_AMOUNT: 5000, TOTAL_TAX: 11500, STATUS: 'SUBMITTED' },
      { DECLARATION_ID: 'DEC005', SHIPMENT_ID: 'SHP005', DECLARATION_NO: 'ED2024-001236', DECLARATION_TYPE: 'EXPORT', DECLARATION_DATE: '2024-01-19', CUSTOMS_BROKER_ID: 'BRK005', DECLARANT: '정신고', IMPORTER_EXPORTER: '포스코', IMPORTER_EXPORTER_BRN: '567-81-56789', HS_CODE: '7208.51', GOODS_DESC: '열연강판 코일', COUNTRY_ORIGIN: 'KR', PACKAGE_QTY: 10, GROSS_WEIGHT: 250000, DECLARED_VALUE: 175000, CURRENCY: 'USD', DUTY_AMOUNT: 0, VAT_AMOUNT: 0, TOTAL_TAX: 0, STATUS: 'DRAFT' }
    ];

    for (const decl of declarations) {
      try {
        await connection.query(
          `INSERT INTO CUS_DECLARATION (DECLARATION_ID, SHIPMENT_ID, DECLARATION_NO, DECLARATION_TYPE, DECLARATION_DATE, CUSTOMS_BROKER_ID, DECLARANT, IMPORTER_EXPORTER, IMPORTER_EXPORTER_BRN, HS_CODE, GOODS_DESC, COUNTRY_ORIGIN, PACKAGE_QTY, GROSS_WEIGHT, DECLARED_VALUE, CURRENCY, DUTY_AMOUNT, VAT_AMOUNT, TOTAL_TAX, STATUS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE DECLARATION_NO = VALUES(DECLARATION_NO)`,
          [decl.DECLARATION_ID, decl.SHIPMENT_ID, decl.DECLARATION_NO, decl.DECLARATION_TYPE, decl.DECLARATION_DATE, decl.CUSTOMS_BROKER_ID, decl.DECLARANT, decl.IMPORTER_EXPORTER, decl.IMPORTER_EXPORTER_BRN, decl.HS_CODE, decl.GOODS_DESC, decl.COUNTRY_ORIGIN, decl.PACKAGE_QTY, decl.GROSS_WEIGHT, decl.DECLARED_VALUE, decl.CURRENCY, decl.DUTY_AMOUNT, decl.VAT_AMOUNT, decl.TOTAL_TAX, decl.STATUS]
        );
        console.log(`  Inserted: ${decl.DECLARATION_NO}`);
      } catch (e) {
        console.log(`  Warning: ${decl.DECLARATION_ID} - ${e.message}`);
      }
    }
    console.log('Customs declarations done\n');

    // Verify data
    const [brokersCount] = await connection.query('SELECT COUNT(*) as cnt FROM MST_CUSTOMS_BROKER');
    const [declsCount] = await connection.query('SELECT COUNT(*) as cnt FROM CUS_DECLARATION');
    const [amsCount] = await connection.query("SELECT COUNT(*) as cnt FROM CUS_AMS_MANIFEST WHERE AMS_TYPE = 'AMS'");
    const [manifestCount] = await connection.query("SELECT COUNT(*) as cnt FROM CUS_AMS_MANIFEST WHERE AMS_TYPE = 'MANIFEST'");

    console.log('=== Final Verification Results ===');
    console.log('Customs Brokers:', brokersCount[0].cnt, 'records');
    console.log('Declarations:', declsCount[0].cnt, 'records');
    console.log('AMS:', amsCount[0].cnt, 'records');
    console.log('Manifest:', manifestCount[0].cnt, 'records');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
    console.log('\nDatabase connection closed');
  }
}

insertData();
