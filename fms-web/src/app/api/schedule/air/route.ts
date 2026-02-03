import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 항공 스케줄 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (scheduleId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          s.AIR_SCHEDULE_ID as id,
          s.CARRIER_ID as carrierId,
          cr.CARRIER_NM as carrierName,
          s.FLIGHT_NO as flightNo,
          s.ORIGIN_PORT_CD as origin,
          s.ORIGIN_TERMINAL as originTerminal,
          DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
          DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
          s.DEST_PORT_CD as destination,
          s.DEST_TERMINAL as destTerminal,
          DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
          DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
          s.AIRCRAFT_TYPE as aircraftType,
          s.TRANSIT_HOURS as transitHours,
          s.FREQUENCY_CD as frequency,
          s.STATUS_CD as status,
          s.REMARKS as remark,
          DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM SCH_AIR_SCHEDULE s
        LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
        WHERE s.AIR_SCHEDULE_ID = ? AND s.DEL_YN = 'N'
      `, [scheduleId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    // 검색 조건 파싱
    const carrier = searchParams.get('carrier') || '';
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let query = `
      SELECT
        s.AIR_SCHEDULE_ID as id,
        s.CARRIER_ID as carrierId,
        cr.CARRIER_NM as carrierName,
        s.FLIGHT_NO as flightNo,
        s.ORIGIN_PORT_CD as origin,
        s.ORIGIN_TERMINAL as originTerminal,
        s.DEST_PORT_CD as destination,
        s.DEST_TERMINAL as destTerminal,
        DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
        DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
        DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
        DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
        s.AIRCRAFT_TYPE as aircraftType,
        s.TRANSIT_HOURS as transitHours,
        s.FREQUENCY_CD as frequency,
        s.STATUS_CD as status,
        s.REMARKS as remark
      FROM SCH_AIR_SCHEDULE s
      LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
      WHERE s.DEL_YN = 'N'
    `;
    const params: string[] = [];

    if (carrier) {
      query += ` AND (cr.CARRIER_NM LIKE ? OR s.CARRIER_ID LIKE ?)`;
      params.push(`%${carrier}%`, `%${carrier}%`);
    }
    if (origin) {
      query += ` AND s.ORIGIN_PORT_CD LIKE ?`;
      params.push(`%${origin}%`);
    }
    if (destination) {
      query += ` AND s.DEST_PORT_CD LIKE ?`;
      params.push(`%${destination}%`);
    }
    if (status) {
      query += ` AND s.STATUS_CD = ?`;
      params.push(status);
    }
    if (startDate) {
      query += ` AND s.ETD_DTM >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND s.ETD_DTM <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY s.ETD_DTM DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch air schedules' }, { status: 500 });
  }
}

// 항공 스케줄 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SCH_AIR_SCHEDULE (
        CARRIER_ID, FLIGHT_NO, ORIGIN_PORT_CD, ORIGIN_TERMINAL, ETD_DTM,
        DEST_PORT_CD, DEST_TERMINAL, ETA_DTM, AIRCRAFT_TYPE, TRANSIT_HOURS,
        FREQUENCY_CD, STATUS_CD, REMARKS, CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      body.carrierId || null,
      body.flightNo || '',
      body.origin || '',
      body.originTerminal || '',
      body.etd || null,
      body.destination || '',
      body.destTerminal || '',
      body.eta || null,
      body.aircraftType || '',
      body.transitHours || 0,
      body.frequency || 'DAILY',
      body.status || 'SCHEDULED',
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      scheduleId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create air schedule' }, { status: 500 });
  }
}

// 항공 스케줄 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE SCH_AIR_SCHEDULE SET
        CARRIER_ID = ?,
        FLIGHT_NO = ?,
        ORIGIN_PORT_CD = ?,
        ORIGIN_TERMINAL = ?,
        ETD_DTM = ?,
        ATD_DTM = ?,
        DEST_PORT_CD = ?,
        DEST_TERMINAL = ?,
        ETA_DTM = ?,
        ATA_DTM = ?,
        AIRCRAFT_TYPE = ?,
        TRANSIT_HOURS = ?,
        FREQUENCY_CD = ?,
        STATUS_CD = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE AIR_SCHEDULE_ID = ?
    `, [
      body.carrierId || null,
      body.flightNo || '',
      body.origin || '',
      body.originTerminal || '',
      body.etd || null,
      body.atd || null,
      body.destination || '',
      body.destTerminal || '',
      body.eta || null,
      body.ata || null,
      body.aircraftType || '',
      body.transitHours || 0,
      body.frequency || 'DAILY',
      body.status || 'SCHEDULED',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update air schedule' }, { status: 500 });
  }
}

// 항공 스케줄 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Schedule IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `UPDATE SCH_AIR_SCHEDULE SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE AIR_SCHEDULE_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete air schedules' }, { status: 500 });
  }
}
