import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Master AWB 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const shipmentId = searchParams.get('shipment_id');
    const awbNo = searchParams.get('awb_no');

    let whereClause = 'WHERE m.DEL_YN != "Y"';
    const params: (string | number)[] = [];

    if (status) {
      whereClause += ' AND m.STATUS_CD = ?';
      params.push(status);
    }
    if (shipmentId) {
      whereClause += ' AND m.SHIPMENT_ID = ?';
      params.push(parseInt(shipmentId));
    }
    if (awbNo) {
      whereClause += ' AND m.MAWB_NO LIKE ?';
      params.push(`%${awbNo}%`);
    }

    const [rows] = await queryWithLog<RowDataPacket[]>(`
      SELECT
        m.MAWB_ID as mawb_id,
        m.MAWB_NO as mawb_no,
        m.IMPORT_TYPE as import_type,
        m.SHIPMENT_ID as shipment_id,
        m.BOOKING_ID as booking_id,
        m.CARRIER_ID as carrier_id,
        m.AIRLINE_CODE as airline_code,
        m.FLIGHT_NO as flight_no,
        m.ORIGIN_AIRPORT_CD as origin_airport_cd,
        m.DEST_AIRPORT_CD as dest_airport_cd,
        DATE_FORMAT(m.ETD_DT, '%Y-%m-%d') as etd_dt,
        m.ETD_TIME as etd_time,
        DATE_FORMAT(m.ATD_DT, '%Y-%m-%d') as atd_dt,
        m.ATD_TIME as atd_time,
        DATE_FORMAT(m.ETA_DT, '%Y-%m-%d') as eta_dt,
        m.ETA_TIME as eta_time,
        DATE_FORMAT(m.ATA_DT, '%Y-%m-%d') as ata_dt,
        m.ATA_TIME as ata_time,
        DATE_FORMAT(m.ISSUE_DT, '%Y-%m-%d') as issue_dt,
        m.ISSUE_PLACE as issue_place,
        m.SHIPPER_NM as shipper_nm,
        m.SHIPPER_ADDR as shipper_addr,
        m.CONSIGNEE_NM as consignee_nm,
        m.CONSIGNEE_ADDR as consignee_addr,
        m.NOTIFY_PARTY as notify_party,
        m.PIECES as pieces,
        m.GROSS_WEIGHT_KG as gross_weight_kg,
        m.CHARGE_WEIGHT_KG as charge_weight_kg,
        m.VOLUME_CBM as volume_cbm,
        m.COMMODITY_DESC as commodity_desc,
        m.HS_CODE as hs_code,
        m.DIMENSIONS as dimensions,
        m.SPECIAL_HANDLING as special_handling,
        m.DECLARED_VALUE as declared_value,
        m.DECLARED_CURRENCY as declared_currency,
        m.INSURANCE_VALUE as insurance_value,
        m.FREIGHT_CHARGES as freight_charges,
        m.OTHER_CHARGES as other_charges,
        m.WEIGHT_CHARGE as weight_charge,
        m.VALUATION_CHARGE as valuation_charge,
        m.TAX_AMT as tax_amt,
        m.TOTAL_OTHER_AGENT as total_other_agent,
        m.TOTAL_OTHER_CARRIER as total_other_carrier,
        m.RATE_CLASS as rate_class,
        m.RATE as rate,
        m.PAYMENT_TERMS as payment_terms,
        m.MRN_NO as mrn_no,
        m.MSN as msn,
        m.AGENT_CODE as agent_code,
        m.AGENT_NAME as agent_name,
        m.CUSTOMS_STATUS as customs_status,
        DATE_FORMAT(m.CUSTOMS_CLEARANCE_DT, '%Y-%m-%d') as customs_clearance_dt,
        DATE_FORMAT(m.RELEASE_DT, '%Y-%m-%d') as release_dt,
        m.STATUS_CD as status_cd,
        m.REMARKS as remarks,
        DATE_FORMAT(m.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm,
        (SELECT COUNT(*) FROM AWB_HOUSE_AWB h WHERE h.MAWB_ID = m.MAWB_ID AND h.DEL_YN != 'Y') as hawb_count
      FROM AWB_MASTER_AWB m
      ${whereClause}
      ORDER BY m.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch Master AWBs' }, { status: 500 });
  }
}

// Master AWB 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 MAWB 번호 생성 (항공사코드-8자리 형식)
    const airlineCode = body.airline_code || '000';
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(MAWB_NO, LENGTH('${airlineCode}-') + 1) AS UNSIGNED)), 0) as max_seq FROM AWB_MASTER_AWB WHERE MAWB_NO LIKE ?`,
      [`${airlineCode}-%`]
    );
    const count = countResult[0].max_seq + 1;
    const mawbNo = `${airlineCode}-${String(count).padStart(8, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO AWB_MASTER_AWB (
        MAWB_NO, IMPORT_TYPE, SHIPMENT_ID, BOOKING_ID, CARRIER_ID, AIRLINE_CODE,
        FLIGHT_NO, ORIGIN_AIRPORT_CD, DEST_AIRPORT_CD,
        ETD_DT, ETD_TIME, ATD_DT, ATD_TIME, ETA_DT, ETA_TIME, ATA_DT, ATA_TIME,
        ISSUE_DT, ISSUE_PLACE,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        PIECES, GROSS_WEIGHT_KG, CHARGE_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, HS_CODE, DIMENSIONS, SPECIAL_HANDLING,
        DECLARED_VALUE, DECLARED_CURRENCY, INSURANCE_VALUE,
        FREIGHT_CHARGES, OTHER_CHARGES,
        WEIGHT_CHARGE, VALUATION_CHARGE, TAX_AMT, TOTAL_OTHER_AGENT, TOTAL_OTHER_CARRIER, RATE_CLASS, RATE,
        MRN_NO, MSN, AGENT_CODE, AGENT_NAME,
        PAYMENT_TERMS,
        CUSTOMS_STATUS, CUSTOMS_CLEARANCE_DT, RELEASE_DT,
        STATUS_CD, REMARKS, DEL_YN,
        CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?,
        'DRAFT', ?, 'N',
        'admin', NOW()
      )
    `, [
      mawbNo,
      body.import_type || 'EXPORT',
      body.shipment_id || null,
      body.booking_id || null,
      body.carrier_id || null,
      body.airline_code || null,
      body.flight_no || null,
      body.origin_airport_cd,
      body.dest_airport_cd,
      body.etd_dt || null,
      body.etd_time || null,
      body.atd_dt || null,
      body.atd_time || null,
      body.eta_dt || null,
      body.eta_time || null,
      body.ata_dt || null,
      body.ata_time || null,
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
      body.weight_charge || null,
      body.valuation_charge || null,
      body.tax_amt || null,
      body.total_other_agent || null,
      body.total_other_carrier || null,
      body.rate_class || null,
      body.rate || null,
      body.mrn_no || null,
      body.msn || null,
      body.agent_code || null,
      body.agent_name || null,
      body.payment_terms || 'PREPAID',
      body.customs_status || null,
      body.customs_clearance_dt || null,
      body.release_dt || null,
      body.remarks || null
    ]);

    return NextResponse.json({
      success: true,
      mawb_id: result.insertId,
      mawb_no: mawbNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create Master AWB' }, { status: 500 });
  }
}

