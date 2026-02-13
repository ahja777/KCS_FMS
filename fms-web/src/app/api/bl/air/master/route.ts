import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: Master AWB 목록/단건 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM TRN_AIR_MAWB WHERE ID = ? AND DEL_YN = 'N'`, [id]
      );
      if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    const ioType = searchParams.get('ioType') || '';
    const mawbNo = searchParams.get('mawbNo') || '';
    const departure = searchParams.get('departure') || '';
    const arrival = searchParams.get('arrival') || '';
    const airline = searchParams.get('airline') || '';
    const obDateFrom = searchParams.get('obDateFrom') || '';
    const obDateTo = searchParams.get('obDateTo') || '';

    let sql = `SELECT * FROM TRN_AIR_MAWB WHERE DEL_YN = 'N'`;
    const params: string[] = [];

    if (ioType) { sql += ` AND IO_TYPE = ?`; params.push(ioType); }
    if (mawbNo) { sql += ` AND MAWB_NO LIKE ?`; params.push(`%${mawbNo}%`); }
    if (departure) { sql += ` AND DEPARTURE = ?`; params.push(departure.toUpperCase()); }
    if (arrival) { sql += ` AND ARRIVAL = ?`; params.push(arrival.toUpperCase()); }
    if (airline) { sql += ` AND (AIRLINE_CODE LIKE ? OR AIRLINE_NAME LIKE ?)`; params.push(`%${airline}%`, `%${airline}%`); }
    if (obDateFrom) { sql += ` AND OB_DATE >= ?`; params.push(obDateFrom); }
    if (obDateTo) { sql += ` AND OB_DATE <= ?`; params.push(obDateTo); }

    sql += ` ORDER BY CREATED_DTM DESC LIMIT 500`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('MAWB GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch MAWB data' }, { status: 500 });
  }
}

// 공통 필드 목록
const ALL_FIELDS = [
  'JOB_NO', 'IO_TYPE', 'MAWB_NO', 'BOOKING_NO',
  'AIRLINE_CODE', 'AIRLINE_NAME', 'OB_DATE', 'AR_DATE',
  'DEPARTURE', 'ARRIVAL', 'FLIGHT_NO', 'FLIGHT_DATE',
  'SHIPPER_CODE', 'SHIPPER_NAME', 'SHIPPER_ADDRESS',
  'CONSIGNEE_CODE', 'CONSIGNEE_NAME', 'CONSIGNEE_ADDRESS',
  'NOTIFY_CODE', 'NOTIFY_NAME', 'NOTIFY_ADDRESS',
  'CURRENCY', 'WT_VAL', 'OTHER_CHGS', 'CHGS_CODE', 'HANDLING_INFO',
  'TOTAL_PIECES', 'TOTAL_WEIGHT', 'CHARGEABLE_WEIGHT', 'HAWB_COUNT',
  'RATE_CHARGE', 'RATE_APPLIED', 'RATE_TYPE',
  'NATURE_OF_GOODS', 'AT_PLACE',
  'AGENT_CODE', 'AGENT_NAME', 'SUB_AGENT_CODE', 'SUB_AGENT_NAME',
  'PARTNER_CODE', 'PARTNER_NAME', 'REGION_CODE', 'COUNTRY_CODE',
  'MRN_NO', 'MSN', 'STATUS',
  // 신규 MAIN 필드
  'HAWB_NO', 'BIZ_TYPE', 'CONSOL_TYPE', 'EXPORT_TYPE', 'SALES_TYPE', 'PAYMENT_METHOD',
  'IATA_CODE', 'ACCOUNT_NO', 'ACCOUNT_INFO', 'NOT_NEGOTIABLE',
  'DV_CARRIAGE', 'DV_CUSTOMS', 'AMOUNT_INSURANCE',
  'DEPARTURE_DATE', 'DEPARTURE_TIME', 'ARRIVAL_DATE', 'ARRIVAL_TIME',
  'TO_BY_CARRIER', 'FLIGHT_NO_2', 'FLIGHT_NO_3',
  'REQUEST_FLIGHT_NO', 'REQUEST_DATE', 'REQUEST_TIME', 'DV_CUSTOMS_CONSOLE',
  // 신규 CARGO 필드
  'KG_LB', 'RATE_CLASS', 'TOTAL_AMOUNT', 'AS_ARRANGED',
  'WEIGHT_CHARGE_P', 'WEIGHT_CHARGE_C',
  'VALUATION_CHARGE_P', 'VALUATION_CHARGE_C',
  'TOTAL_CHARGE_AGENT_P', 'TOTAL_CHARGE_AGENT_C',
  'TOTAL_CHARGE_CARRIER_P', 'TOTAL_CHARGE_CARRIER_C',
  'TOTAL_PREPAID_1', 'TOTAL_PREPAID_2',
  'EXECUTED_DATE', 'SIGNATURE',
  // 신규 OTHER 필드
  'SALES_MAN', 'INPUT_STAFF', 'BRANCH_CODE',
  'AREA_NAME', 'COUNTRY_NAME',
  'LC_NO', 'PO_NO', 'ITEM', 'AMOUNT_OTHER',
  'INV_VALUE', 'INV_NO',
];

// 기본값 매핑
const DEFAULTS: Record<string, unknown> = {
  IO_TYPE: 'OUT', CURRENCY: 'USD', WT_VAL: 'C', OTHER_CHGS: 'C',
  STATUS: 'DRAFT', KG_LB: 'KG', DV_CARRIAGE: 'N.V.D', AS_ARRANGED: 'N',
};

// 숫자 필드
const NUMBER_FIELDS = new Set([
  'TOTAL_PIECES', 'TOTAL_WEIGHT', 'CHARGEABLE_WEIGHT', 'HAWB_COUNT',
  'RATE_CHARGE', 'RATE_APPLIED', 'TOTAL_AMOUNT',
  'WEIGHT_CHARGE_P', 'WEIGHT_CHARGE_C',
  'VALUATION_CHARGE_P', 'VALUATION_CHARGE_C',
  'TOTAL_CHARGE_AGENT_P', 'TOTAL_CHARGE_AGENT_C',
  'TOTAL_CHARGE_CARRIER_P', 'TOTAL_CHARGE_CARRIER_C',
  'TOTAL_PREPAID_1', 'TOTAL_PREPAID_2', 'AMOUNT_OTHER',
]);

function getParamValue(data: Record<string, unknown>, field: string): unknown {
  const val = data[field];
  if (NUMBER_FIELDS.has(field)) return val || 0;
  return val || DEFAULTS[field] || null;
}

// POST: Master AWB 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID, ...data } = body;

    if (!data.MAWB_NO) {
      return NextResponse.json({ error: 'MAWB NO는 필수입니다.' }, { status: 400 });
    }

    if (ID) {
      // 수정
      const setClause = ALL_FIELDS.map(f => `${f}=?`).join(', ');
      const params = ALL_FIELDS.map(f => getParamValue(data, f));
      params.push(ID);

      await pool.query<ResultSetHeader>(
        `UPDATE TRN_AIR_MAWB SET ${setClause}, UPDATED_BY='SYSTEM', UPDATED_DTM=NOW() WHERE ID = ?`,
        params
      );
      return NextResponse.json({ success: true, ID });
    } else {
      // 등록 - JOB_NO 자동 생성
      const year = new Date().getFullYear();
      const prefix = (data.IO_TYPE === 'IN') ? 'AIM' : 'AEX';
      const [countResult] = await pool.query<RowDataPacket[]>(
        `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, LENGTH(CONCAT(?, '-', ?, '-')) + 1) AS UNSIGNED)), 0) as max_seq FROM TRN_AIR_MAWB WHERE JOB_NO LIKE CONCAT(?, '-', ?, '-%')`,
        [prefix, year, prefix, year]
      );
      const seq = Number(countResult[0].max_seq) + 1;
      const jobNo = `${prefix}-${year}-${String(seq).padStart(4, '0')}`;

      // JOB_NO 덮어쓰기
      data.JOB_NO = jobNo;

      const fieldList = ALL_FIELDS.join(', ');
      const placeholders = ALL_FIELDS.map(() => '?').join(', ');
      const params = ALL_FIELDS.map(f => getParamValue(data, f));

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO TRN_AIR_MAWB (${fieldList}, DEL_YN, CREATED_BY, CREATED_DTM) VALUES (${placeholders}, 'N', 'SYSTEM', NOW())`,
        params
      );
      return NextResponse.json({ success: true, ID: result.insertId, JOB_NO: jobNo });
    }
  } catch (error) {
    console.error('MAWB POST error:', error);
    return NextResponse.json({ error: 'Failed to save MAWB' }, { status: 500 });
  }
}

// DELETE: Master AWB 삭제 (논리삭제)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: number[] };
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: '삭제할 항목을 선택해주세요.' }, { status: 400 });
    }
    for (const id of ids) {
      await pool.query<ResultSetHeader>(
        `UPDATE TRN_AIR_MAWB SET DEL_YN='Y', UPDATED_BY='SYSTEM', UPDATED_DTM=NOW() WHERE ID=?`, [id]
      );
    }
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('MAWB DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete MAWB' }, { status: 500 });
  }
}
