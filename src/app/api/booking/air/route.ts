import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateJobNo, ensureJobNoColumn } from '@/lib/jobno';

// 항공 부킹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (bookingId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          b.BOOKING_ID as id,
          b.BOOKING_NO as bookingNo,
          b.JOB_NO as jobNo,
          b.CARRIER_BOOKING_NO as carrierBookingNo,
          b.CARRIER_ID as carrierId,
          cr.CARRIER_NM as carrierName,
          b.FLIGHT_NO as flightNo,
          DATE_FORMAT(b.FLIGHT_DT, '%Y-%m-%d') as flightDate,
          b.ORIGIN_PORT_CD as origin,
          b.DEST_PORT_CD as destination,
          DATE_FORMAT(b.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
          DATE_FORMAT(b.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
          b.COMMODITY_DESC as commodityDesc,
          b.PKG_QTY as pkgQty,
          b.PKG_TYPE_CD as pkgType,
          b.GROSS_WEIGHT_KG as grossWeight,
          b.CHARGEABLE_WEIGHT as chargeableWeight,
          b.VOLUME_CBM as volume,
          b.STATUS_CD as status,
          b.REMARKS as remark,
          DATE_FORMAT(b.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM ORD_AIR_BOOKING b
        LEFT JOIN MST_CARRIER cr ON b.CARRIER_ID = cr.CARRIER_ID
        WHERE b.BOOKING_ID = ? AND b.DEL_YN = 'N'
      `, [bookingId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        b.BOOKING_ID as id,
        b.BOOKING_NO as bookingNo,
        b.JOB_NO as jobNo,
        cr.CARRIER_NM as carrierName,
        b.FLIGHT_NO as flightNo,
        DATE_FORMAT(b.FLIGHT_DT, '%Y-%m-%d') as flightDate,
        b.ORIGIN_PORT_CD as origin,
        b.DEST_PORT_CD as destination,
        DATE_FORMAT(b.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
        DATE_FORMAT(b.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
        b.COMMODITY_DESC as commodityDesc,
        b.PKG_QTY as pkgQty,
        b.PKG_TYPE_CD as pkgType,
        b.GROSS_WEIGHT_KG as grossWeight,
        b.CHARGEABLE_WEIGHT as chargeableWeight,
        b.VOLUME_CBM as volume,
        b.STATUS_CD as status
      FROM ORD_AIR_BOOKING b
      LEFT JOIN MST_CARRIER cr ON b.CARRIER_ID = cr.CARRIER_ID
      WHERE b.DEL_YN = 'N'
      ORDER BY b.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch air bookings' }, { status: 500 });
  }
}

// 항공 부킹 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 부킹 번호 생성 (정상 형식 데이터만 고려, 삭제된 데이터도 포함하여 중복 방지)
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(BOOKING_NO, LENGTH('AB-${year}-') + 1) AS UNSIGNED)), 0) as max_seq
       FROM ORD_AIR_BOOKING
       WHERE BOOKING_NO LIKE ?
         AND BOOKING_NO REGEXP '^AB-[0-9]{4}-[0-9]{4}$'`,
      [`AB-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const bookingNo = `AB-${year}-${String(count).padStart(4, '0')}`;

    // JOB_NO 자동생성
    await ensureJobNoColumn('ORD_AIR_BOOKING');
    const jobNo = await generateJobNo('ORD_AIR_BOOKING', 'BAE');

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO ORD_AIR_BOOKING (
        BOOKING_NO, JOB_NO, CARRIER_BOOKING_NO, CARRIER_ID, FLIGHT_NO, FLIGHT_DT,
        ORIGIN_PORT_CD, DEST_PORT_CD, ETD_DTM, ETA_DTM,
        COMMODITY_DESC, PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, CHARGEABLE_WEIGHT,
        VOLUME_CBM, STATUS_CD, REMARKS, CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      bookingNo,
      jobNo,
      body.carrierBookingNo || null,
      body.carrierId || null,
      body.flightNo || '',
      body.flightDate || null,
      body.origin || '',
      body.destination || '',
      body.etd || null,
      body.eta || null,
      body.commodityDesc || '',
      body.pkgQty || 0,
      body.pkgType || '',
      body.grossWeight || 0,
      body.chargeableWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      bookingId: result.insertId,
      bookingNo: bookingNo,
      jobNo: jobNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create air booking' }, { status: 500 });
  }
}

// 항공 부킹 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // JOB_NO가 없으면 자동생성
    await ensureJobNoColumn('ORD_AIR_BOOKING');
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT JOB_NO FROM ORD_AIR_BOOKING WHERE BOOKING_ID = ?`, [body.id]
    );
    let jobNo = existing[0]?.JOB_NO || null;
    if (!jobNo) {
      jobNo = await generateJobNo('ORD_AIR_BOOKING', 'BAE');
    }

    await pool.query(`
      UPDATE ORD_AIR_BOOKING SET
        JOB_NO = ?,
        CARRIER_BOOKING_NO = ?,
        CARRIER_ID = ?,
        FLIGHT_NO = ?,
        FLIGHT_DT = ?,
        ORIGIN_PORT_CD = ?,
        DEST_PORT_CD = ?,
        ETD_DTM = ?,
        ETA_DTM = ?,
        COMMODITY_DESC = ?,
        PKG_QTY = ?,
        PKG_TYPE_CD = ?,
        GROSS_WEIGHT_KG = ?,
        CHARGEABLE_WEIGHT = ?,
        VOLUME_CBM = ?,
        STATUS_CD = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE BOOKING_ID = ?
    `, [
      jobNo,
      body.carrierBookingNo || null,
      body.carrierId || null,
      body.flightNo || '',
      body.flightDate || null,
      body.origin || '',
      body.destination || '',
      body.etd || null,
      body.eta || null,
      body.commodityDesc || '',
      body.pkgQty || 0,
      body.pkgType || '',
      body.grossWeight || 0,
      body.chargeableWeight || 0,
      body.volume || 0,
      body.status || 'DRAFT',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update air booking' }, { status: 500 });
  }
}

// 항공 부킹 삭제
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
      `UPDATE ORD_AIR_BOOKING SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE BOOKING_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete air bookings' }, { status: 500 });
  }
}
