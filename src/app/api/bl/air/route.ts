import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 항공 AWB 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awbId = searchParams.get('awbId');

    // 단건 조회
    if (awbId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          a.AWB_ID as id,
          a.JOB_NO as jobNo,
          a.BOOKING_NO as bookingNo,
          a.M_AWB_NO as mawbNo,
          a.H_AWB_NO as hawbNo,
          a.IO_TYPE as ioType,
          a.STATUS_CD as status,
          a.SHIPPER_CD as shipperCode,
          a.SHIPPER_NM as shipperName,
          a.SHIPPER_ADDR as shipperAddress,
          a.CONSIGNEE_CD as consigneeCode,
          a.CONSIGNEE_NM as consigneeName,
          a.CONSIGNEE_ADDR as consigneeAddress,
          a.NOTIFY_CD as notifyCode,
          a.NOTIFY_NM as notifyName,
          a.NOTIFY_ADDR as notifyAddress,
          a.DEPARTURE_CD as departure,
          a.ARRIVAL_CD as arrival,
          a.FLIGHT_NO as flightNo,
          DATE_FORMAT(a.DEPARTURE_DT, '%Y-%m-%d') as departureDate,
          DATE_FORMAT(a.ARRIVAL_DT, '%Y-%m-%d') as arrivalDate,
          a.WT_VAL as wtVal,
          a.OTHER_CHGS as otherChgs,
          a.CURRENCY_CD as currencyCode,
          a.PIECES_QTY as piecesQty,
          a.GROSS_WEIGHT_KG as grossWeight,
          a.CHARGEABLE_WEIGHT as chargeableWeight,
          a.AGENT_CD as agentCode,
          a.AGENT_NM as agentName,
          a.PARTNER_CD as partnerCode,
          a.PARTNER_NM as partnerName,
          a.LC_NO as lcNo,
          a.PO_NO as poNo,
          DATE_FORMAT(a.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt,
          DATE_FORMAT(a.UPDATED_DTM, '%Y-%m-%d %H:%i:%s') as updatedAt
        FROM ORD_AIR_AWB a
        WHERE a.AWB_ID = ? AND a.DEL_YN = 'N'
      `, [awbId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'AWB not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    // 목록 조회
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        a.AWB_ID as id,
        DATE_FORMAT(a.DEPARTURE_DT, '%Y-%m-%d') as obDate,
        DATE_FORMAT(a.ARRIVAL_DT, '%Y-%m-%d') as arDate,
        a.JOB_NO as jobNo,
        a.M_AWB_NO as mawbNo,
        a.H_AWB_NO as hawbNo,
        a.LC_NO as lcNo,
        a.PO_NO as poNo,
        'ORI' as type,
        'D' as dc,
        'L' as ln,
        CASE WHEN a.WT_VAL = 'P' THEN 'P' ELSE 'C' END as pc,
        '' as inco,
        a.SHIPPER_NM as shipperName,
        a.CONSIGNEE_NM as consigneeName,
        a.DEPARTURE_CD as departure,
        a.ARRIVAL_CD as arrival,
        a.FLIGHT_NO as flightNo,
        a.IO_TYPE as ioType,
        a.STATUS_CD as status
      FROM ORD_AIR_AWB a
      WHERE a.DEL_YN = 'N'
      ORDER BY a.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch AWB data' }, { status: 500 });
  }
}

// 항공 AWB 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { main, cargo, other } = body;

    // 새 JOB NO 생성
    const year = new Date().getFullYear();
    const prefix = main.ioType === 'OUT' ? 'AEX' : 'AIM';
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, LENGTH('${prefix}-${year}-') + 1) AS UNSIGNED)), 0) as max_seq FROM ORD_AIR_AWB WHERE JOB_NO LIKE ?`,
      [`${prefix}-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const jobNo = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO ORD_AIR_AWB (
        JOB_NO, BOOKING_NO, M_AWB_NO, H_AWB_NO,
        IO_TYPE, STATUS_CD,
        SHIPPER_CD, SHIPPER_NM, SHIPPER_ADDR,
        CONSIGNEE_CD, CONSIGNEE_NM, CONSIGNEE_ADDR,
        NOTIFY_CD, NOTIFY_NM, NOTIFY_ADDR,
        DEPARTURE_CD, ARRIVAL_CD, FLIGHT_NO,
        DEPARTURE_DT, ARRIVAL_DT,
        WT_VAL, OTHER_CHGS, CURRENCY_CD,
        PIECES_QTY, GROSS_WEIGHT_KG, CHARGEABLE_WEIGHT,
        AGENT_CD, AGENT_NM, PARTNER_CD, PARTNER_NM,
        LC_NO, PO_NO,
        CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      jobNo,
      main.bookingNo || null,
      main.mawbNo || '',
      main.hawbNo || '',
      main.ioType || 'OUT',
      'DRAFT',
      main.shipperCode || null,
      main.shipperName || '',
      main.shipperAddress || '',
      main.consigneeCode || null,
      main.consigneeName || '',
      main.consigneeAddress || '',
      main.notifyCode || null,
      main.notifyName || '',
      main.notifyAddress || '',
      main.departure || '',
      main.arrival || '',
      main.flightNo || '',
      main.departureDate || null,
      main.arrivalDate || null,
      main.wtVal || 'P',
      main.otherChgs || 'P',
      main.currencyCode || 'USD',
      cargo.piecesQty || 0,
      cargo.grossWeight || 0,
      cargo.chargeableWeight || 0,
      other.agentCode || null,
      other.agentName || '',
      other.partnerCode || null,
      other.partnerName || '',
      other.lcNo || '',
      other.poNo || ''
    ]);

    return NextResponse.json({
      success: true,
      awbId: result.insertId,
      jobNo: jobNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create AWB' }, { status: 500 });
  }
}

// 항공 AWB 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, main, cargo, other } = body;

    if (!id) {
      return NextResponse.json({ error: 'AWB ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE ORD_AIR_AWB SET
        BOOKING_NO = ?,
        M_AWB_NO = ?,
        H_AWB_NO = ?,
        IO_TYPE = ?,
        SHIPPER_CD = ?,
        SHIPPER_NM = ?,
        SHIPPER_ADDR = ?,
        CONSIGNEE_CD = ?,
        CONSIGNEE_NM = ?,
        CONSIGNEE_ADDR = ?,
        NOTIFY_CD = ?,
        NOTIFY_NM = ?,
        NOTIFY_ADDR = ?,
        DEPARTURE_CD = ?,
        ARRIVAL_CD = ?,
        FLIGHT_NO = ?,
        DEPARTURE_DT = ?,
        ARRIVAL_DT = ?,
        WT_VAL = ?,
        OTHER_CHGS = ?,
        CURRENCY_CD = ?,
        PIECES_QTY = ?,
        GROSS_WEIGHT_KG = ?,
        CHARGEABLE_WEIGHT = ?,
        AGENT_CD = ?,
        AGENT_NM = ?,
        PARTNER_CD = ?,
        PARTNER_NM = ?,
        LC_NO = ?,
        PO_NO = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE AWB_ID = ?
    `, [
      main.bookingNo || null,
      main.mawbNo || '',
      main.hawbNo || '',
      main.ioType || 'OUT',
      main.shipperCode || null,
      main.shipperName || '',
      main.shipperAddress || '',
      main.consigneeCode || null,
      main.consigneeName || '',
      main.consigneeAddress || '',
      main.notifyCode || null,
      main.notifyName || '',
      main.notifyAddress || '',
      main.departure || '',
      main.arrival || '',
      main.flightNo || '',
      main.departureDate || null,
      main.arrivalDate || null,
      main.wtVal || 'P',
      main.otherChgs || 'P',
      main.currencyCode || 'USD',
      cargo.piecesQty || 0,
      cargo.grossWeight || 0,
      cargo.chargeableWeight || 0,
      other.agentCode || null,
      other.agentName || '',
      other.partnerCode || null,
      other.partnerName || '',
      other.lcNo || '',
      other.poNo || '',
      id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update AWB' }, { status: 500 });
  }
}

// 항공 AWB 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'AWB IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `UPDATE ORD_AIR_AWB SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE AWB_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete AWB' }, { status: 500 });
  }
}
