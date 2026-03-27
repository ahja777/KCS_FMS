import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: House AWB 목록/단건 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM TRN_AIR_HAWB WHERE ID = ? AND DEL_YN = 'N'`, [id]
      );
      if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    const ioType = searchParams.get('ioType') || '';
    const mawbNo = searchParams.get('mawbNo') || '';
    const hawbNo = searchParams.get('hawbNo') || '';
    const departure = searchParams.get('departure') || '';
    const arrival = searchParams.get('arrival') || '';
    const obDateFrom = searchParams.get('obDateFrom') || '';
    const obDateTo = searchParams.get('obDateTo') || '';

    let sql = `SELECT * FROM TRN_AIR_HAWB WHERE DEL_YN = 'N'`;
    const params: string[] = [];

    if (ioType) { sql += ` AND IO_TYPE = ?`; params.push(ioType); }
    if (mawbNo) { sql += ` AND MAWB_NO LIKE ?`; params.push(`%${mawbNo}%`); }
    if (hawbNo) { sql += ` AND HAWB_NO LIKE ?`; params.push(`%${hawbNo}%`); }
    if (departure) { sql += ` AND DEPARTURE = ?`; params.push(departure.toUpperCase()); }
    if (arrival) { sql += ` AND ARRIVAL = ?`; params.push(arrival.toUpperCase()); }
    if (obDateFrom) { sql += ` AND OB_DATE >= ?`; params.push(obDateFrom); }
    if (obDateTo) { sql += ` AND OB_DATE <= ?`; params.push(obDateTo); }

    sql += ` ORDER BY CREATED_DTM DESC LIMIT 500`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('HAWB GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch HAWB data' }, { status: 500 });
  }
}

// POST: House AWB 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID, ...data } = body;

    if (!data.HAWB_NO) {
      return NextResponse.json({ error: 'HAWB NO는 필수입니다.' }, { status: 400 });
    }

    if (ID) {
      // JOB_NO가 없으면 자동생성
      if (!data.JOB_NO) {
        const [existing] = await pool.query<RowDataPacket[]>(
          `SELECT JOB_NO FROM TRN_AIR_HAWB WHERE ID = ?`, [ID]
        );
        if (!existing[0]?.JOB_NO) {
          const year = new Date().getFullYear();
          const prefix = (data.IO_TYPE === 'IN') ? 'HIM' : 'HEX';
          const [countResult] = await pool.query<RowDataPacket[]>(
            `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, LENGTH(CONCAT(?, '-', ?, '-')) + 1) AS UNSIGNED)), 0) as max_seq FROM TRN_AIR_HAWB WHERE JOB_NO LIKE CONCAT(?, '-', ?, '-%')`,
            [prefix, year, prefix, year]
          );
          const seq = Number(countResult[0].max_seq) + 1;
          data.JOB_NO = `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
        } else {
          data.JOB_NO = existing[0].JOB_NO;
        }
      }

      await pool.query<ResultSetHeader>(
        `UPDATE TRN_AIR_HAWB SET
          MAWB_ID=?, JOB_NO=?, IO_TYPE=?, MAWB_NO=?, HAWB_NO=?, BOOKING_NO=?,
          OB_DATE=?, AR_DATE=?, DEPARTURE=?, ARRIVAL=?, FLIGHT_NO=?, FLIGHT_DATE=?,
          SHIPPER_CODE=?, SHIPPER_NAME=?, SHIPPER_ADDRESS=?,
          CONSIGNEE_CODE=?, CONSIGNEE_NAME=?, CONSIGNEE_ADDRESS=?,
          NOTIFY_CODE=?, NOTIFY_NAME=?, NOTIFY_ADDRESS=?,
          CURRENCY=?, WT_VAL=?, OTHER_CHGS=?, CHGS_CODE=?, HANDLING_INFO=?,
          PIECES=?, GROSS_WEIGHT=?, CHARGEABLE_WEIGHT=?,
          RATE_CLASS=?, COMMODITY=?, RATE_CHARGE=?, TOTAL_CHARGE=?,
          NATURE_OF_GOODS=?, AT_PLACE=?, DIMENSIONS_VOLUME=?,
          LC_NO=?, PO_NO=?, INV_VALUE=?, INV_NO=?,
          TYPE=?, DC=?, LN=?, PC=?, INCO=?,
          AGENT_CODE=?, AGENT_NAME=?, SUB_AGENT_CODE=?, SUB_AGENT_NAME=?,
          PARTNER_CODE=?, PARTNER_NAME=?, AIRLINE_CODE=?, AIRLINE_NAME=?,
          REGION_CODE=?, COUNTRY_CODE=?, MRN_NO=?, MSN=?, STATUS=?,
          UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()
        WHERE ID = ?`,
        [
          data.MAWB_ID || null, data.JOB_NO || null, data.IO_TYPE || 'OUT', data.MAWB_NO || null, data.HAWB_NO, data.BOOKING_NO || null,
          data.OB_DATE || null, data.AR_DATE || null, data.DEPARTURE || null, data.ARRIVAL || null, data.FLIGHT_NO || null, data.FLIGHT_DATE || null,
          data.SHIPPER_CODE || null, data.SHIPPER_NAME || null, data.SHIPPER_ADDRESS || null,
          data.CONSIGNEE_CODE || null, data.CONSIGNEE_NAME || null, data.CONSIGNEE_ADDRESS || null,
          data.NOTIFY_CODE || null, data.NOTIFY_NAME || null, data.NOTIFY_ADDRESS || null,
          data.CURRENCY || 'USD', data.WT_VAL || 'C', data.OTHER_CHGS || 'C', data.CHGS_CODE || null, data.HANDLING_INFO || null,
          data.PIECES || 0, data.GROSS_WEIGHT || 0, data.CHARGEABLE_WEIGHT || 0,
          data.RATE_CLASS || null, data.COMMODITY || null, data.RATE_CHARGE || 0, data.TOTAL_CHARGE || 0,
          data.NATURE_OF_GOODS || null, data.AT_PLACE || null, data.DIMENSIONS_VOLUME || 0,
          data.LC_NO || null, data.PO_NO || null, data.INV_VALUE || null, data.INV_NO || null,
          data.TYPE || null, data.DC || null, data.LN || null, data.PC || null, data.INCO || null,
          data.AGENT_CODE || null, data.AGENT_NAME || null, data.SUB_AGENT_CODE || null, data.SUB_AGENT_NAME || null,
          data.PARTNER_CODE || null, data.PARTNER_NAME || null, data.AIRLINE_CODE || null, data.AIRLINE_NAME || null,
          data.REGION_CODE || null, data.COUNTRY_CODE || null, data.MRN_NO || null, data.MSN || null, data.STATUS || 'DRAFT',
          ID
        ]
      );
      return NextResponse.json({ success: true, ID, JOB_NO: data.JOB_NO });
    } else {
      const year = new Date().getFullYear();
      const prefix = (data.IO_TYPE === 'IN') ? 'HIM' : 'HEX';
      const [countResult] = await pool.query<RowDataPacket[]>(
        `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, LENGTH(CONCAT(?, '-', ?, '-')) + 1) AS UNSIGNED)), 0) as max_seq FROM TRN_AIR_HAWB WHERE JOB_NO LIKE CONCAT(?, '-', ?, '-%')`,
        [prefix, year, prefix, year]
      );
      const seq = Number(countResult[0].max_seq) + 1;
      const jobNo = `${prefix}-${year}-${String(seq).padStart(4, '0')}`;

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO TRN_AIR_HAWB (
          MAWB_ID, JOB_NO, IO_TYPE, MAWB_NO, HAWB_NO, BOOKING_NO,
          OB_DATE, AR_DATE, DEPARTURE, ARRIVAL, FLIGHT_NO, FLIGHT_DATE,
          SHIPPER_CODE, SHIPPER_NAME, SHIPPER_ADDRESS,
          CONSIGNEE_CODE, CONSIGNEE_NAME, CONSIGNEE_ADDRESS,
          NOTIFY_CODE, NOTIFY_NAME, NOTIFY_ADDRESS,
          CURRENCY, WT_VAL, OTHER_CHGS, CHGS_CODE, HANDLING_INFO,
          PIECES, GROSS_WEIGHT, CHARGEABLE_WEIGHT,
          RATE_CLASS, COMMODITY, RATE_CHARGE, TOTAL_CHARGE,
          NATURE_OF_GOODS, AT_PLACE, DIMENSIONS_VOLUME,
          LC_NO, PO_NO, INV_VALUE, INV_NO,
          TYPE, DC, LN, PC, INCO,
          AGENT_CODE, AGENT_NAME, SUB_AGENT_CODE, SUB_AGENT_NAME,
          PARTNER_CODE, PARTNER_NAME, AIRLINE_CODE, AIRLINE_NAME,
          REGION_CODE, COUNTRY_CODE, MRN_NO, MSN,
          STATUS, DEL_YN, CREATED_BY, CREATED_DTM
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'DRAFT','N','SYSTEM',NOW())`,
        [
          data.MAWB_ID || null, jobNo, data.IO_TYPE || 'OUT', data.MAWB_NO || null, data.HAWB_NO, data.BOOKING_NO || null,
          data.OB_DATE || null, data.AR_DATE || null, data.DEPARTURE || null, data.ARRIVAL || null, data.FLIGHT_NO || null, data.FLIGHT_DATE || null,
          data.SHIPPER_CODE || null, data.SHIPPER_NAME || null, data.SHIPPER_ADDRESS || null,
          data.CONSIGNEE_CODE || null, data.CONSIGNEE_NAME || null, data.CONSIGNEE_ADDRESS || null,
          data.NOTIFY_CODE || null, data.NOTIFY_NAME || null, data.NOTIFY_ADDRESS || null,
          data.CURRENCY || 'USD', data.WT_VAL || 'C', data.OTHER_CHGS || 'C', data.CHGS_CODE || null, data.HANDLING_INFO || null,
          data.PIECES || 0, data.GROSS_WEIGHT || 0, data.CHARGEABLE_WEIGHT || 0,
          data.RATE_CLASS || null, data.COMMODITY || null, data.RATE_CHARGE || 0, data.TOTAL_CHARGE || 0,
          data.NATURE_OF_GOODS || null, data.AT_PLACE || null, data.DIMENSIONS_VOLUME || 0,
          data.LC_NO || null, data.PO_NO || null, data.INV_VALUE || null, data.INV_NO || null,
          data.TYPE || null, data.DC || null, data.LN || null, data.PC || null, data.INCO || null,
          data.AGENT_CODE || null, data.AGENT_NAME || null, data.SUB_AGENT_CODE || null, data.SUB_AGENT_NAME || null,
          data.PARTNER_CODE || null, data.PARTNER_NAME || null, data.AIRLINE_CODE || null, data.AIRLINE_NAME || null,
          data.REGION_CODE || null, data.COUNTRY_CODE || null, data.MRN_NO || null, data.MSN || null,
        ]
      );
      return NextResponse.json({ success: true, ID: result.insertId, JOB_NO: jobNo });
    }
  } catch (error) {
    console.error('HAWB POST error:', error);
    return NextResponse.json({ error: 'Failed to save HAWB' }, { status: 500 });
  }
}

// DELETE: House AWB 삭제 (논리삭제)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: number[] };
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: '삭제할 항목을 선택해주세요.' }, { status: 400 });
    }
    for (const id of ids) {
      await pool.query<ResultSetHeader>(
        `UPDATE TRN_AIR_HAWB SET DEL_YN='Y', UPDATED_BY='SYSTEM', UPDATED_DTM=NOW() WHERE ID=?`, [id]
      );
    }
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('HAWB DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete HAWB' }, { status: 500 });
  }
}
