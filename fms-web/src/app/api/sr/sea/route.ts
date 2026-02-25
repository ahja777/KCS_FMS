import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateJobNo, ensureJobNoColumn } from '@/lib/jobno';

// DB 스키마 보완: 누락 컬럼 추가 + 컨테이너 테이블 생성
async function ensureSchema() {
  // Phase 1-1: SHP_SHIPPING_REQUEST 누락 컬럼 추가
  const alterCols = [
    "ADD COLUMN IF NOT EXISTS BL_TYPE_CD VARCHAR(20) DEFAULT NULL COMMENT 'B/L TYPE'",
    "ADD COLUMN IF NOT EXISTS MBL_NO VARCHAR(50) DEFAULT NULL COMMENT 'Master B/L No'",
    "ADD COLUMN IF NOT EXISTS MSN_NO VARCHAR(50) DEFAULT NULL COMMENT 'MSN'",
    "ADD COLUMN IF NOT EXISTS MRN_NO VARCHAR(50) DEFAULT NULL COMMENT 'MRN No'",
    "ADD COLUMN IF NOT EXISTS FROM_CD VARCHAR(20) DEFAULT NULL COMMENT 'FROM'",
    "ADD COLUMN IF NOT EXISTS LINE_TO_CD VARCHAR(20) DEFAULT NULL COMMENT 'LINE(TO)'",
    "ADD COLUMN IF NOT EXISTS PLACE_OF_RECEIPT VARCHAR(50) DEFAULT NULL COMMENT 'Place of Receipt'",
    "ADD COLUMN IF NOT EXISTS PLACE_OF_DELIVERY VARCHAR(50) DEFAULT NULL COMMENT 'Place of Delivery'",
    "ADD COLUMN IF NOT EXISTS CONSOL_YN CHAR(1) DEFAULT 'N' COMMENT 'CONSOL 여부'",
    "ADD COLUMN IF NOT EXISTS CONTAINER_20_QTY INT DEFAULT 0 COMMENT '20ft 컨테이너 수'",
    "ADD COLUMN IF NOT EXISTS CONTAINER_40_QTY INT DEFAULT 0 COMMENT '40ft 컨테이너 수'",
    "ADD COLUMN IF NOT EXISTS INPUT_USER VARCHAR(50) DEFAULT NULL COMMENT '입력사원'",
    "ADD COLUMN IF NOT EXISTS BRANCH_CD VARCHAR(20) DEFAULT NULL COMMENT '본/지사'",
    "ADD COLUMN IF NOT EXISTS DESCRIPTION_TEXT TEXT DEFAULT NULL COMMENT 'Description'",
  ];
  for (const col of alterCols) {
    try {
      await pool.query(`ALTER TABLE SHP_SHIPPING_REQUEST ${col}`);
    } catch {
      // 컬럼이 이미 있으면 무시
    }
  }

  // Phase 1-2: SR 컨테이너 상세 테이블 신규 생성
  await pool.query(`
    CREATE TABLE IF NOT EXISTS SHP_SR_CONTAINER (
      SR_CNTR_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
      SR_ID BIGINT NOT NULL,
      HBL_NO VARCHAR(50) DEFAULT NULL,
      CNTR_NO VARCHAR(15) DEFAULT NULL,
      SEAL_NO1 VARCHAR(30) DEFAULT NULL,
      SEAL_NO2 VARCHAR(30) DEFAULT NULL,
      SEAL_NO3 VARCHAR(30) DEFAULT NULL,
      PKG_QTY INT DEFAULT 0,
      PKG_UNIT VARCHAR(10) DEFAULT NULL,
      GROSS_WEIGHT_KG DECIMAL(12,3) DEFAULT 0,
      VOLUME_CBM DECIMAL(12,4) DEFAULT 0,
      SORT_SEQ INT DEFAULT 0,
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
      DEL_YN CHAR(1) DEFAULT 'N',
      FOREIGN KEY (SR_ID) REFERENCES SHP_SHIPPING_REQUEST(SR_ID)
    )
  `);
}

let schemaReady = false;

