const mysql = require('mysql2/promise');

async function createTables() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic',
    multipleStatements: true
  });

  console.log('Connected to database');

  const createMasterAWBTable = `
    CREATE TABLE IF NOT EXISTS AWB_MASTER_AWB (
      MAWB_ID INT AUTO_INCREMENT PRIMARY KEY,
      MAWB_NO VARCHAR(50) NOT NULL UNIQUE COMMENT 'Master AWB 번호',
      SHIPMENT_ID INT COMMENT '선적 ID',
      BOOKING_ID INT COMMENT '부킹 ID',
      CARRIER_ID INT NOT NULL COMMENT '운송사 ID',
      AIRLINE_CODE VARCHAR(10) COMMENT '항공사 코드',
      FLIGHT_NO VARCHAR(20) COMMENT '편명',
      ORIGIN_AIRPORT_CD VARCHAR(10) NOT NULL COMMENT '출발 공항 코드',
      DEST_AIRPORT_CD VARCHAR(10) NOT NULL COMMENT '도착 공항 코드',
      ETD_DT DATE COMMENT '출발 예정일',
      ETD_TIME VARCHAR(10) COMMENT '출발 예정 시간',
      ATD_DT DATE COMMENT '실제 출발일',
      ETA_DT DATE COMMENT '도착 예정일',
      ETA_TIME VARCHAR(10) COMMENT '도착 예정 시간',
      ATA_DT DATE COMMENT '실제 도착일',
      ISSUE_DT DATE COMMENT '발행일',
      ISSUE_PLACE VARCHAR(100) COMMENT '발행 장소',
      SHIPPER_NM VARCHAR(200) COMMENT '송하인명',
      SHIPPER_ADDR TEXT COMMENT '송하인 주소',
      CONSIGNEE_NM VARCHAR(200) COMMENT '수하인명',
      CONSIGNEE_ADDR TEXT COMMENT '수하인 주소',
      NOTIFY_PARTY TEXT COMMENT 'Notify Party',
      PIECES INT COMMENT '화물 개수',
      GROSS_WEIGHT_KG DECIMAL(12,3) COMMENT '총 중량',
      CHARGE_WEIGHT_KG DECIMAL(12,3) COMMENT '청구 중량',
      VOLUME_CBM DECIMAL(12,4) COMMENT '부피',
      COMMODITY_DESC TEXT COMMENT '품명',
      HS_CODE VARCHAR(20) COMMENT 'HS 코드',
      DIMENSIONS VARCHAR(200) COMMENT '치수',
      SPECIAL_HANDLING VARCHAR(100) COMMENT '특수 처리 코드',
      DECLARED_VALUE DECIMAL(15,2) COMMENT '신고 가액',
      DECLARED_CURRENCY VARCHAR(10) DEFAULT 'USD' COMMENT '신고 통화',
      INSURANCE_VALUE DECIMAL(15,2) COMMENT '보험 가액',
      FREIGHT_CHARGES DECIMAL(15,2) COMMENT '운임',
      OTHER_CHARGES DECIMAL(15,2) COMMENT '기타 비용',
      PAYMENT_TERMS VARCHAR(20) DEFAULT 'PREPAID' COMMENT '결제 조건',
      STATUS_CD VARCHAR(20) DEFAULT 'DRAFT' COMMENT '상태',
      REMARKS TEXT COMMENT '비고',
      DEL_YN CHAR(1) DEFAULT 'N' COMMENT '삭제 여부',
      CREATED_BY VARCHAR(50) COMMENT '생성자',
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
      UPDATED_BY VARCHAR(50) COMMENT '수정자',
      UPDATED_DTM DATETIME COMMENT '수정일시',
      INDEX idx_mawb_no (MAWB_NO),
      INDEX idx_status (STATUS_CD),
      INDEX idx_etd (ETD_DT)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master AWB'
  `;

  const createHouseAWBTable = `
    CREATE TABLE IF NOT EXISTS AWB_HOUSE_AWB (
      HAWB_ID INT AUTO_INCREMENT PRIMARY KEY,
      HAWB_NO VARCHAR(50) NOT NULL UNIQUE COMMENT 'House AWB 번호',
      SHIPMENT_ID INT NOT NULL COMMENT '선적 ID',
      MAWB_ID INT COMMENT 'Master AWB ID',
      CUSTOMER_ID INT NOT NULL COMMENT '고객 ID',
      CARRIER_ID INT COMMENT '운송사 ID',
      AIRLINE_CODE VARCHAR(10) COMMENT '항공사 코드',
      FLIGHT_NO VARCHAR(20) COMMENT '편명',
      ORIGIN_AIRPORT_CD VARCHAR(10) NOT NULL COMMENT '출발 공항 코드',
      DEST_AIRPORT_CD VARCHAR(10) NOT NULL COMMENT '도착 공항 코드',
      ETD_DT DATE COMMENT '출발 예정일',
      ETD_TIME VARCHAR(10) COMMENT '출발 예정 시간',
      ATD_DT DATE COMMENT '실제 출발일',
      ETA_DT DATE COMMENT '도착 예정일',
      ETA_TIME VARCHAR(10) COMMENT '도착 예정 시간',
      ATA_DT DATE COMMENT '실제 도착일',
      ISSUE_DT DATE COMMENT '발행일',
      ISSUE_PLACE VARCHAR(100) COMMENT '발행 장소',
      SHIPPER_NM VARCHAR(200) COMMENT '송하인명',
      SHIPPER_ADDR TEXT COMMENT '송하인 주소',
      CONSIGNEE_NM VARCHAR(200) COMMENT '수하인명',
      CONSIGNEE_ADDR TEXT COMMENT '수하인 주소',
      NOTIFY_PARTY TEXT COMMENT 'Notify Party',
      PIECES INT COMMENT '화물 개수',
      GROSS_WEIGHT_KG DECIMAL(12,3) COMMENT '총 중량',
      CHARGE_WEIGHT_KG DECIMAL(12,3) COMMENT '청구 중량',
      VOLUME_CBM DECIMAL(12,4) COMMENT '부피',
      COMMODITY_DESC TEXT COMMENT '품명',
      HS_CODE VARCHAR(20) COMMENT 'HS 코드',
      DIMENSIONS VARCHAR(200) COMMENT '치수',
      SPECIAL_HANDLING VARCHAR(100) COMMENT '특수 처리 코드',
      DECLARED_VALUE DECIMAL(15,2) COMMENT '신고 가액',
      DECLARED_CURRENCY VARCHAR(10) DEFAULT 'USD' COMMENT '신고 통화',
      INSURANCE_VALUE DECIMAL(15,2) COMMENT '보험 가액',
      FREIGHT_CHARGES DECIMAL(15,2) COMMENT '운임',
      OTHER_CHARGES DECIMAL(15,2) COMMENT '기타 비용',
      PAYMENT_TERMS VARCHAR(20) DEFAULT 'PREPAID' COMMENT '결제 조건',
      STATUS_CD VARCHAR(20) DEFAULT 'DRAFT' COMMENT '상태',
      REMARKS TEXT COMMENT '비고',
      DEL_YN CHAR(1) DEFAULT 'N' COMMENT '삭제 여부',
      CREATED_BY VARCHAR(50) COMMENT '생성자',
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
      UPDATED_BY VARCHAR(50) COMMENT '수정자',
      UPDATED_DTM DATETIME COMMENT '수정일시',
      INDEX idx_hawb_no (HAWB_NO),
      INDEX idx_mawb_id (MAWB_ID),
      INDEX idx_status (STATUS_CD),
      INDEX idx_etd (ETD_DT)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='House AWB'
  `;

  try {
    console.log('Creating AWB_MASTER_AWB table...');
    await connection.query(createMasterAWBTable);
    console.log('AWB_MASTER_AWB table created successfully');

    console.log('Creating AWB_HOUSE_AWB table...');
    await connection.query(createHouseAWBTable);
    console.log('AWB_HOUSE_AWB table created successfully');

    console.log('\nAll AWB tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

createTables();
