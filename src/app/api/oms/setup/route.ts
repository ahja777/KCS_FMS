import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  const connection = await pool.getConnection();

  try {
    // 1. 오더 타입 마스터 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS oms_order_type (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_type_code VARCHAR(20) NOT NULL UNIQUE COMMENT '오더타입코드',
        order_type_name VARCHAR(100) NOT NULL COMMENT '오더타입명',
        biz_type ENUM('DOMESTIC', 'WAREHOUSE', 'IMPORT', 'EXPORT') NOT NULL COMMENT '비즈니스타입',
        description TEXT COMMENT '설명',
        related_system VARCHAR(100) COMMENT '연계시스템(FIS,TMS,WMS)',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성여부',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='오더타입마스터'
    `);

    // 2. 고객 오더 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS oms_customer_order (
        id INT AUTO_INCREMENT PRIMARY KEY,
        co_number VARCHAR(30) NOT NULL UNIQUE COMMENT 'C/O번호',
        order_type_code VARCHAR(20) NOT NULL COMMENT '오더타입코드',
        biz_type ENUM('DOMESTIC', 'FORWARDING') DEFAULT 'FORWARDING' COMMENT '업무구분',
        customer_code VARCHAR(20) COMMENT '고객코드',
        customer_name VARCHAR(100) COMMENT '고객명',
        shipper_name VARCHAR(100) COMMENT '송하인',
        consignee_name VARCHAR(100) COMMENT '수하인',
        pol VARCHAR(10) COMMENT '출발항(POL)',
        pod VARCHAR(10) COMMENT '도착항(POD)',
        etd DATE COMMENT '출항예정일',
        eta DATE COMMENT '도착예정일',
        cargo_type VARCHAR(20) COMMENT '화물종류',
        commodity VARCHAR(200) COMMENT '품목',
        quantity INT DEFAULT 0 COMMENT '수량',
        weight DECIMAL(12,3) DEFAULT 0 COMMENT '중량(KG)',
        volume DECIMAL(12,3) DEFAULT 0 COMMENT '용적(CBM)',
        incoterms VARCHAR(10) COMMENT '인코텀즈',
        status ENUM('DRAFT', 'REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT' COMMENT '상태',
        remarks TEXT COMMENT '비고',
        created_by VARCHAR(50) COMMENT '생성자',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_co_number (co_number),
        INDEX idx_customer_code (customer_code),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='고객오더'
    `);

    // 3. 서비스 오더 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS oms_service_order (
        id INT AUTO_INCREMENT PRIMARY KEY,
        so_number VARCHAR(30) NOT NULL UNIQUE COMMENT 'S/O번호',
        co_number VARCHAR(30) COMMENT '연결C/O번호',
        order_type_code VARCHAR(20) NOT NULL COMMENT '오더타입코드',
        biz_type ENUM('DOMESTIC', 'FORWARDING') DEFAULT 'FORWARDING' COMMENT '업무구분',
        customer_code VARCHAR(20) COMMENT '고객코드',
        customer_name VARCHAR(100) COMMENT '고객명',
        shipper_name VARCHAR(100) COMMENT '송하인',
        consignee_name VARCHAR(100) COMMENT '수하인',
        pol VARCHAR(10) COMMENT '출발항(POL)',
        pod VARCHAR(10) COMMENT '도착항(POD)',
        etd DATE COMMENT '출항예정일',
        eta DATE COMMENT '도착예정일',
        cargo_type VARCHAR(20) COMMENT '화물종류',
        commodity VARCHAR(200) COMMENT '품목',
        quantity INT DEFAULT 0 COMMENT '수량',
        weight DECIMAL(12,3) DEFAULT 0 COMMENT '중량(KG)',
        volume DECIMAL(12,3) DEFAULT 0 COMMENT '용적(CBM)',
        incoterms VARCHAR(10) COMMENT '인코텀즈',
        execution_module ENUM('FW', 'TM', 'WM') COMMENT '실행모듈',
        control_type VARCHAR(50) COMMENT '컨트롤타입',
        auto_release BOOLEAN DEFAULT FALSE COMMENT '자동릴리즈여부',
        status ENUM('DRAFT', 'PENDING', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT' COMMENT '상태',
        remarks TEXT COMMENT '비고',
        created_by VARCHAR(50) COMMENT '생성자',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_so_number (so_number),
        INDEX idx_co_number (co_number),
        INDEX idx_customer_code (customer_code),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='서비스오더'
    `);

    // 4. S/O Control 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS oms_so_control (
        id INT AUTO_INCREMENT PRIMARY KEY,
        control_code VARCHAR(30) NOT NULL UNIQUE COMMENT '컨트롤코드',
        control_name VARCHAR(100) NOT NULL COMMENT '컨트롤명',
        customer_code VARCHAR(20) COMMENT '고객코드',
        order_type_code VARCHAR(20) COMMENT '오더타입코드',
        biz_type ENUM('DOMESTIC', 'WAREHOUSE', 'IMPORT', 'EXPORT') COMMENT '비즈니스타입',
        check_validation BOOLEAN DEFAULT TRUE COMMENT '유효성검사',
        auto_release BOOLEAN DEFAULT FALSE COMMENT '자동릴리즈',
        auto_value_assignment BOOLEAN DEFAULT FALSE COMMENT '자동값할당',
        method_type ENUM('SIMULTANEOUS', 'SEQUENTIAL', 'INTERNAL') DEFAULT 'SEQUENTIAL' COMMENT '처리방법',
        execution_module VARCHAR(20) COMMENT '실행모듈',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성여부',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='서비스오더컨트롤'
    `);

    // 기본 오더 타입 데이터 삽입
    await connection.query(`
      INSERT IGNORE INTO oms_order_type (order_type_code, order_type_name, biz_type, description, related_system) VALUES
      ('EXP-FCL', 'Export FCL', 'EXPORT', '수출 FCL 오더', 'FIS,TMS'),
      ('EXP-LCL', 'Export LCL', 'EXPORT', '수출 LCL 오더', 'FIS,TMS'),
      ('IMP-FCL', 'Import FCL', 'IMPORT', '수입 FCL 오더', 'FIS,TMS'),
      ('IMP-LCL', 'Import LCL', 'IMPORT', '수입 LCL 오더', 'FIS,TMS'),
      ('DOM-TR', 'Domestic Transport', 'DOMESTIC', '내수 운송', 'TMS'),
      ('DOM-WH', 'Domestic Warehouse', 'WAREHOUSE', '내수 창고', 'WMS'),
      ('AIR-EXP', 'Air Export', 'EXPORT', '항공 수출', 'FIS'),
      ('AIR-IMP', 'Air Import', 'IMPORT', '항공 수입', 'FIS')
    `);

    return NextResponse.json({
      success: true,
      message: 'OMS 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('OMS Setup Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