// S/R 목록 조회 / 상세 조회
export async function GET(request: NextRequest) {
  try {
    if (!schemaReady) { await ensureSchema(); schemaReady = true; }

    const { searchParams } = new URL(request.url);
    const srId = searchParams.get('srId');

    // 상세 조회
    if (srId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          s.SR_ID as id,
          s.SR_NO as srNo,
          s.JOB_NO as jobNo,
          s.SHIPMENT_ID as shipmentId,
          s.BOOKING_ID as bookingId,
          s.CUSTOMER_ID as customerId,
          c.CUSTOMER_NM as customerName,
          s.TRANSPORT_MODE_CD as transportMode,
          s.TRADE_TYPE_CD as tradeType,
          s.SHIPPER_NM as shipperName,
          s.SHIPPER_ADDR as shipperAddress,
          s.CONSIGNEE_NM as consigneeName,
          s.CONSIGNEE_ADDR as consigneeAddress,
          s.NOTIFY_PARTY as notifyParty,
          s.ORIGIN_PORT_CD as pol,
          s.DEST_PORT_CD as pod,
          DATE_FORMAT(s.CARGO_READY_DT, '%Y-%m-%d') as cargoReadyDate,
          s.COMMODITY_DESC as commodityDesc,
          s.PKG_QTY as packageQty,
          s.PKG_TYPE_CD as packageType,
          s.GROSS_WEIGHT_KG as grossWeight,
          s.VOLUME_CBM as volume,
          s.STATUS_CD as status,
          s.REMARKS as remark,
          s.CARRIER_CD as carrier,
          s.VESSEL_NM as vessel,
          s.VOYAGE_NO as voyage,
          s.FINAL_DEST as finalDest,
          DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta,
          s.FREIGHT_TERMS as freightTerms,
          s.HBL_ID as hblId,
          s.MARKS_NOS as marksNos,
          s.BL_TYPE_CD as blType,
          s.MBL_NO as mblNo,
          s.MSN_NO as msn,
          s.MRN_NO as mrnNo,
          s.FROM_CD as fromCd,
          s.LINE_TO_CD as lineTo,
          s.PLACE_OF_RECEIPT as placeOfReceipt,
          s.PLACE_OF_DELIVERY as placeOfDelivery,
          s.CONSOL_YN as consolYn,
          s.CONTAINER_20_QTY as container20Qty,
          s.CONTAINER_40_QTY as container40Qty,
          s.INPUT_USER as inputUser,
          s.BRANCH_CD as branchCd,
          s.DESCRIPTION_TEXT as descriptionText,
          DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM SHP_SHIPPING_REQUEST s
        LEFT JOIN MST_CUSTOMER c ON s.CUSTOMER_ID = c.CUSTOMER_ID
        WHERE s.SR_ID = ? AND s.DEL_YN = 'N'
      `, [srId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'SR not found' }, { status: 404 });
      }

      // 컨테이너 목록 조회
      const [containers] = await pool.query<RowDataPacket[]>(`
        SELECT
          SR_CNTR_ID as id,
          HBL_NO as hblNo,
          CNTR_NO as containerNo,
          SEAL_NO1 as sealNo1,
          SEAL_NO2 as sealNo2,
          SEAL_NO3 as sealNo3,
          PKG_QTY as packageQty,
          PKG_UNIT as packageUnit,
          GROSS_WEIGHT_KG as grossWeight,
          VOLUME_CBM as volume,
          SORT_SEQ as sortSeq
        FROM SHP_SR_CONTAINER
        WHERE SR_ID = ? AND DEL_YN = 'N'
        ORDER BY SORT_SEQ ASC
      `, [srId]);

      return NextResponse.json({ ...rows[0], containers });
    }

    // 목록 조회 (검색조건 지원)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const srNoFilter = searchParams.get('srNo');
    const blTypeFilter = searchParams.get('blType');
    const locationFilter = searchParams.get('location');
    const carrierFilter = searchParams.get('carrier');
    const inputUserFilter = searchParams.get('inputUser');
    const branchFilter = searchParams.get('branch');

    let whereClause = "s.DEL_YN = 'N'";
    const params: any[] = [];

    if (startDate) { whereClause += " AND DATE(s.CREATED_DTM) >= ?"; params.push(startDate); }
    if (endDate) { whereClause += " AND DATE(s.CREATED_DTM) <= ?"; params.push(endDate); }
    if (srNoFilter) { whereClause += " AND s.SR_NO LIKE ?"; params.push(`%${srNoFilter}%`); }
    if (blTypeFilter) { whereClause += " AND s.BL_TYPE_CD = ?"; params.push(blTypeFilter); }
    if (locationFilter) { whereClause += " AND (s.ORIGIN_PORT_CD LIKE ? OR s.DEST_PORT_CD LIKE ?)"; params.push(`%${locationFilter}%`, `%${locationFilter}%`); }
    if (carrierFilter) { whereClause += " AND s.CARRIER_CD LIKE ?"; params.push(`%${carrierFilter}%`); }
    if (inputUserFilter) { whereClause += " AND s.INPUT_USER LIKE ?"; params.push(`%${inputUserFilter}%`); }
    if (branchFilter) { whereClause += " AND s.BRANCH_CD = ?"; params.push(branchFilter); }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        s.SR_ID as id,
        s.SR_NO as srNo,
        s.JOB_NO as jobNo,
        s.BL_TYPE_CD as blType,
        s.MBL_NO as mblNo,
        c.CUSTOMER_NM as customerName,
        s.SHIPPER_NM as shipperName,
        s.CONSIGNEE_NM as consigneeName,
        s.CARRIER_CD as carrier,
        s.LINE_TO_CD as lineTo,
        s.INPUT_USER as inputUser,
        s.ORIGIN_PORT_CD as pol,
        s.DEST_PORT_CD as pod,
        DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta,
        DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as etd,
        s.PKG_QTY as packageQty,
        s.GROSS_WEIGHT_KG as grossWeight,
        s.STATUS_CD as status,
        DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d') as createdAt
      FROM SHP_SHIPPING_REQUEST s
      LEFT JOIN MST_CUSTOMER c ON s.CUSTOMER_ID = c.CUSTOMER_ID
      WHERE ${whereClause}
      ORDER BY s.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping requests' }, { status: 500 });
  }
}

// S/R 등록
export async function POST(request: NextRequest) {
  try {
    if (!schemaReady) { await ensureSchema(); schemaReady = true; }

    const body = await request.json();

    // 새 S/R 번호 생성
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(SR_NO, LENGTH('SR-${year}-') + 1) AS UNSIGNED)), 0) as max_seq
       FROM SHP_SHIPPING_REQUEST
       WHERE SR_NO LIKE ?
         AND SR_NO REGEXP '^SR-[0-9]{4}-[0-9]{4}$'`,
      [`SR-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const srNo = `SR-${year}-${String(count).padStart(4, '0')}`;

    // customerId 결정
    let customerId = body.customerId;
    if (!customerId) {
      const [customers] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1`);
      customerId = customers.length > 0 ? customers[0].CUSTOMER_ID : 1;
    }

    // shipmentId가 없으면 임시 생성
    let shipmentId = body.shipmentId;
    if (!shipmentId) {
      const [shipResult] = await pool.query<ResultSetHeader>(`
        INSERT INTO ORD_SHIPMENT (SHIPMENT_NO, TRANSPORT_MODE_CD, TRADE_TYPE_CD, CUSTOMER_ID, STATUS_CD, CREATED_BY, CREATED_DTM, DEL_YN)
        VALUES (?, ?, ?, ?, 'PENDING', 'admin', NOW(), 'N')
      `, [`SHP${Date.now()}`, body.transportMode || 'SEA', body.tradeType || 'EXPORT', customerId]);
      shipmentId = shipResult.insertId;
    }

    // JOB_NO 자동생성
    await ensureJobNoColumn('SHP_SHIPPING_REQUEST');
    const jobNo = await generateJobNo('SHP_SHIPPING_REQUEST', 'SRE');

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SHP_SHIPPING_REQUEST (
        SR_NO, JOB_NO, SHIPMENT_ID, BOOKING_ID, CUSTOMER_ID, TRANSPORT_MODE_CD, TRADE_TYPE_CD,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        ORIGIN_PORT_CD, DEST_PORT_CD, CARGO_READY_DT,
        COMMODITY_DESC, PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        STATUS_CD, REMARKS,
        CARRIER_CD, VESSEL_NM, VOYAGE_NO, FINAL_DEST, ETD_DT, ETA_DT, FREIGHT_TERMS, HBL_ID,
        MARKS_NOS, BL_TYPE_CD, MBL_NO, MSN_NO, MRN_NO, FROM_CD, LINE_TO_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, CONSOL_YN,
        CONTAINER_20_QTY, CONTAINER_40_QTY, INPUT_USER, BRANCH_CD, DESCRIPTION_TEXT,
        CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      srNo,
      jobNo,
      shipmentId,
      body.bookingId || null,
      customerId,
      body.transportMode || 'SEA',
      body.tradeType || 'EXPORT',
      body.shipperName || '',
      body.shipperAddress || '',
      body.consigneeName || '',
      body.consigneeAddress || '',
      body.notifyParty || '',
      body.pol || '',
      body.pod || '',
      body.cargoReadyDate || null,
      body.commodityDesc || '',
      body.packageQty || 0,
      body.packageType || '',
      body.grossWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || '',
      body.carrier || null,
      body.vessel || null,
      body.voyage || null,
      body.finalDest || null,
      body.etd || null,
      body.eta || null,
      body.freightTerms || null,
      body.hblId || null,
      body.marksNos || null,
      body.blType || null,
      body.mblNo || null,
      body.msn || null,
      body.mrnNo || null,
      body.fromCd || null,
      body.lineTo || null,
      body.placeOfReceipt || null,
      body.placeOfDelivery || null,
      body.consolYn || 'N',
      body.container20Qty || 0,
      body.container40Qty || 0,
      body.inputUser || null,
      body.branchCd || null,
      body.descriptionText || null,
    ]);

    const srId = result.insertId;

    // 컨테이너 sub-table INSERT
    if (body.containers && Array.isArray(body.containers) && body.containers.length > 0) {
      for (let i = 0; i < body.containers.length; i++) {
        const c = body.containers[i];
        await pool.query<ResultSetHeader>(`
          INSERT INTO SHP_SR_CONTAINER (SR_ID, HBL_NO, CNTR_NO, SEAL_NO1, SEAL_NO2, SEAL_NO3, PKG_QTY, PKG_UNIT, GROSS_WEIGHT_KG, VOLUME_CBM, SORT_SEQ, CREATED_BY, DEL_YN)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 'N')
        `, [srId, c.hblNo || null, c.containerNo || null, c.sealNo1 || null, c.sealNo2 || null, c.sealNo3 || null, c.packageQty || 0, c.packageUnit || null, c.grossWeight || 0, c.volume || 0, i + 1]);
      }
    }

    // B/L 연계
    if (body.hblId) {
      await pool.query(
        `UPDATE ORD_OCEAN_BL SET SR_NO = ?, UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE BL_ID = ?`,
        [srNo, body.hblId]
      );
    }

    return NextResponse.json({ success: true, srId, srNo, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create shipping request' }, { status: 500 });
  }
}

// S/R 수정
export async function PUT(request: NextRequest) {
  try {
    if (!schemaReady) { await ensureSchema(); schemaReady = true; }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'SR ID is required' }, { status: 400 });
    }

    // customerId 유지
    let customerId = body.customerId;
    if (!customerId) {
      const [existing] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM SHP_SHIPPING_REQUEST WHERE SR_ID = ?`, [body.id]);
      if (existing.length > 0 && existing[0].CUSTOMER_ID) {
        customerId = existing[0].CUSTOMER_ID;
      } else {
        const [customers] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1`);
        customerId = customers.length > 0 ? customers[0].CUSTOMER_ID : 1;
      }
    }

    // JOB_NO 유지
    await ensureJobNoColumn('SHP_SHIPPING_REQUEST');
    const [existingSr] = await pool.query<RowDataPacket[]>(
      `SELECT JOB_NO FROM SHP_SHIPPING_REQUEST WHERE SR_ID = ?`, [body.id]
    );
    let jobNo = existingSr[0]?.JOB_NO || null;
    if (!jobNo) {
      jobNo = await generateJobNo('SHP_SHIPPING_REQUEST', 'SRE');
    }

    await pool.query(`
      UPDATE SHP_SHIPPING_REQUEST SET
        JOB_NO = ?,
        BOOKING_ID = ?,
        CUSTOMER_ID = ?,
        SHIPPER_NM = ?,
        SHIPPER_ADDR = ?,
        CONSIGNEE_NM = ?,
        CONSIGNEE_ADDR = ?,
        NOTIFY_PARTY = ?,
        ORIGIN_PORT_CD = ?,
        DEST_PORT_CD = ?,
        CARGO_READY_DT = ?,
        COMMODITY_DESC = ?,
        PKG_QTY = ?,
        PKG_TYPE_CD = ?,
        GROSS_WEIGHT_KG = ?,
        VOLUME_CBM = ?,
        STATUS_CD = ?,
        REMARKS = ?,
        CARRIER_CD = ?,
        VESSEL_NM = ?,
        VOYAGE_NO = ?,
        FINAL_DEST = ?,
        ETD_DT = ?,
        ETA_DT = ?,
        FREIGHT_TERMS = ?,
        HBL_ID = ?,
        MARKS_NOS = ?,
        BL_TYPE_CD = ?,
        MBL_NO = ?,
        MSN_NO = ?,
        MRN_NO = ?,
        FROM_CD = ?,
        LINE_TO_CD = ?,
        PLACE_OF_RECEIPT = ?,
        PLACE_OF_DELIVERY = ?,
        CONSOL_YN = ?,
        CONTAINER_20_QTY = ?,
        CONTAINER_40_QTY = ?,
        INPUT_USER = ?,
        BRANCH_CD = ?,
        DESCRIPTION_TEXT = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE SR_ID = ?
    `, [
      jobNo,
      body.bookingId || null,
      customerId,
      body.shipperName || '',
      body.shipperAddress || '',
      body.consigneeName || '',
      body.consigneeAddress || '',
      body.notifyParty || '',
      body.pol || '',
      body.pod || '',
      body.cargoReadyDate || null,
      body.commodityDesc || '',
      body.packageQty || 0,
      body.packageType || '',
      body.grossWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || '',
      body.carrier || null,
      body.vessel || null,
      body.voyage || null,
      body.finalDest || null,
      body.etd || null,
      body.eta || null,
      body.freightTerms || null,
      body.hblId || null,
      body.marksNos || null,
      body.blType || null,
      body.mblNo || null,
      body.msn || null,
      body.mrnNo || null,
      body.fromCd || null,
      body.lineTo || null,
      body.placeOfReceipt || null,
      body.placeOfDelivery || null,
      body.consolYn || 'N',
      body.container20Qty || 0,
      body.container40Qty || 0,
      body.inputUser || null,
      body.branchCd || null,
      body.descriptionText || null,
      body.id
    ]);

    // 컨테이너: soft-delete 기존 → 새로 INSERT
    if (body.containers && Array.isArray(body.containers)) {
      await pool.query(
        `UPDATE SHP_SR_CONTAINER SET DEL_YN = 'Y' WHERE SR_ID = ?`,
        [body.id]
      );
      for (let i = 0; i < body.containers.length; i++) {
        const c = body.containers[i];
        await pool.query<ResultSetHeader>(`
          INSERT INTO SHP_SR_CONTAINER (SR_ID, HBL_NO, CNTR_NO, SEAL_NO1, SEAL_NO2, SEAL_NO3, PKG_QTY, PKG_UNIT, GROSS_WEIGHT_KG, VOLUME_CBM, SORT_SEQ, CREATED_BY, DEL_YN)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 'N')
        `, [body.id, c.hblNo || null, c.containerNo || null, c.sealNo1 || null, c.sealNo2 || null, c.sealNo3 || null, c.packageQty || 0, c.packageUnit || null, c.grossWeight || 0, c.volume || 0, i + 1]);
      }
    }

    return NextResponse.json({ success: true, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update shipping request' }, { status: 500 });
  }
}

// S/R 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'SR IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    // 컨테이너도 soft-delete
    await pool.query(
      `UPDATE SHP_SR_CONTAINER SET DEL_YN = 'Y' WHERE SR_ID IN (${placeholders})`,
      idArray
    );

    await pool.query(
      `UPDATE SHP_SHIPPING_REQUEST SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE SR_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete shipping requests' }, { status: 500 });
  }
}
