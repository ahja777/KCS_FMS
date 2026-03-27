import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    // AWB_MASTER_AWB 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS AWB_MASTER_AWB (
        MAWB_ID INT AUTO_INCREMENT PRIMARY KEY,
        MAWB_NO VARCHAR(20) UNIQUE,
        IMPORT_TYPE VARCHAR(10) DEFAULT 'EXPORT',
        SHIPMENT_ID INT,
        BOOKING_ID INT,
        CARRIER_ID INT,
        AIRLINE_CODE VARCHAR(10),
        FLIGHT_NO VARCHAR(20),
        ORIGIN_AIRPORT_CD VARCHAR(10),
        DEST_AIRPORT_CD VARCHAR(10),
        ETD_DT DATE,
        ETD_TIME VARCHAR(10),
        ATD_DT DATE,
        ATD_TIME VARCHAR(10),
        ETA_DT DATE,
        ETA_TIME VARCHAR(10),
        ATA_DT DATE,
        ATA_TIME VARCHAR(10),
        ISSUE_DT DATE,
        ISSUE_PLACE VARCHAR(100),
        SHIPPER_NM VARCHAR(200),
        SHIPPER_ADDR TEXT,
        CONSIGNEE_NM VARCHAR(200),
        CONSIGNEE_ADDR TEXT,
        NOTIFY_PARTY VARCHAR(200),
        PIECES INT,
        GROSS_WEIGHT_KG DECIMAL(15,3),
        CHARGE_WEIGHT_KG DECIMAL(15,3),
        VOLUME_CBM DECIMAL(15,3),
        COMMODITY_DESC VARCHAR(500),
        HS_CODE VARCHAR(20),
        DIMENSIONS VARCHAR(100),
        SPECIAL_HANDLING VARCHAR(200),
        DECLARED_VALUE DECIMAL(15,2),
        DECLARED_CURRENCY VARCHAR(3) DEFAULT 'USD',
        INSURANCE_VALUE DECIMAL(15,2),
        FREIGHT_CHARGES DECIMAL(15,2),
        OTHER_CHARGES DECIMAL(15,2),
        PAYMENT_TERMS VARCHAR(20) DEFAULT 'PREPAID',
        CUSTOMS_STATUS VARCHAR(20),
        CUSTOMS_CLEARANCE_DT DATE,
        RELEASE_DT DATE,
        STATUS_CD VARCHAR(20) DEFAULT 'DRAFT',
        REMARKS TEXT,
        DEL_YN CHAR(1) DEFAULT 'N',
        CREATED_BY VARCHAR(50),
        CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
        UPDATED_BY VARCHAR(50),
        UPDATED_DTM DATETIME,
        INDEX idx_mawb_no (MAWB_NO),
        INDEX idx_origin_dest (ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD),
        INDEX idx_status (STATUS_CD),
        INDEX idx_etd (ETD_DT),
        INDEX idx_import_type (IMPORT_TYPE)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // AWB_HOUSE_AWB 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS AWB_HOUSE_AWB (
        HAWB_ID INT AUTO_INCREMENT PRIMARY KEY,
        HAWB_NO VARCHAR(30) UNIQUE,
        MAWB_ID INT,
        CUSTOMER_ID INT,
        SHIPPER_NM VARCHAR(200),
        SHIPPER_ADDR TEXT,
        CONSIGNEE_NM VARCHAR(200),
        CONSIGNEE_ADDR TEXT,
        NOTIFY_PARTY VARCHAR(200),
        PIECES INT,
        GROSS_WEIGHT_KG DECIMAL(15,3),
        CHARGE_WEIGHT_KG DECIMAL(15,3),
        VOLUME_CBM DECIMAL(15,3),
        COMMODITY_DESC VARCHAR(500),
        HS_CODE VARCHAR(20),
        DIMENSIONS VARCHAR(100),
        SPECIAL_HANDLING VARCHAR(200),
        DECLARED_VALUE DECIMAL(15,2),
        DECLARED_CURRENCY VARCHAR(3) DEFAULT 'USD',
        INSURANCE_VALUE DECIMAL(15,2),
        FREIGHT_CHARGES DECIMAL(15,2),
        OTHER_CHARGES DECIMAL(15,2),
        PAYMENT_TERMS VARCHAR(20) DEFAULT 'PREPAID',
        STATUS_CD VARCHAR(20) DEFAULT 'DRAFT',
        REMARKS TEXT,
        DEL_YN CHAR(1) DEFAULT 'N',
        CREATED_BY VARCHAR(50),
        CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
        UPDATED_BY VARCHAR(50),
        UPDATED_DTM DATETIME,
        FOREIGN KEY (MAWB_ID) REFERENCES AWB_MASTER_AWB(MAWB_ID),
        INDEX idx_hawb_no (HAWB_NO),
        INDEX idx_mawb_id (MAWB_ID),
        INDEX idx_status (STATUS_CD)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'AWB 테이블이 성공적으로 생성되었습니다.',
      tables: ['AWB_MASTER_AWB', 'AWB_HOUSE_AWB']
    });
  } catch (error) {
    console.error('AWB Setup Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 테이블 존재 여부 확인
    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('AWB_MASTER_AWB', 'AWB_HOUSE_AWB')
    `);

    return NextResponse.json({
      success: true,
      tables: tables
    });
  } catch (error) {
    console.error('AWB Setup Check Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// 기존 테이블에 누락된 컬럼 추가
export async function PUT() {
  try {
    const alterQueries = [
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS IMPORT_TYPE VARCHAR(10) DEFAULT 'EXPORT' AFTER MAWB_NO`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS ATD_TIME VARCHAR(10) AFTER ATD_DT`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS ATA_TIME VARCHAR(10) AFTER ATA_DT`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS CUSTOMS_STATUS VARCHAR(20) AFTER PAYMENT_TERMS`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS CUSTOMS_CLEARANCE_DT DATE AFTER CUSTOMS_STATUS`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS RELEASE_DT DATE AFTER CUSTOMS_CLEARANCE_DT`,
      `ALTER TABLE AWB_MASTER_AWB MODIFY COLUMN CARRIER_ID INT NULL`,
      `ALTER TABLE AWB_MASTER_AWB MODIFY COLUMN SHIPMENT_ID INT NULL`,
      `ALTER TABLE AWB_MASTER_AWB MODIFY COLUMN BOOKING_ID INT NULL`,
      // 발행 정보
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS ISSUE_DT DATE AFTER ATA_TIME`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS ISSUE_PLACE VARCHAR(100) AFTER ISSUE_DT`,
      // 수입신고 정보 (OTHER TAB)
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS MRN_NO VARCHAR(50) AFTER RELEASE_DT`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS MSN VARCHAR(20) AFTER MRN_NO`,
      // Agent 정보
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS AGENT_CODE VARCHAR(20) AFTER MSN`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS AGENT_NAME VARCHAR(100) AFTER AGENT_CODE`,
      // 운임 상세 (CARGO TAB)
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS WEIGHT_CHARGE DECIMAL(15,2) AFTER OTHER_CHARGES`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS VALUATION_CHARGE DECIMAL(15,2) AFTER WEIGHT_CHARGE`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS TAX_AMT DECIMAL(15,2) AFTER VALUATION_CHARGE`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS TOTAL_OTHER_AGENT DECIMAL(15,2) AFTER TAX_AMT`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS TOTAL_OTHER_CARRIER DECIMAL(15,2) AFTER TOTAL_OTHER_AGENT`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS RATE_CLASS VARCHAR(10) AFTER TOTAL_OTHER_CARRIER`,
      `ALTER TABLE AWB_MASTER_AWB ADD COLUMN IF NOT EXISTS RATE DECIMAL(15,4) AFTER RATE_CLASS`,
    ];

    const results = [];
    for (const query of alterQueries) {
      try {
        await pool.query(query);
        results.push({ query: query.substring(0, 60) + '...', success: true });
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        // 컬럼이 이미 존재하는 경우 무시
        if (error.code === 'ER_DUP_FIELDNAME') {
          results.push({ query: query.substring(0, 60) + '...', success: true, note: 'Column already exists' });
        } else {
          results.push({ query: query.substring(0, 60) + '...', success: false, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AWB 테이블 컬럼 업데이트가 완료되었습니다.',
      results
    });
  } catch (error) {
    console.error('AWB Alter Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
