import { NextRequest, NextResponse } from 'next/server';
import { queryWithLog } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Master AWB 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mawbId = parseInt(id);

    if (isNaN(mawbId)) {
      return NextResponse.json({ error: 'Invalid MAWB ID' }, { status: 400 });
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
        DATE_FORMAT(m.UPDATED_DTM, '%Y-%m-%d %H:%i') as updated_dtm,
        (SELECT COUNT(*) FROM AWB_HOUSE_AWB h WHERE h.MAWB_ID = m.MAWB_ID AND h.DEL_YN != 'Y') as hawb_count
      FROM AWB_MASTER_AWB m
      WHERE m.MAWB_ID = ? AND m.DEL_YN != 'Y'
    `, [mawbId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'MAWB not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch MAWB detail' }, { status: 500 });
  }
}
