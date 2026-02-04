import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// House AWB 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const shipmentId = searchParams.get('shipment_id');
    const mawbId = searchParams.get('mawb_id');
    const awbNo = searchParams.get('awb_no');

    let whereClause = 'WHERE h.DEL_YN != "Y"';
    const params: (string | number)[] = [];

    if (status) {
      whereClause += ' AND h.STATUS_CD = ?';
      params.push(status);
    }
    if (shipmentId) {
      whereClause += ' AND h.SHIPMENT_ID = ?';
      params.push(parseInt(shipmentId));
    }
    if (mawbId) {
      whereClause += ' AND h.MAWB_ID = ?';
      params.push(parseInt(mawbId));
    }
    if (awbNo) {
      whereClause += ' AND h.HAWB_NO LIKE ?';
      params.push(`%${awbNo}%`);
    }

    const [rows] = await queryWithLog<RowDataPacket[]>(`
      SELECT
        h.HAWB_ID as hawb_id,
        h.HAWB_NO as hawb_no,
        h.SHIPMENT_ID as shipment_id,
        h.MAWB_ID as mawb_id,
        m.MAWB_NO as mawb_no,
        h.CUSTOMER_ID as customer_id,
        c.CUSTOMER_NM as customer_name,
        h.CARRIER_ID as carrier_id,
        cr.CARRIER_NM as carrier_name,
        h.AIRLINE_CODE as airline_code,
        h.FLIGHT_NO as flight_no,
        h.ORIGIN_AIRPORT_CD as origin_airport_cd,
        h.DEST_AIRPORT_CD as dest_airport_cd,
        orig.PORT_NM as origin_airport_name,
        dest.PORT_NM as dest_airport_name,
        DATE_FORMAT(h.ETD_DT, '%Y-%m-%d') as etd_dt,
        h.ETD_TIME as etd_time,
        DATE_FORMAT(h.ATD_DT, '%Y-%m-%d') as atd_dt,
        DATE_FORMAT(h.ETA_DT, '%Y-%m-%d') as eta_dt,
        h.ETA_TIME as eta_time,
        DATE_FORMAT(h.ATA_DT, '%Y-%m-%d') as ata_dt,
        DATE_FORMAT(h.ISSUE_DT, '%Y-%m-%d') as issue_dt,
        h.ISSUE_PLACE as issue_place,
        h.SHIPPER_NM as shipper_nm,
        h.SHIPPER_ADDR as shipper_addr,
        h.CONSIGNEE_NM as consignee_nm,
        h.CONSIGNEE_ADDR as consignee_addr,
        h.NOTIFY_PARTY as notify_party,
        h.PIECES as pieces,
        h.GROSS_WEIGHT_KG as gross_weight_kg,
        h.CHARGE_WEIGHT_KG as charge_weight_kg,
        h.VOLUME_CBM as volume_cbm,
        h.COMMODITY_DESC as commodity_desc,
        h.HS_CODE as hs_code,
        h.DIMENSIONS as dimensions,
        h.SPECIAL_HANDLING as special_handling,
        h.DECLARED_VALUE as declared_value,
        h.DECLARED_CURRENCY as declared_currency,
        h.INSURANCE_VALUE as insurance_value,
        h.FREIGHT_CHARGES as freight_charges,
        h.OTHER_CHARGES as other_charges,
        h.PAYMENT_TERMS as payment_terms,
        h.STATUS_CD as status_cd,
        h.REMARKS as remarks,
        DATE_FORMAT(h.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm
      FROM AWB_HOUSE_AWB h
      LEFT JOIN AWB_MASTER_AWB m ON h.MAWB_ID = m.MAWB_ID
      LEFT JOIN MST_CUSTOMER c ON h.CUSTOMER_ID = c.CUSTOMER_ID
      LEFT JOIN MST_CARRIER cr ON h.CARRIER_ID = cr.CARRIER_ID
      LEFT JOIN MST_PORT orig ON h.ORIGIN_AIRPORT_CD = orig.PORT_CD
      LEFT JOIN MST_PORT dest ON h.DEST_AIRPORT_CD = dest.PORT_CD
      ${whereClause}
      ORDER BY h.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch House AWBs' }, { status: 500 });
  }
}

// House AWB 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 HAWB 번호 생성
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(HAWB_NO, LENGTH('HAWB${year}') + 1) AS UNSIGNED)), 0) as max_seq FROM AWB_HOUSE_AWB WHERE HAWB_NO LIKE ?`,
      [`HAWB${year}%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const hawbNo = `HAWB${year}${String(count).padStart(5, '0')}`;

    // customerId 결정
    let customerId = body.customer_id;
    if (!customerId) {
      const [customers] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1`);
      customerId = customers.length > 0 ? customers[0].CUSTOMER_ID : 1;
    }

    // shipmentId가 없으면 자동 생성
    let shipmentId = body.shipment_id;
    if (!shipmentId) {
      const [shipResult] = await pool.query<ResultSetHeader>(`
        INSERT INTO ORD_SHIPMENT (SHIPMENT_NO, TRANSPORT_MODE_CD, TRADE_TYPE_CD, CUSTOMER_ID, STATUS_CD, CREATED_BY, CREATED_DTM, DEL_YN)
        VALUES (?, 'AIR', 'EXPORT', ?, 'PENDING', 'admin', NOW(), 'N')
      `, [`SHP${Date.now()}`, customerId]);
      shipmentId = shipResult.insertId;
    }

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO AWB_HOUSE_AWB (
        HAWB_NO, SHIPMENT_ID, MAWB_ID, CUSTOMER_ID, CARRIER_ID, AIRLINE_CODE,
        FLIGHT_NO, ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD,
        ETD_DT, ETD_TIME, ETA_DT, ETA_TIME, ISSUE_DT, ISSUE_PLACE,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        PIECES, GROSS_WEIGHT_KG, CHARGE_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, HS_CODE, DIMENSIONS, SPECIAL_HANDLING,
        DECLARED_VALUE, DECLARED_CURRENCY, INSURANCE_VALUE,
        FREIGHT_CHARGES, OTHER_CHARGES, PAYMENT_TERMS,
        STATUS_CD, REMARKS, DEL_YN,
        CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        'DRAFT', ?, 'N',
        'admin', NOW()
      )
    `, [
      hawbNo,
      shipmentId,
      body.mawb_id || null,
      customerId,
      body.carrier_id || null,
      body.airline_code || null,
      body.flight_no || null,
      body.origin_airport_cd,
      body.dest_airport_cd,
      body.etd_dt || null,
      body.etd_time || null,
      body.eta_dt || null,
      body.eta_time || null,
      body.issue_dt || null,
      body.issue_place || null,
      body.shipper_nm || null,
      body.shipper_addr || null,
      body.consignee_nm || null,
      body.consignee_addr || null,
      body.notify_party || null,
      body.pieces || null,
      body.gross_weight_kg || null,
      body.charge_weight_kg || null,
      body.volume_cbm || null,
      body.commodity_desc || null,
      body.hs_code || null,
      body.dimensions || null,
      body.special_handling || null,
      body.declared_value || null,
      body.declared_currency || 'USD',
      body.insurance_value || null,
      body.freight_charges || null,
      body.other_charges || null,
      body.payment_terms || 'PREPAID',
      body.remarks || null
    ]);

    return NextResponse.json({
      success: true,
      hawb_id: result.insertId,
      hawb_no: hawbNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create House AWB' }, { status: 500 });
  }
}

// House AWB 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { hawb_id, ...updateData } = body;

    if (!hawb_id) {
      return NextResponse.json({ error: 'HAWB ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    const fieldMapping: Record<string, string> = {
      mawb_id: 'MAWB_ID',
      customer_id: 'CUSTOMER_ID',
      carrier_id: 'CARRIER_ID',
      airline_code: 'AIRLINE_CODE',
      flight_no: 'FLIGHT_NO',
      origin_airport_cd: 'ORIGIN_AIRPORT_CD',
      dest_airport_cd: 'DEST_AIRPORT_CD',
      etd_dt: 'ETD_DT',
      etd_time: 'ETD_TIME',
      eta_dt: 'ETA_DT',
      eta_time: 'ETA_TIME',
      issue_dt: 'ISSUE_DT',
      issue_place: 'ISSUE_PLACE',
      shipper_nm: 'SHIPPER_NM',
      shipper_addr: 'SHIPPER_ADDR',
      consignee_nm: 'CONSIGNEE_NM',
      consignee_addr: 'CONSIGNEE_ADDR',
      notify_party: 'NOTIFY_PARTY',
      pieces: 'PIECES',
      gross_weight_kg: 'GROSS_WEIGHT_KG',
      charge_weight_kg: 'CHARGE_WEIGHT_KG',
      volume_cbm: 'VOLUME_CBM',
      commodity_desc: 'COMMODITY_DESC',
      hs_code: 'HS_CODE',
      dimensions: 'DIMENSIONS',
      special_handling: 'SPECIAL_HANDLING',
      declared_value: 'DECLARED_VALUE',
      declared_currency: 'DECLARED_CURRENCY',
      insurance_value: 'INSURANCE_VALUE',
      freight_charges: 'FREIGHT_CHARGES',
      other_charges: 'OTHER_CHARGES',
      payment_terms: 'PAYMENT_TERMS',
      status_cd: 'STATUS_CD',
      remarks: 'REMARKS',
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
    updateValues.push(hawb_id);

    await pool.query(`
      UPDATE AWB_HOUSE_AWB
      SET ${updateFields.join(', ')}
      WHERE HAWB_ID = ?
    `, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update House AWB' }, { status: 500 });
  }
}

// House AWB 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hawbId = searchParams.get('id');

    if (!hawbId) {
      return NextResponse.json({ error: 'HAWB ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE AWB_HOUSE_AWB
      SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE HAWB_ID = ?
    `, [hawbId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete House AWB' }, { status: 500 });
  }
}
