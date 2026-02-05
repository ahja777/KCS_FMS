import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// S/R 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const srId = searchParams.get('srId');

    if (srId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          s.SR_ID as id,
          s.SR_NO as srNo,
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
          DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM SHP_SHIPPING_REQUEST s
        LEFT JOIN MST_CUSTOMER c ON s.CUSTOMER_ID = c.CUSTOMER_ID
        WHERE s.SR_ID = ? AND s.DEL_YN = 'N'
      `, [srId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'SR not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        s.SR_ID as id,
        s.SR_NO as srNo,
        c.CUSTOMER_NM as customerName,
        s.TRANSPORT_MODE_CD as transportMode,
        s.SHIPPER_NM as shipperName,
        s.CONSIGNEE_NM as consigneeName,
        s.ORIGIN_PORT_CD as pol,
        s.DEST_PORT_CD as pod,
        DATE_FORMAT(s.CARGO_READY_DT, '%Y-%m-%d') as cargoReadyDate,
        s.PKG_QTY as packageQty,
        s.GROSS_WEIGHT_KG as grossWeight,
        s.STATUS_CD as status
      FROM SHP_SHIPPING_REQUEST s
      LEFT JOIN MST_CUSTOMER c ON s.CUSTOMER_ID = c.CUSTOMER_ID
      WHERE s.DEL_YN = 'N'
      ORDER BY s.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping requests' }, { status: 500 });
  }
}

// S/R 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 S/R 번호 생성 (정상 형식 데이터만 고려, 삭제된 데이터도 포함하여 중복 방지)
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

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SHP_SHIPPING_REQUEST (
        SR_NO, SHIPMENT_ID, BOOKING_ID, CUSTOMER_ID, TRANSPORT_MODE_CD, TRADE_TYPE_CD,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        ORIGIN_PORT_CD, DEST_PORT_CD, CARGO_READY_DT,
        COMMODITY_DESC, PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        STATUS_CD, REMARKS, CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      srNo,
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
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      srId: result.insertId,
      srNo: srNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create shipping request' }, { status: 500 });
  }
}

// S/R 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'SR ID is required' }, { status: 400 });
    }

    // customerId가 없으면 기존 값 유지 또는 기본값 사용
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

    await pool.query(`
      UPDATE SHP_SHIPPING_REQUEST SET
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
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE SR_ID = ?
    `, [
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
      body.id
    ]);

    return NextResponse.json({ success: true });
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
