import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 화물반출입 관리 API

// 테이블 생성 (존재하지 않을 경우)
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS CRG_CARGO_RELEASE (
      CARGO_RELEASE_ID INT AUTO_INCREMENT PRIMARY KEY,
      RECEIPT_NO VARCHAR(50) UNIQUE COMMENT '반입번호',
      RECEIPT_DT DATE COMMENT '반입일자',
      ARRIVAL_DT DATE COMMENT '입항일자',
      MRN VARCHAR(50) COMMENT 'MRN',
      MSN VARCHAR(50) COMMENT 'MSN',
      HSN VARCHAR(50) COMMENT 'HSN',
      RECEIPT_TYPE_CD VARCHAR(20) COMMENT '반입구분',
      MBL_NO VARCHAR(50) COMMENT 'Master B/L',
      HBL_NO VARCHAR(50) COMMENT 'House B/L',
      CARGO_MGT_NO VARCHAR(50) COMMENT '화물관리번호',
      CONTAINER_NO VARCHAR(20) COMMENT '컨테이너번호',
      CARGO_TYPE VARCHAR(20) COMMENT '화물구분',
      PACKAGE_QTY INT DEFAULT 0 COMMENT '포장개수',
      GROSS_WEIGHT DECIMAL(15,3) DEFAULT 0 COMMENT '총중량(KG)',
      CBM DECIMAL(15,3) DEFAULT 0 COMMENT '용적(CBM)',
      IN_QTY INT DEFAULT 0 COMMENT '입고수량',
      IN_WEIGHT DECIMAL(15,3) DEFAULT 0 COMMENT '입고중량',
      IN_VOLUME DECIMAL(15,3) DEFAULT 0 COMMENT '입고용적',
      OUT_QTY INT DEFAULT 0 COMMENT '출고수량',
      OUT_WEIGHT DECIMAL(15,3) DEFAULT 0 COMMENT '출고중량',
      OUT_VOLUME DECIMAL(15,3) DEFAULT 0 COMMENT '출고용적',
      STOCK_QTY INT DEFAULT 0 COMMENT '재고수량',
      STOCK_WEIGHT DECIMAL(15,3) DEFAULT 0 COMMENT '재고중량',
      STOCK_VOLUME DECIMAL(15,3) DEFAULT 0 COMMENT '재고용적',
      CARGO_STATUS VARCHAR(50) COMMENT '화물상태',
      PROCESS_STATUS VARCHAR(50) COMMENT '진행상태',
      SHIPPER_NM VARCHAR(200) COMMENT '송하인',
      CONSIGNEE_NM VARCHAR(200) COMMENT '수하인',
      NOTIFY_PARTY VARCHAR(200) COMMENT '통지처',
      CUSTOMS_OFFICE VARCHAR(50) COMMENT '세관',
      BONDED_AREA VARCHAR(100) COMMENT '보세구역',
      REMARKS TEXT COMMENT '비고',
      STATUS_CD VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '상태',
      CREATED_BY VARCHAR(50) COMMENT '생성자',
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
      UPDATED_BY VARCHAR(50) COMMENT '수정자',
      UPDATED_DTM DATETIME ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
      DEL_YN CHAR(1) DEFAULT 'N' COMMENT '삭제여부',
      INDEX idx_mbl (MBL_NO),
      INDEX idx_hbl (HBL_NO),
      INDEX idx_cargo_mgt (CARGO_MGT_NO),
      INDEX idx_receipt_dt (RECEIPT_DT)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='화물반출입관리'
  `);
}

// GET - 화물반출입 목록 조회
export async function GET(request: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const cargoReleaseId = searchParams.get('cargoReleaseId');
    const mblNo = searchParams.get('mblNo');
    const hblNo = searchParams.get('hblNo');
    const cargoMgtNo = searchParams.get('cargoMgtNo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 단건 조회
    if (cargoReleaseId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CARGO_RELEASE_ID as id,
          RECEIPT_NO as receiptNo,
          DATE_FORMAT(RECEIPT_DT, '%Y-%m-%d') as receiptDt,
          DATE_FORMAT(ARRIVAL_DT, '%Y-%m-%d') as arrivalDt,
          MRN as mrn,
          MSN as msn,
          HSN as hsn,
          RECEIPT_TYPE_CD as receiptTypeCd,
          MBL_NO as mblNo,
          HBL_NO as hblNo,
          CARGO_MGT_NO as cargoMgtNo,
          CONTAINER_NO as containerNo,
          CARGO_TYPE as cargoType,
          PACKAGE_QTY as packageQty,
          GROSS_WEIGHT as grossWeight,
          CBM as cbm,
          IN_QTY as inQty,
          IN_WEIGHT as inWeight,
          IN_VOLUME as inVolume,
          OUT_QTY as outQty,
          OUT_WEIGHT as outWeight,
          OUT_VOLUME as outVolume,
          STOCK_QTY as stockQty,
          STOCK_WEIGHT as stockWeight,
          STOCK_VOLUME as stockVolume,
          CARGO_STATUS as cargoStatus,
          PROCESS_STATUS as processStatus,
          SHIPPER_NM as shipperNm,
          CONSIGNEE_NM as consigneeNm,
          NOTIFY_PARTY as notifyParty,
          CUSTOMS_OFFICE as customsOffice,
          BONDED_AREA as bondedArea,
          REMARKS as remarks,
          STATUS_CD as statusCd,
          DATE_FORMAT(CREATED_DTM, '%Y-%m-%d %H:%i') as createdDtm
        FROM CRG_CARGO_RELEASE
        WHERE CARGO_RELEASE_ID = ? AND DEL_YN = 'N'
      `, [cargoReleaseId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    // 목록 조회
    let query = `
      SELECT
        CARGO_RELEASE_ID as id,
        RECEIPT_NO as receiptNo,
        DATE_FORMAT(RECEIPT_DT, '%Y-%m-%d') as receiptDt,
        DATE_FORMAT(ARRIVAL_DT, '%Y-%m-%d') as arrivalDt,
        MRN as mrn,
        MSN as msn,
        HSN as hsn,
        RECEIPT_TYPE_CD as receiptTypeCd,
        MBL_NO as mblNo,
        HBL_NO as hblNo,
        CARGO_MGT_NO as cargoMgtNo,
        CONTAINER_NO as containerNo,
        IN_QTY as inQty,
        IN_WEIGHT as inWeight,
        IN_VOLUME as inVolume,
        OUT_QTY as outQty,
        OUT_WEIGHT as outWeight,
        OUT_VOLUME as outVolume,
        STOCK_QTY as stockQty,
        STOCK_WEIGHT as stockWeight,
        STOCK_VOLUME as stockVolume,
        CARGO_STATUS as cargoStatus,
        PROCESS_STATUS as processStatus,
        DATE_FORMAT(CREATED_DTM, '%Y-%m-%d %H:%i') as createdDtm
      FROM CRG_CARGO_RELEASE
      WHERE DEL_YN = 'N'
    `;
    const params: (string | number)[] = [];

    if (mblNo) {
      query += ` AND MBL_NO LIKE ?`;
      params.push(`%${mblNo}%`);
    }
    if (hblNo) {
      query += ` AND HBL_NO LIKE ?`;
      params.push(`%${hblNo}%`);
    }
    if (cargoMgtNo) {
      query += ` AND CARGO_MGT_NO LIKE ?`;
      params.push(`%${cargoMgtNo}%`);
    }
    if (startDate) {
      query += ` AND RECEIPT_DT >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND RECEIPT_DT <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY CREATED_DTM DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Cargo release GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cargo release data' }, { status: 500 });
  }
}

// POST - 화물반출입 등록
export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const body = await request.json();

    // 반입번호 생성 (CR-YYYY-XXXX 형식)
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(RECEIPT_NO, LENGTH('CR-${year}-') + 1) AS UNSIGNED)), 0) as max_seq
       FROM CRG_CARGO_RELEASE
       WHERE RECEIPT_NO LIKE ?
         AND RECEIPT_NO REGEXP '^CR-[0-9]{4}-[0-9]{4}$'`,
      [`CR-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const receiptNo = `CR-${year}-${String(count).padStart(4, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO CRG_CARGO_RELEASE (
        RECEIPT_NO, RECEIPT_DT, ARRIVAL_DT, MRN, MSN, HSN,
        RECEIPT_TYPE_CD, MBL_NO, HBL_NO, CARGO_MGT_NO, CONTAINER_NO,
        CARGO_TYPE, PACKAGE_QTY, GROSS_WEIGHT, CBM,
        IN_QTY, IN_WEIGHT, IN_VOLUME,
        OUT_QTY, OUT_WEIGHT, OUT_VOLUME,
        STOCK_QTY, STOCK_WEIGHT, STOCK_VOLUME,
        CARGO_STATUS, PROCESS_STATUS,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        CUSTOMS_OFFICE, BONDED_AREA, REMARKS,
        STATUS_CD, CREATED_BY, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')
    `, [
      receiptNo,
      body.receiptDt || null,
      body.arrivalDt || null,
      body.mrn || null,
      body.msn || null,
      body.hsn || null,
      body.receiptTypeCd || 'IMPORT',
      body.mblNo || null,
      body.hblNo || null,
      body.cargoMgtNo || null,
      body.containerNo || null,
      body.cargoType || null,
      body.packageQty || 0,
      body.grossWeight || 0,
      body.cbm || 0,
      body.inQty || body.packageQty || 0,
      body.inWeight || body.grossWeight || 0,
      body.inVolume || body.cbm || 0,
      body.outQty || 0,
      body.outWeight || 0,
      body.outVolume || 0,
      body.stockQty || body.packageQty || 0,
      body.stockWeight || body.grossWeight || 0,
      body.stockVolume || body.cbm || 0,
      body.cargoStatus || null,
      body.processStatus || null,
      body.shipperNm || null,
      body.consigneeNm || null,
      body.notifyParty || null,
      body.customsOffice || null,
      body.bondedArea || null,
      body.remarks || null,
      body.statusCd || 'ACTIVE',
      body.createdBy || 'admin'
    ]);

    console.log(`[CREATE] 화물반출입: ID=${result.insertId}, No=${receiptNo}`);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      receiptNo: receiptNo
    });

  } catch (error) {
    console.error('Cargo release POST error:', error);
    return NextResponse.json({ error: 'Failed to create cargo release' }, { status: 500 });
  }
}

// PUT - 화물반출입 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE CRG_CARGO_RELEASE SET
        RECEIPT_DT = ?,
        ARRIVAL_DT = ?,
        MRN = ?,
        MSN = ?,
        HSN = ?,
        RECEIPT_TYPE_CD = ?,
        MBL_NO = ?,
        HBL_NO = ?,
        CARGO_MGT_NO = ?,
        CONTAINER_NO = ?,
        CARGO_TYPE = ?,
        PACKAGE_QTY = ?,
        GROSS_WEIGHT = ?,
        CBM = ?,
        IN_QTY = ?,
        IN_WEIGHT = ?,
        IN_VOLUME = ?,
        OUT_QTY = ?,
        OUT_WEIGHT = ?,
        OUT_VOLUME = ?,
        STOCK_QTY = ?,
        STOCK_WEIGHT = ?,
        STOCK_VOLUME = ?,
        CARGO_STATUS = ?,
        PROCESS_STATUS = ?,
        SHIPPER_NM = ?,
        CONSIGNEE_NM = ?,
        NOTIFY_PARTY = ?,
        CUSTOMS_OFFICE = ?,
        BONDED_AREA = ?,
        REMARKS = ?,
        STATUS_CD = ?,
        UPDATED_BY = ?
      WHERE CARGO_RELEASE_ID = ? AND DEL_YN = 'N'
    `, [
      body.receiptDt || null,
      body.arrivalDt || null,
      body.mrn || null,
      body.msn || null,
      body.hsn || null,
      body.receiptTypeCd || null,
      body.mblNo || null,
      body.hblNo || null,
      body.cargoMgtNo || null,
      body.containerNo || null,
      body.cargoType || null,
      body.packageQty || 0,
      body.grossWeight || 0,
      body.cbm || 0,
      body.inQty || 0,
      body.inWeight || 0,
      body.inVolume || 0,
      body.outQty || 0,
      body.outWeight || 0,
      body.outVolume || 0,
      body.stockQty || 0,
      body.stockWeight || 0,
      body.stockVolume || 0,
      body.cargoStatus || null,
      body.processStatus || null,
      body.shipperNm || null,
      body.consigneeNm || null,
      body.notifyParty || null,
      body.customsOffice || null,
      body.bondedArea || null,
      body.remarks || null,
      body.statusCd || 'ACTIVE',
      body.updatedBy || 'admin',
      body.id
    ]);

    console.log(`[UPDATE] 화물반출입: ID=${body.id}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cargo release PUT error:', error);
    return NextResponse.json({ error: 'Failed to update cargo release' }, { status: 500 });
  }
}

// DELETE - 화물반출입 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'IDs are required' }, { status: 400 });
    }

    const idList = ids.split(',').map(id => parseInt(id.trim()));

    await pool.query(`
      UPDATE CRG_CARGO_RELEASE
      SET DEL_YN = 'Y', UPDATED_DTM = NOW()
      WHERE CARGO_RELEASE_ID IN (?)
    `, [idList]);

    console.log(`[DELETE] 화물반출입: IDs=${ids}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cargo release DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete cargo release' }, { status: 500 });
  }
}
