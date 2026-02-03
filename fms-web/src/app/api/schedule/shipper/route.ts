import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// 스케줄 조회 (화주용) - 해상/항공 통합 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, sea, air
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const carrier = searchParams.get('carrier') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const results: RowDataPacket[] = [];

    // 해상 스케줄 조회
    if (type === 'all' || type === 'sea') {
      let seaQuery = `
        SELECT
          'SEA' as transportType,
          s.OCEAN_SCHEDULE_ID as id,
          cr.CARRIER_NM as carrier,
          s.VESSEL_NM as vessel,
          s.VOYAGE_NO as voyage,
          s.CALL_SIGN as callSign,
          s.IMO_NO as imo,
          s.POL_PORT_CD as origin,
          s.POL_TERMINAL_NM as originTerminal,
          s.POD_PORT_CD as destination,
          s.POD_TERMINAL_NM as destinationTerminal,
          DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
          DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
          DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
          DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
          s.TRANSIT_DAYS as transitDays,
          DATE_FORMAT(s.CUT_OFF_DTM, '%Y-%m-%d %H:%i') as cutOff,
          DATE_FORMAT(s.CY_CLOSING_DTM, '%Y-%m-%d %H:%i') as cyClosing,
          DATE_FORMAT(s.CFS_CLOSING_DTM, '%Y-%m-%d %H:%i') as cfsClosing,
          s.STATUS_CD as status
        FROM SCH_OCEAN_SCHEDULE s
        LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
        WHERE s.DEL_YN = 'N'
      `;
      const seaParams: string[] = [];

      if (origin) {
        seaQuery += ` AND s.POL_PORT_CD LIKE ?`;
        seaParams.push(`%${origin}%`);
      }
      if (destination) {
        seaQuery += ` AND s.POD_PORT_CD LIKE ?`;
        seaParams.push(`%${destination}%`);
      }
      if (carrier) {
        seaQuery += ` AND cr.CARRIER_NM LIKE ?`;
        seaParams.push(`%${carrier}%`);
      }
      if (startDate) {
        seaQuery += ` AND s.ETD_DTM >= ?`;
        seaParams.push(startDate);
      }
      if (endDate) {
        seaQuery += ` AND s.ETD_DTM <= ?`;
        seaParams.push(`${endDate} 23:59:59`);
      }

      seaQuery += ` ORDER BY s.ETD_DTM ASC`;

      const [seaRows] = await pool.query<RowDataPacket[]>(seaQuery, seaParams);
      results.push(...seaRows);
    }

    // 항공 스케줄 조회
    if (type === 'all' || type === 'air') {
      let airQuery = `
        SELECT
          'AIR' as transportType,
          s.AIR_SCHEDULE_ID as id,
          cr.CARRIER_NM as carrier,
          s.FLIGHT_NO as vessel,
          s.FLIGHT_NO as voyage,
          NULL as callSign,
          NULL as imo,
          s.ORIGIN_PORT_CD as origin,
          s.ORIGIN_AIRPORT_NM as originTerminal,
          s.DEST_PORT_CD as destination,
          s.DEST_AIRPORT_NM as destinationTerminal,
          DATE_FORMAT(s.ETD_DTM, '%Y-%m-%d %H:%i') as etd,
          DATE_FORMAT(s.ATD_DTM, '%Y-%m-%d %H:%i') as atd,
          DATE_FORMAT(s.ETA_DTM, '%Y-%m-%d %H:%i') as eta,
          DATE_FORMAT(s.ATA_DTM, '%Y-%m-%d %H:%i') as ata,
          s.TRANSIT_DAYS as transitDays,
          DATE_FORMAT(s.CUT_OFF_DTM, '%Y-%m-%d %H:%i') as cutOff,
          NULL as cyClosing,
          NULL as cfsClosing,
          s.STATUS_CD as status
        FROM SCH_AIR_SCHEDULE s
        LEFT JOIN MST_CARRIER cr ON s.CARRIER_ID = cr.CARRIER_ID
        WHERE s.DEL_YN = 'N'
      `;
      const airParams: string[] = [];

      if (origin) {
        airQuery += ` AND s.ORIGIN_PORT_CD LIKE ?`;
        airParams.push(`%${origin}%`);
      }
      if (destination) {
        airQuery += ` AND s.DEST_PORT_CD LIKE ?`;
        airParams.push(`%${destination}%`);
      }
      if (carrier) {
        airQuery += ` AND cr.CARRIER_NM LIKE ?`;
        airParams.push(`%${carrier}%`);
      }
      if (startDate) {
        airQuery += ` AND s.ETD_DTM >= ?`;
        airParams.push(startDate);
      }
      if (endDate) {
        airQuery += ` AND s.ETD_DTM <= ?`;
        airParams.push(`${endDate} 23:59:59`);
      }

      airQuery += ` ORDER BY s.ETD_DTM ASC`;

      const [airRows] = await pool.query<RowDataPacket[]>(airQuery, airParams);
      results.push(...airRows);
    }

    // 통합 정렬 (ETD 기준)
    if (type === 'all') {
      results.sort((a, b) => {
        const dateA = new Date(a.etd || '9999-12-31');
        const dateB = new Date(b.etd || '9999-12-31');
        return dateA.getTime() - dateB.getTime();
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}
