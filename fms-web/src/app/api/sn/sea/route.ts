import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// S/N 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const snId = searchParams.get('snId');

    if (snId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          s.SN_ID as id,
          s.SN_NO as snNo,
          s.SHIPMENT_ID as shipmentId,
          s.MBL_ID as mblId,
          s.HBL_ID as hblId,
          s.SENDER_NM as senderName,
          s.RECIPIENT_NM as recipientName,
          s.RECIPIENT_EMAIL as recipientEmail,
          s.TRANSPORT_MODE_CD as transportMode,
          s.CARRIER_NM as carrierName,
          s.VESSEL_FLIGHT as vesselFlight,
          s.VOYAGE_NO as voyageNo,
          s.ORIGIN_PORT_CD as pol,
          s.DEST_PORT_CD as pod,
          DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta,
          s.COMMODITY_DESC as commodityDesc,
          s.PKG_QTY as packageQty,
          s.GROSS_WEIGHT_KG as grossWeight,
          s.VOLUME_CBM as volume,
          s.SEND_STATUS_CD as status,
          s.REMARKS as remark,
          DATE_FORMAT(s.SEND_DTM, '%Y-%m-%d %H:%i:%s') as sentAt,
          DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM SHP_SHIPPING_NOTICE s
        WHERE s.SN_ID = ? AND s.DEL_YN = 'N'
      `, [snId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'SN not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        s.SN_ID as id,
        s.SN_NO as snNo,
        s.SENDER_NM as senderName,
        s.RECIPIENT_NM as recipientName,
        s.CARRIER_NM as carrierName,
        s.VESSEL_FLIGHT as vesselFlight,
        s.VOYAGE_NO as voyageNo,
        s.ORIGIN_PORT_CD as pol,
        s.DEST_PORT_CD as pod,
        DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as etd,
        DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta,
        s.PKG_QTY as packageQty,
        s.GROSS_WEIGHT_KG as grossWeight,
        s.SEND_STATUS_CD as status,
        DATE_FORMAT(s.SEND_DTM, '%Y-%m-%d') as sentAt
      FROM SHP_SHIPPING_NOTICE s
      WHERE s.DEL_YN = 'N'
      ORDER BY s.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping notices' }, { status: 500 });
  }
}

// S/N 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(SN_NO, LENGTH('SN-${year}-') + 1) AS UNSIGNED)), 0) as max_seq FROM SHP_SHIPPING_NOTICE WHERE SN_NO LIKE ?`,
      [`SN-${year}-%`]
    );
    const count = countResult[0].max_seq + 1;
    const snNo = `SN-${year}-${String(count).padStart(4, '0')}`;

    // shipmentId가 없으면 임시 생성
    let shipmentId = body.shipmentId;
    if (!shipmentId) {
      // customerId가 없으면 첫 번째 고객 사용
      const [customers] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1`);
      const customerId = customers.length > 0 ? customers[0].CUSTOMER_ID : 1;
      const [shipResult] = await pool.query<ResultSetHeader>(`
        INSERT INTO ORD_SHIPMENT (SHIPMENT_NO, TRANSPORT_MODE_CD, TRADE_TYPE_CD, CUSTOMER_ID, STATUS_CD, CREATED_BY, CREATED_DTM, DEL_YN)
        VALUES (?, 'SEA', 'EXPORT', ?, 'SHIPPED', 'admin', NOW(), 'N')
      `, [`SHP${Date.now()}`, customerId]);
      shipmentId = shipResult.insertId;
    }

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SHP_SHIPPING_NOTICE (
        SN_NO, SHIPMENT_ID, MBL_ID, HBL_ID, SENDER_NM, RECIPIENT_NM, RECIPIENT_EMAIL,
        TRANSPORT_MODE_CD, CARRIER_NM, VESSEL_FLIGHT, VOYAGE_NO, ORIGIN_PORT_CD, DEST_PORT_CD, ETD_DT, ETA_DT,
        COMMODITY_DESC, PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM,
        SEND_STATUS_CD, REMARKS, CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      snNo,
      shipmentId,
      body.mblId || null,
      body.hblId || null,
      body.senderName || '',
      body.recipientName || '',
      body.recipientEmail || '',
      body.transportMode || 'SEA',
      body.carrierName || '',
      body.vesselFlight || '',
      body.voyageNo || '',
      body.pol || '',
      body.pod || '',
      body.etd || null,
      body.eta || null,
      body.commodityDesc || '',
      body.packageQty || 0,
      body.grossWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      snId: result.insertId,
      snNo: snNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create shipping notice' }, { status: 500 });
  }
}

// S/N 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'SN ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE SHP_SHIPPING_NOTICE SET
        MBL_ID = ?,
        HBL_ID = ?,
        SENDER_NM = ?,
        RECIPIENT_NM = ?,
        RECIPIENT_EMAIL = ?,
        TRANSPORT_MODE_CD = ?,
        CARRIER_NM = ?,
        VESSEL_FLIGHT = ?,
        VOYAGE_NO = ?,
        ORIGIN_PORT_CD = ?,
        DEST_PORT_CD = ?,
        ETD_DT = ?,
        ETA_DT = ?,
        COMMODITY_DESC = ?,
        PKG_QTY = ?,
        GROSS_WEIGHT_KG = ?,
        VOLUME_CBM = ?,
        SEND_STATUS_CD = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE SN_ID = ?
    `, [
      body.mblId || null,
      body.hblId || null,
      body.senderName || '',
      body.recipientName || '',
      body.recipientEmail || '',
      body.transportMode || 'SEA',
      body.carrierName || '',
      body.vesselFlight || '',
      body.voyageNo || '',
      body.pol || '',
      body.pod || '',
      body.etd || null,
      body.eta || null,
      body.commodityDesc || '',
      body.packageQty || 0,
      body.grossWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update shipping notice' }, { status: 500 });
  }
}

// S/N 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'SN IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `UPDATE SHP_SHIPPING_NOTICE SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE SN_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete shipping notices' }, { status: 500 });
  }
}
