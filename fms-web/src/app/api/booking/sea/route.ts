import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 해상 부킹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    // 단건 조회
    if (bookingId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          b.BOOKING_ID as id,
          b.BOOKING_NO as bookingNo,
          b.CARRIER_BOOKING_NO as carrierBookingNo,
          b.CARRIER_ID as carrierId,
          cr.CARRIER_NM as carrierName,
          b.VESSEL_NM as vesselName,
          b.VOYAGE_NO as voyageNo,
          b.POL_PORT_CD as pol,
          b.POD_PORT_CD as pod,
          DATE_FORMAT(b.ETD_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(b.ETA_DT, '%Y-%m-%d') as eta,
          b.CNTR_20GP_QTY as cntr20gpQty,
          b.CNTR_40GP_QTY as cntr40gpQty,
          b.CNTR_40HC_QTY as cntr40hcQty,
          b.TOTAL_CNTR_QTY as totalCntrQty,
          b.COMMODITY_DESC as commodityDesc,
          b.GROSS_WEIGHT_KG as grossWeight,
          b.VOLUME_CBM as volume,
          DATE_FORMAT(b.CLOSING_DT, '%Y-%m-%d') as closingDate,
          b.CLOSING_TIME as closingTime,
          b.STATUS_CD as status,
          b.REMARKS as remark,
          DATE_FORMAT(b.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM ORD_OCEAN_BOOKING b
        LEFT JOIN MST_CARRIER cr ON b.CARRIER_ID = cr.CARRIER_ID
        WHERE b.BOOKING_ID = ? AND b.DEL_YN = 'N'
      `, [bookingId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    // 목록 조회
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        b.BOOKING_ID as id,
        b.BOOKING_NO as bookingNo,
        b.CARRIER_BOOKING_NO as carrierBookingNo,
        cr.CARRIER_NM as carrierName,
        b.VESSEL_NM as vesselName,
        b.VOYAGE_NO as voyageNo,
        b.POL_PORT_CD as pol,
        b.POD_PORT_CD as pod,
        DATE_FORMAT(b.ETD_DT, '%Y-%m-%d') as etd,
        DATE_FORMAT(b.ETA_DT, '%Y-%m-%d') as eta,
        b.CNTR_20GP_QTY as cntr20gpQty,
        b.CNTR_40GP_QTY as cntr40gpQty,
        b.CNTR_40HC_QTY as cntr40hcQty,
        b.TOTAL_CNTR_QTY as totalCntrQty,
        b.COMMODITY_DESC as commodityDesc,
        b.GROSS_WEIGHT_KG as grossWeight,
        b.VOLUME_CBM as volume,
        b.STATUS_CD as status
      FROM ORD_OCEAN_BOOKING b
      LEFT JOIN MST_CARRIER cr ON b.CARRIER_ID = cr.CARRIER_ID
      WHERE b.DEL_YN = 'N'
      ORDER BY b.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch sea bookings' }, { status: 500 });
  }
}

// 해상 부킹 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 부킹 번호 생성 (정상 형식 데이터만 고려, 삭제된 데이터도 포함하여 중복 방지)
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(BOOKING_NO, LENGTH('SB-${year}-') + 1) AS UNSIGNED)), 0) as max_seq
       FROM ORD_OCEAN_BOOKING
       WHERE BOOKING_NO LIKE ?
         AND BOOKING_NO REGEXP '^SB-[0-9]{4}-[0-9]{4}$'`,
      [`SB-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const bookingNo = `SB-${year}-${String(count).padStart(4, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO ORD_OCEAN_BOOKING (
        BOOKING_NO, BOOKING_TYPE, SERVICE_TYPE, INCOTERMS, FREIGHT_TERMS, PAYMENT_TERMS,
        SHIPPER_CODE, SHIPPER_NM, SHIPPER_ADDR, SHIPPER_CONTACT, SHIPPER_TEL, SHIPPER_EMAIL,
        CONSIGNEE_CODE, CONSIGNEE_NM, CONSIGNEE_ADDR, CONSIGNEE_CONTACT, CONSIGNEE_TEL, CONSIGNEE_EMAIL,
        NOTIFY_CODE, NOTIFY_NM, NOTIFY_ADDR,
        CARRIER_BOOKING_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO,
        POL_PORT_CD, POL_TERMINAL, POD_PORT_CD, POD_TERMINAL, FINAL_DEST,
        ETD_DT, ETA_DT, CLOSING_DT, CLOSING_TIME,
        CNTR_20GP_QTY, CNTR_40GP_QTY, CNTR_40HC_QTY, TOTAL_CNTR_QTY,
        MBL_NO, HBL_NO, BL_TYPE,
        COMMODITY_DESC, GROSS_WEIGHT_KG, VOLUME_CBM,
        SPECIAL_REQUEST, DG_YN, DG_CLASS, UN_NUMBER, IMO_CLASS,
        STATUS_CD, REMARKS, CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      bookingNo,
      body.bookingType || 'EXPORT',
      body.serviceType || 'CY_TO_CY',
      body.incoterms || 'FOB',
      body.freightTerms || '',
      body.paymentTerms || 'PREPAID',
      body.shipperCode || null,
      body.shipperName || '',
      body.shipperAddress || '',
      body.shipperContact || '',
      body.shipperTel || '',
      body.shipperEmail || '',
      body.consigneeCode || null,
      body.consigneeName || '',
      body.consigneeAddress || '',
      body.consigneeContact || '',
      body.consigneeTel || '',
      body.consigneeEmail || '',
      body.notifyPartyCode || null,
      body.notifyPartyName || '',
      body.notifyPartyAddress || '',
      body.carrierBookingNo || null,
      body.carrierId || null,
      body.vesselName || body.vessel || '',
      body.voyageNo || body.voyage || '',
      body.pol || '',
      body.polTerminal || '',
      body.pod || '',
      body.podTerminal || '',
      body.finalDest || '',
      body.etd || null,
      body.eta || null,
      body.closingDate || null,
      body.closingTime || '',
      body.cntr20gpQty || 0,
      body.cntr40gpQty || 0,
      body.cntr40hcQty || 0,
      body.totalCntrQty || body.totalContainers || 0,
      body.mblNo || '',
      body.hblNo || '',
      body.blType || 'ORIGINAL',
      body.commodityDesc || body.commodity || '',
      body.grossWeight || body.totalGrossWeight || 0,
      body.volume || body.totalMeasurement || 0,
      body.specialRequest || '',
      body.dangerousGoods ? 'Y' : 'N',
      body.dgClass || '',
      body.unNumber || '',
      body.imoClass || '',
      body.status || 'DRAFT',
      body.remark || body.remarks || ''
    ]);

    return NextResponse.json({
      success: true,
      bookingId: result.insertId,
      bookingNo: bookingNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create sea booking' }, { status: 500 });
  }
}

// 해상 부킹 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE ORD_OCEAN_BOOKING SET
        CARRIER_BOOKING_NO = ?,
        CARRIER_ID = ?,
        VESSEL_NM = ?,
        VOYAGE_NO = ?,
        POL_PORT_CD = ?,
        POD_PORT_CD = ?,
        ETD_DT = ?,
        ETA_DT = ?,
        CNTR_20GP_QTY = ?,
        CNTR_40GP_QTY = ?,
        CNTR_40HC_QTY = ?,
        TOTAL_CNTR_QTY = ?,
        COMMODITY_DESC = ?,
        GROSS_WEIGHT_KG = ?,
        VOLUME_CBM = ?,
        STATUS_CD = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE BOOKING_ID = ?
    `, [
      body.carrierBookingNo || null,
      body.carrierId || null,
      body.vesselName || '',
      body.voyageNo || '',
      body.pol || '',
      body.pod || '',
      body.etd || null,
      body.eta || null,
      body.cntr20gpQty || 0,
      body.cntr40gpQty || 0,
      body.cntr40hcQty || 0,
      body.totalCntrQty || 0,
      body.commodityDesc || '',
      body.grossWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update sea booking' }, { status: 500 });
  }
}

// 해상 부킹 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Booking IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `UPDATE ORD_OCEAN_BOOKING SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE BOOKING_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete sea bookings' }, { status: 500 });
  }
}
