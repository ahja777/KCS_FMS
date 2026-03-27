import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    // Pre-Alert Mail Group 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_mail_group (
        group_id INT AUTO_INCREMENT PRIMARY KEY,
        group_code VARCHAR(20) NOT NULL,
        group_name VARCHAR(100),
        group_type VARCHAR(50) COMMENT 'Forwarder, Shipper, Partner 등',
        biz_type VARCHAR(50) COMMENT 'Forwarding, Transport, Warehouse',
        use_yn CHAR(1) DEFAULT 'Y',
        remark TEXT,
        created_by VARCHAR(50),
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50),
        updated_dt DATETIME,
        UNIQUE KEY uk_group_code (group_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Pre-Alert Mail Address 테이블 (그룹별 이메일 주소)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_mail_address (
        address_id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        address_name VARCHAR(100) COMMENT 'PIC Name',
        email VARCHAR(200) NOT NULL,
        use_yn CHAR(1) DEFAULT 'Y',
        created_by VARCHAR(50),
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES pre_alert_mail_group(group_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Pre-Alert Mail Group Address 테이블 (그룹별 상세 주소)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_mail_group_address (
        address_id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        addr_type VARCHAR(10) DEFAULT 'TO' COMMENT 'FROM, TO, CC, BCC',
        addr_name VARCHAR(100) COMMENT 'PIC Name',
        email VARCHAR(200) NOT NULL,
        use_yn CHAR(1) DEFAULT 'Y',
        created_by VARCHAR(50),
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES pre_alert_mail_group(group_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Pre-Alert Settings 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        setting_name VARCHAR(200) NOT NULL,
        service_group VARCHAR(10) COMMENT 'SEA, AIR',
        shipper_code VARCHAR(50),
        consignee_code VARCHAR(50),
        partner_code VARCHAR(50),
        pol_code VARCHAR(10),
        pod_code VARCHAR(10),
        attachment_types VARCHAR(200) COMMENT 'HBL,MBL,CI,PL,CIPL,CO,ETC',
        base_date_type VARCHAR(20) DEFAULT 'ETD' COMMENT 'ETD, ON_BOARD',
        auto_send_yn CHAR(1) DEFAULT 'N',
        auto_send_days INT DEFAULT 0 COMMENT 'Base Date 기준 몇일 전/후',
        auto_send_time VARCHAR(10) COMMENT 'HH:MM 형식',
        mail_template_id INT,
        mail_subject VARCHAR(500),
        mail_body TEXT,
        use_yn CHAR(1) DEFAULT 'Y',
        created_by VARCHAR(50),
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50),
        updated_dt DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Pre-Alert Settings Address 테이블 (설정별 수신자)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_settings_address (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_id INT NOT NULL,
        addr_type VARCHAR(10) NOT NULL COMMENT 'FROM, TO, CC, BCC',
        addr_name VARCHAR(100),
        email VARCHAR(200) NOT NULL,
        mail_group_id INT,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (setting_id) REFERENCES pre_alert_settings(setting_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Pre-Alert Mail Log 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pre_alert_mail_log (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        setting_id INT,
        doc_type VARCHAR(50) COMMENT 'PRE_ALERT_SEA, PRE_ALERT_AIR',
        doc_no VARCHAR(50) COMMENT 'Master B/L No.',
        mawb_id INT,
        hawb_id INT,
        mail_from VARCHAR(200),
        mail_to TEXT,
        mail_cc TEXT,
        mail_bcc TEXT,
        mail_subject VARCHAR(500),
        mail_body TEXT,
        attachments TEXT COMMENT 'JSON 형식 파일 목록',
        status VARCHAR(20) DEFAULT 'STANDBY' COMMENT 'SUCCESS, STANDBY, FAILED',
        response_msg TEXT,
        send_dt DATETIME,
        created_by VARCHAR(50),
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doc_no (doc_no),
        INDEX idx_status (status),
        INDEX idx_send_dt (send_dt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'Pre-Alert 테이블이 성공적으로 생성되었습니다.',
      tables: [
        'pre_alert_mail_group',
        'pre_alert_mail_address',
        'pre_alert_settings',
        'pre_alert_settings_address',
        'pre_alert_mail_log'
      ]
    });
  } catch (error) {
    console.error('Pre-Alert Setup Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME LIKE 'pre_alert%'
    `);

    return NextResponse.json({
      success: true,
      tables: tables
    });
  } catch (error) {
    console.error('Pre-Alert Setup Check Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
