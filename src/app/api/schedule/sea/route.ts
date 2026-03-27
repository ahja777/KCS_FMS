import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 해상 스케줄 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (scheduleId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          s.OCEAN_SCHEDULE_ID as id,
          s.VOYAGE_ID as voyageId,
          s.CARRIER_ID as carrierId,
          cr.CARRIER_NM as carrierName,
          s.VESSEL_NM as vesselName,
          s.VOYAGE_NO as voyageNo,
          s.POL_PORT_CD as pol,
          s.POL_TERMINAL_NM as polTerminal,
          DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
          DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
          DATE_FORMAT(s.CUT_OFF_DTM, '%Y-%m-%d %H:%i') as cutOff,
          DATE_FORMAT(s.CARGO_CUT_OFF_DTM, '%Y-%m-%d %H:%i') as cargoCutOff,
          s.POD_PORT_CD as pod,
          s.POD_TERMINAL_NM as podTerminal,
          DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
          DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
          s.TRANSIT_DAYS as transitDays,
          s.FREQUENCY_CD as frequency,
          s.STATUS_CD as status,
          s.REMARKS as remark,
          DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM SCH_OCEAN_SCHEDULE s
        LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
        WHERE s.OCEAN_SCHEDULE_ID = ? AND s.DEL_YN = 'N'
      `, [scheduleId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    // 검색 조건 파싱
    const carrier = searchParams.get('carrier') || '';
    const pol = searchParams.get('pol') || '';
    const pod = searchParams.get('pod') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let query = `
      SELECT
        s.OCEAN_SCHEDULE_ID as id,
        s.CARRIER_ID as carrierId,
        cr.CARRIER_NM as carrierName,
        s.VESSEL_NM as vesselName,
        s.VOYAGE_NO as voyageNo,
        s.CALL_SIGN as callSign,
        s.IMO_NO as imo,
        s.POL_PORT_CD as pol,
        s.POL_TERMINAL_NM as polTerminal,
        s.POD_PORT_CD as pod,
        s.POD_TERMINAL_NM as podTerminal,
        DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d') as etd,
        DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
        DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d') as eta,
        DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
        DATE_FORMAT(s.CUT_OFF_DTM, '%Y-%m-%d %H:%i') as cutOff,
        DATE_FORMAT(s.CARGO_CUT_OFF_DTM, '%Y-%m-%d %H:%i') as docCutOff,
        DATE_FORMAT(s.CY_CLOSING_DTM, '%Y-%m-%d %H:%i') as cyClosing,
        DATE_FORMAT(s.CFS_CLOSING_DTM, '%Y-%m-%d %H:%i') as cfsClosing,
        s.TRANSIT_DAYS as transitDays,
        s.STATUS_CD as status,
        s.REMARKS as remark
      FROM SCH_OCEAN_SCHEDULE s
      LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
      WHERE s.DEL_YN = 'N'
    `;
    const params: string[] = [];

    if (carrier) {
      query += ` AND cr.CARRIER_NM LIKE ?`;
      params.push(`%${carrier}%`);
    }
    if (pol) {
      query += ` AND s.POL_PORT_CD LIKE ?`;
      params.push(`%${pol}%`);
    }
    if (pod) {
      query += ` AND s.POD_PORT_CD LIKE ?`;
      params.push(`%${pod}%`);
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
    return NextResponse.json({ error: 'Failed to fetch ocean schedules' }, { status: 500 });
  }
}

// 해상 스케줄 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.carrierId) {
      return NextResponse.json({
        error: 'Carrier ID is required (carrierId 필드가 필수입니다)'
      }, { status: 400 });
    }

    // Voyage 생성 또는 조회
    let voyageId = body.voyageId;
    if (!voyageId) {
      const [voyageResult] = await pool.query<ResultSetHeader>(`
        INSERT INTO SCH_VOYAGE (VESSEL_NM, VOYAGE_NO, CARRIER_ID, CREATED_BY, CREATED_DTM, DEL_YN)
        VALUES (?, ?, ?, 'admin', NOW(), 'N')
      `, [body.vesselName || '', body.voyageNo || '', body.carrierId]);
      voyageId = voyageResult.insertId;
    }

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SCH_OCEAN_SCHEDULE (
        VOYAGE_ID, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POL_TERMINAL_NM,
        ETD_DTM, CUT_OFF_DTM, CARGO_CUT_OFF_DTM, POD_PORT_CD, POD_TERMINAL_NM,
        ETA_DTM, TRANSIT_DAYS, FREQUENCY_CD, STATUS_CD, REMARKS,
        CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      voyageId,
      body.carrierId || null,
      body.vesselName || '',
      body.voyageNo || '',
      body.pol || '',
      body.polTerminal || '',
      body.etd || null,
      body.cutOff || null,
      body.cargoCutOff || null,
      body.pod || '',
      body.podTerminal || '',
      body.eta || null,
      body.transitDays || 0,
      body.frequency || 'WEEKLY',
      body.status || 'SCHEDULED',
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      scheduleId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create ocean schedule' }, { status: 500 });
  }
}

// 해상 스케줄 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE SCH_OCEAN_SCHEDULE SET
        CARRIER_ID = ?,
        VESSEL_NM = ?,
        VOYAGE_NO = ?,
        POL_PORT_CD = ?,
        POL_TERMINAL_NM = ?,
        ETD_DTM = ?,
        ATD_DTM = ?,
        CUT_OFF_DTM = ?,
        CARGO_CUT_OFF_DTM = ?,
        POD_PORT_CD = ?,
        POD_TERMINAL_NM = ?,
        ETA_DTM = ?,
        ATA_DTM = ?,
        TRANSIT_DAYS = ?,
        FREQUENCY_CD = ?,
        STATUS_CD = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE OCEAN_SCHEDULE_ID = ?
    `, [
      body.carrierId || null,
      body.vesselName || '',
      body.voyageNo || '',
      body.pol || '',
      body.polTerminal || '',
      body.etd || null,
      body.atd || null,
      body.cutOff || null,
      body.cargoCutOff || null,
      body.pod || '',
      body.podTerminal || '',
      body.eta || null,
      body.ata || null,
      body.transitDays || 0,
      body.frequency || 'WEEKLY',
      body.status || 'SCHEDULED',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update ocean schedule' }, { status: 500 });
  }
}

// 해상 스케줄 삭제
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
      `UPDATE SCH_OCEAN_SCHEDULE SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE OCEAN_SCHEDULE_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete ocean schedules' }, { status: 500 });
  }
}
