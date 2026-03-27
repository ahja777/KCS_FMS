import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 스케줄 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carrierId = searchParams.get('carrier_id');
    const polPortCd = searchParams.get('pol_port_cd');
    const podPortCd = searchParams.get('pod_port_cd');
    const etdFrom = searchParams.get('etd_from');
    const etdTo = searchParams.get('etd_to');
    const status = searchParams.get('status');

    let whereClause = 'WHERE s.DEL_YN != "Y"';
    const params: (string | number)[] = [];

    if (carrierId) {
      whereClause += ' AND s.CARRIER_ID = ?';
      params.push(parseInt(carrierId));
    }
    if (polPortCd) {
      whereClause += ' AND s.POL_PORT_CD = ?';
      params.push(polPortCd);
    }
    if (podPortCd) {
      whereClause += ' AND s.POD_PORT_CD = ?';
      params.push(podPortCd);
    }
    if (etdFrom) {
      whereClause += ' AND s.ETD_DT >= ?';
      params.push(etdFrom);
    }
    if (etdTo) {
      whereClause += ' AND s.ETD_DT <= ?';
      params.push(etdTo);
    }
    if (status) {
      whereClause += ' AND s.STATUS_CD = ?';
      params.push(status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        s.SCHEDULE_ID as schedule_id,
        s.CARRIER_ID as carrier_id,
        cr.CARRIER_NM as carrier_name,
        cr.CARRIER_CD as carrier_code,
        s.VESSEL_NM as vessel_nm,
        s.VOYAGE_NO as voyage_no,
        s.SERVICE_LANE as service_lane,
        s.POL_PORT_CD as pol_port_cd,
        s.POD_PORT_CD as pod_port_cd,
        pol.PORT_NM as pol_port_name,
        pod.PORT_NM as pod_port_name,
        s.POL_TERMINAL as pol_terminal,
        s.POD_TERMINAL as pod_terminal,
        DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as etd_dt,
        DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta_dt,
        DATE_FORMAT(s.ATD_DT, '%Y-%m-%d') as atd_dt,
        DATE_FORMAT(s.ATA_DT, '%Y-%m-%d') as ata_dt,
        DATE_FORMAT(s.DOC_CUTOFF_DT, '%Y-%m-%d %H:%i') as doc_cutoff_dt,
        DATE_FORMAT(s.CARGO_CUTOFF_DT, '%Y-%m-%d %H:%i') as cargo_cutoff_dt,
        DATE_FORMAT(s.VGM_CUTOFF_DT, '%Y-%m-%d %H:%i') as vgm_cutoff_dt,
        s.TRANSIT_TIME as transit_time,
        s.SPACE_20GP as space_20gp,
        s.SPACE_40GP as space_40gp,
        s.SPACE_40HC as space_40hc,
        s.SPACE_45HC as space_45hc,
        s.STATUS_CD as status_cd,
        s.REMARK as remark,
        DATE_FORMAT(s.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm
      FROM SCH_VESSEL_SCHEDULE s
      LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
      LEFT JOIN MST_PORT pol ON s.POL_PORT_CD = pol.PORT_CD
      LEFT JOIN MST_PORT pod ON s.POD_PORT_CD = pod.PORT_CD
      ${whereClause}
      ORDER BY s.ETD_DT ASC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// 스케줄 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO SCH_VESSEL_SCHEDULE (
        CARRIER_ID, VESSEL_NM, VOYAGE_NO, SERVICE_LANE,
        POL_PORT_CD, POD_PORT_CD, POL_TERMINAL, POD_TERMINAL,
        ETD_DT, ETA_DT, DOC_CUTOFF_DT, CARGO_CUTOFF_DT, VGM_CUTOFF_DT,
        TRANSIT_TIME, SPACE_20GP, SPACE_40GP, SPACE_40HC, SPACE_45HC,
        REMARK, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, 'SCHEDULED', 'N', 'admin', NOW()
      )
    `, [
      body.carrier_id,
      body.vessel_nm,
      body.voyage_no,
      body.service_lane || null,
      body.pol_port_cd,
      body.pod_port_cd,
      body.pol_terminal || null,
      body.pod_terminal || null,
      body.etd_dt,
      body.eta_dt,
      body.doc_cutoff_dt || null,
      body.cargo_cutoff_dt || null,
      body.vgm_cutoff_dt || null,
      body.transit_time || null,
      body.space_20gp || 0,
      body.space_40gp || 0,
      body.space_40hc || 0,
      body.space_45hc || 0,
      body.remark || null
    ]);

    return NextResponse.json({
      success: true,
      schedule_id: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

// 스케줄 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule_id, ...updateData } = body;

    if (!schedule_id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    const fieldMapping: Record<string, string> = {
      carrier_id: 'CARRIER_ID',
      vessel_nm: 'VESSEL_NM',
      voyage_no: 'VOYAGE_NO',
      service_lane: 'SERVICE_LANE',
      pol_port_cd: 'POL_PORT_CD',
      pod_port_cd: 'POD_PORT_CD',
      pol_terminal: 'POL_TERMINAL',
      pod_terminal: 'POD_TERMINAL',
      etd_dt: 'ETD_DT',
      eta_dt: 'ETA_DT',
      atd_dt: 'ATD_DT',
      ata_dt: 'ATA_DT',
      doc_cutoff_dt: 'DOC_CUTOFF_DT',
      cargo_cutoff_dt: 'CARGO_CUTOFF_DT',
      vgm_cutoff_dt: 'VGM_CUTOFF_DT',
      transit_time: 'TRANSIT_TIME',
      space_20gp: 'SPACE_20GP',
      space_40gp: 'SPACE_40GP',
      space_40hc: 'SPACE_40HC',
      space_45hc: 'SPACE_45HC',
      status_cd: 'STATUS_CD',
      remark: 'REMARK',
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (fieldMapping[key]) {
        updateFields.push(`${fieldMapping[key]} = ?`);
        updateValues.push(value as string | number | null);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('UPDATED_BY = ?', 'UPDATED_DTM = NOW()');
    updateValues.push('admin');
    updateValues.push(schedule_id);

    await pool.query(`
      UPDATE SCH_VESSEL_SCHEDULE
      SET ${updateFields.join(', ')}
      WHERE SCHEDULE_ID = ?
    `, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// 스케줄 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE SCH_VESSEL_SCHEDULE
      SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE SCHEDULE_ID = ?
    `, [scheduleId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