// Master AWB 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mawb_id, ...updateData } = body;

    if (!mawb_id) {
      return NextResponse.json({ error: 'MAWB ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    const fieldMapping: Record<string, string> = {
      import_type: 'IMPORT_TYPE',
      carrier_id: 'CARRIER_ID',
      airline_code: 'AIRLINE_CODE',
      flight_no: 'FLIGHT_NO',
      origin_airport_cd: 'ORIGIN_AIRPORT_CD',
      dest_airport_cd: 'DEST_AIRPORT_CD',
      etd_dt: 'ETD_DT',
      etd_time: 'ETD_TIME',
      atd_dt: 'ATD_DT',
      atd_time: 'ATD_TIME',
      eta_dt: 'ETA_DT',
      eta_time: 'ETA_TIME',
      ata_dt: 'ATA_DT',
      ata_time: 'ATA_TIME',
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
      weight_charge: 'WEIGHT_CHARGE',
      valuation_charge: 'VALUATION_CHARGE',
      tax_amt: 'TAX_AMT',
      total_other_agent: 'TOTAL_OTHER_AGENT',
      total_other_carrier: 'TOTAL_OTHER_CARRIER',
      rate_class: 'RATE_CLASS',
      rate: 'RATE',
      mrn_no: 'MRN_NO',
      msn: 'MSN',
      agent_code: 'AGENT_CODE',
      agent_name: 'AGENT_NAME',
      payment_terms: 'PAYMENT_TERMS',
      customs_status: 'CUSTOMS_STATUS',
      customs_clearance_dt: 'CUSTOMS_CLEARANCE_DT',
      release_dt: 'RELEASE_DT',
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
    updateValues.push(mawb_id);

    await pool.query(`
      UPDATE AWB_MASTER_AWB
      SET ${updateFields.join(', ')}
      WHERE MAWB_ID = ?
    `, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update Master AWB' }, { status: 500 });
  }
}

// Master AWB 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mawbId = searchParams.get('id');

    if (!mawbId) {
      return NextResponse.json({ error: 'MAWB ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE AWB_MASTER_AWB
      SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE MAWB_ID = ?
    `, [mawbId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete Master AWB' }, { status: 500 });
  }
}
