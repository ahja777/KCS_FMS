const mysql = require('mysql2/promise');

async function setupTables() {
  const conn = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('DB 연결 성공');

  // 테이블 존재 여부 확인
  const [tables] = await conn.execute(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'logstic' AND TABLE_NAME LIKE 'BL_%'
  `);

  console.log('현재 B/L 관련 테이블:', tables.map(t => t.TABLE_NAME));

  // Master B/L 테이블 생성
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS BL_MASTER_BL (
      MBL_ID INT AUTO_INCREMENT PRIMARY KEY,
      MBL_NO VARCHAR(20) NOT NULL UNIQUE,
      SHIPMENT_ID INT,
      BOOKING_ID INT,
      CARRIER_ID INT,
      VESSEL_NM VARCHAR(100),
      VOYAGE_NO VARCHAR(20),
      POL_PORT_CD VARCHAR(10),
      POD_PORT_CD VARCHAR(10),
      PLACE_OF_RECEIPT VARCHAR(100),
      PLACE_OF_DELIVERY VARCHAR(100),
      FINAL_DEST VARCHAR(100),
      ETD_DT DATE,
      ATD_DT DATE,
      ETA_DT DATE,
      ATA_DT DATE,
      ON_BOARD_DT DATE,
      ISSUE_DT DATE,
      ISSUE_PLACE VARCHAR(100),
      SHIPPER_NM VARCHAR(200),
      CONSIGNEE_NM VARCHAR(200),
      NOTIFY_PARTY VARCHAR(200),
      TOTAL_PKG_QTY INT,
      PKG_TYPE_CD VARCHAR(20),
      GROSS_WEIGHT_KG DECIMAL(15,3),
      VOLUME_CBM DECIMAL(15,3),
      COMMODITY_DESC TEXT,
      CNTR_COUNT INT,
      FREIGHT_TERM_CD VARCHAR(20),
      BL_TYPE_CD VARCHAR(20),
      ORIGINAL_BL_COUNT INT DEFAULT 3,
      STATUS_CD VARCHAR(20) DEFAULT 'DRAFT',
      SURRENDER_YN CHAR(1) DEFAULT 'N',
      DEL_YN CHAR(1) DEFAULT 'N',
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY VARCHAR(50),
      UPDATED_DTM DATETIME,
      INDEX idx_mbl_status (STATUS_CD),
      INDEX idx_mbl_carrier (CARRIER_ID),
      INDEX idx_mbl_shipment (SHIPMENT_ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('BL_MASTER_BL 테이블 생성/확인 완료');

  // House B/L 테이블 생성
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS BL_HOUSE_BL (
      HBL_ID INT AUTO_INCREMENT PRIMARY KEY,
      HBL_NO VARCHAR(20) NOT NULL UNIQUE,
      SHIPMENT_ID INT,
      MBL_ID INT,
      CUSTOMER_ID INT,
      CARRIER_ID INT,
      VESSEL_NM VARCHAR(100),
      VOYAGE_NO VARCHAR(20),
      POL_PORT_CD VARCHAR(10),
      POD_PORT_CD VARCHAR(10),
      PLACE_OF_RECEIPT VARCHAR(100),
      PLACE_OF_DELIVERY VARCHAR(100),
      FINAL_DEST VARCHAR(100),
      ETD_DT DATE,
      ATD_DT DATE,
      ETA_DT DATE,
      ATA_DT DATE,
      ON_BOARD_DT DATE,
      ISSUE_DT DATE,
      ISSUE_PLACE VARCHAR(100),
      SHIPPER_NM VARCHAR(200),
      SHIPPER_ADDR TEXT,
      CONSIGNEE_NM VARCHAR(200),
      CONSIGNEE_ADDR TEXT,
      NOTIFY_PARTY TEXT,
      TOTAL_PKG_QTY INT,
      PKG_TYPE_CD VARCHAR(20),
      GROSS_WEIGHT_KG DECIMAL(15,3),
      VOLUME_CBM DECIMAL(15,3),
      COMMODITY_DESC TEXT,
      HS_CODE VARCHAR(20),
      MARKS_NOS TEXT,
      FREIGHT_TERM_CD VARCHAR(20),
      BL_TYPE_CD VARCHAR(20),
      ORIGINAL_BL_COUNT INT DEFAULT 3,
      STATUS_CD VARCHAR(20) DEFAULT 'DRAFT',
      PRINT_YN CHAR(1) DEFAULT 'N',
      SURRENDER_YN CHAR(1) DEFAULT 'N',
      DEL_YN CHAR(1) DEFAULT 'N',
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY VARCHAR(50),
      UPDATED_DTM DATETIME,
      INDEX idx_hbl_status (STATUS_CD),
      INDEX idx_hbl_mbl (MBL_ID),
      INDEX idx_hbl_customer (CUSTOMER_ID),
      INDEX idx_hbl_shipment (SHIPMENT_ID),
      FOREIGN KEY (MBL_ID) REFERENCES BL_MASTER_BL(MBL_ID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('BL_HOUSE_BL 테이블 생성/확인 완료');

  // Container 테이블 생성
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS BL_CONTAINER (
      CONTAINER_ID INT AUTO_INCREMENT PRIMARY KEY,
      CNTR_NO VARCHAR(20) NOT NULL,
      MBL_ID INT,
      HBL_ID INT,
      CNTR_TYPE_CD VARCHAR(10),
      CNTR_SIZE_CD VARCHAR(10),
      SEAL_NO VARCHAR(50),
      TARE_WEIGHT_KG DECIMAL(15,3),
      GROSS_WEIGHT_KG DECIMAL(15,3),
      VOLUME_CBM DECIMAL(15,3),
      PKG_QTY INT,
      PKG_TYPE_CD VARCHAR(20),
      STATUS_CD VARCHAR(20),
      DEL_YN CHAR(1) DEFAULT 'N',
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY VARCHAR(50),
      UPDATED_DTM DATETIME,
      INDEX idx_cntr_mbl (MBL_ID),
      INDEX idx_cntr_hbl (HBL_ID),
      INDEX idx_cntr_no (CNTR_NO),
      FOREIGN KEY (MBL_ID) REFERENCES BL_MASTER_BL(MBL_ID) ON DELETE CASCADE,
      FOREIGN KEY (HBL_ID) REFERENCES BL_HOUSE_BL(HBL_ID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('BL_CONTAINER 테이블 생성/확인 완료');

  // 테이블 확인
  const [newTables] = await conn.execute(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'logstic' AND TABLE_NAME LIKE 'BL_%'
  `);
  console.log('\n생성된 B/L 테이블:', newTables.map(t => t.TABLE_NAME));

  await conn.end();
  console.log('\n=== 테이블 설정 완료 ===');
}

setupTables().catch(console.error);
