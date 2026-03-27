import { NextRequest, NextResponse } from 'next/server';
import { queryWithLog } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// MySQL decimal 타입은 문자열로 반환되므로 숫자로 변환
function toNum(val: unknown): number {
  if (val == null) return 0;
  const n = typeof val === 'string' ? parseFloat(val) : Number(val);
  return isNaN(n) ? 0 : n;
}
function toNumOrUndef(val: unknown): number | undefined {
  if (val == null) return undefined;
  const n = typeof val === 'string' ? parseFloat(val) : Number(val);
  return isNaN(n) ? undefined : n;
}

// AWB 출력용 데이터 조회 API
// GET /api/awb/print?type=mawb&id=1 또는 type=hawb&id=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'mawb' or 'hawb'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    if (type === 'mawb') {
      const [rows] = await queryWithLog<RowDataPacket[]>(`
        SELECT
          m.MAWB_ID as mawb_id,
          m.MAWB_NO as mawb_no,
          m.CARRIER_ID as carrier_id,
          cr.CARRIER_NM as carrier_name,
          m.AIRLINE_CODE as airline_code,
          m.FLIGHT_NO as flight_no,
          m.ORIGIN_AIRPORT_CD as origin_airport_cd,
          m.DEST_AIRPORT_CD as dest_airport_cd,
          orig.PORT_NM as origin_airport_name,
          dest.PORT_NM as dest_airport_name,
          DATE_FORMAT(m.ETD_DT, '%Y-%m-%d') as etd_dt,
          m.ETD_TIME as etd_time,
          DATE_FORMAT(m.ETA_DT, '%Y-%m-%d') as eta_dt,
          m.ETA_TIME as eta_time,
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
          m.AGENT_CODE as agent_code,
          m.AGENT_NAME as agent_name,
          m.STATUS_CD as status_cd,
          m.REMARKS as remarks
        FROM AWB_MASTER_AWB m
        LEFT JOIN MST_CARRIER cr ON m.CARRIER_ID = cr.CARRIER_ID
        LEFT JOIN MST_PORT orig ON m.ORIGIN_AIRPORT_CD = orig.PORT_CD
        LEFT JOIN MST_PORT dest ON m.DEST_AIRPORT_CD = dest.PORT_CD
        WHERE m.MAWB_ID = ? AND (m.DEL_YN IS NULL OR m.DEL_YN != 'Y')
      `, [parseInt(id)]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'MAWB not found' }, { status: 404 });
      }

      const row = rows[0];
      const isPrepaid = row.payment_terms !== 'COLLECT';

      const printData = {
        hawbNo: '',
        mawbNo: row.mawb_no || '',
        awbDate: row.issue_dt || row.etd_dt || '',
        shipper: row.shipper_nm || '',
        shipperAddress: row.shipper_addr || '',
        consignee: row.consignee_nm || '',
        consigneeAddress: row.consignee_addr || '',
        carrier: row.carrier_name || row.airline_code || '',
        carrierCode: row.airline_code || '',
        origin: row.origin_airport_cd || '',
        destination: row.dest_airport_cd || '',
        routingTo1: row.dest_airport_cd || '',
        routingBy1: row.carrier_name || row.airline_code || '',
        flightNo: row.flight_no || '',
        flightDate: row.etd_dt || '',
        pieces: row.pieces || 0,
        weightUnit: 'K' as const,
        grossWeight: toNum(row.gross_weight_kg),
        chargeableWeight: toNumOrUndef(row.charge_weight_kg),
        rateClass: row.rate_class || undefined,
        rate: toNumOrUndef(row.rate),
        totalCharge: toNumOrUndef(row.freight_charges),
        natureOfGoods: row.commodity_desc || 'CONSOLIDATION CARGO',
        dimensions: row.dimensions || undefined,
        volumeWeight: row.volume_cbm ? Math.round(toNum(row.volume_cbm) * 166.67 * 100) / 100 : undefined,
        currency: row.declared_currency || 'USD',
        declaredValueCarriage: row.declared_value ? String(row.declared_value) : 'NVD',
        declaredValueCustoms: row.declared_value ? String(row.declared_value) : 'NCV',
        insuranceAmount: row.insurance_value ? String(row.insurance_value) : 'NIL',
        weightChargePrepaid: isPrepaid ? toNumOrUndef(row.weight_charge ?? row.freight_charges) : undefined,
        weightChargeCollect: !isPrepaid ? toNumOrUndef(row.weight_charge ?? row.freight_charges) : undefined,
        valuationChargePrepaid: isPrepaid ? toNumOrUndef(row.valuation_charge) : undefined,
        valuationChargeCollect: !isPrepaid ? toNumOrUndef(row.valuation_charge) : undefined,
        taxPrepaid: isPrepaid ? toNumOrUndef(row.tax_amt) : undefined,
        taxCollect: !isPrepaid ? toNumOrUndef(row.tax_amt) : undefined,
        otherChargesDueAgentPrepaid: isPrepaid ? toNumOrUndef(row.total_other_agent) : undefined,
        otherChargesDueAgentCollect: !isPrepaid ? toNumOrUndef(row.total_other_agent) : undefined,
        otherChargesDueCarrierPrepaid: isPrepaid ? toNumOrUndef(row.total_other_carrier) : undefined,
        otherChargesDueCarrierCollect: !isPrepaid ? toNumOrUndef(row.total_other_carrier) : undefined,
        totalPrepaid: isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        totalCollect: !isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        handlingInfo: row.special_handling || '',
        agentName: row.agent_name || undefined,
        agentIataCode: row.agent_code || undefined,
        executedOn: row.issue_dt || row.etd_dt || '',
        executedAt: row.issue_place || 'SEOUL, KOREA',
        issuerName: 'INTERGIS LOGISTICS CO., LTD.',
        notifyParty: row.notify_party || undefined,
        remarks: row.remarks || undefined,
      };

      return NextResponse.json({ success: true, data: printData });
    }

    if (type === 'hawb') {
      const [rows] = await queryWithLog<RowDataPacket[]>(`
        SELECT
          h.HAWB_ID as hawb_id,
          h.HAWB_NO as hawb_no,
          h.MAWB_ID as mawb_id,
          m.MAWB_NO as mawb_no,
          h.CUSTOMER_ID as customer_id,
          c.CUSTOMER_NM as customer_name,
          h.CARRIER_ID as carrier_id,
          COALESCE(cr.CARRIER_NM, mcr.CARRIER_NM) as carrier_name,
          COALESCE(h.AIRLINE_CODE, m.AIRLINE_CODE) as airline_code,
          COALESCE(h.FLIGHT_NO, m.FLIGHT_NO) as flight_no,
          h.ORIGIN_AIRPORT_CD as origin_airport_cd,
          h.DEST_AIRPORT_CD as dest_airport_cd,
          orig.PORT_NM as origin_airport_name,
          dest.PORT_NM as dest_airport_name,
          DATE_FORMAT(COALESCE(h.ETD_DT, m.ETD_DT), '%Y-%m-%d') as etd_dt,
          COALESCE(h.ETD_TIME, m.ETD_TIME) as etd_time,
          DATE_FORMAT(COALESCE(h.ETA_DT, m.ETA_DT), '%Y-%m-%d') as eta_dt,
          COALESCE(h.ETA_TIME, m.ETA_TIME) as eta_time,
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
          h.DIMENSIONS as dimensions,
          h.SPECIAL_HANDLING as special_handling,
          h.DECLARED_VALUE as declared_value,
          h.DECLARED_CURRENCY as declared_currency,
          h.INSURANCE_VALUE as insurance_value,
          h.FREIGHT_CHARGES as freight_charges,
          h.OTHER_CHARGES as other_charges,
          h.PAYMENT_TERMS as payment_terms,
          h.STATUS_CD as status_cd,
          h.REMARKS as remarks
        FROM AWB_HOUSE_AWB h
        LEFT JOIN AWB_MASTER_AWB m ON h.MAWB_ID = m.MAWB_ID
        LEFT JOIN MST_CUSTOMER c ON h.CUSTOMER_ID = c.CUSTOMER_ID
        LEFT JOIN MST_CARRIER cr ON h.CARRIER_ID = cr.CARRIER_ID
        LEFT JOIN MST_CARRIER mcr ON m.CARRIER_ID = mcr.CARRIER_ID
        LEFT JOIN MST_PORT orig ON h.ORIGIN_AIRPORT_CD = orig.PORT_CD
        LEFT JOIN MST_PORT dest ON h.DEST_AIRPORT_CD = dest.PORT_CD
        WHERE h.HAWB_ID = ? AND (h.DEL_YN IS NULL OR h.DEL_YN != 'Y')
      `, [parseInt(id)]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'HAWB not found' }, { status: 404 });
      }

      const row = rows[0];
      const isPrepaid = row.payment_terms !== 'COLLECT';

      const printData = {
        hawbNo: row.hawb_no || '',
        mawbNo: row.mawb_no || '',
        awbDate: row.issue_dt || row.etd_dt || '',
        shipper: row.shipper_nm || '',
        shipperAddress: row.shipper_addr || '',
        consignee: row.consignee_nm || '',
        consigneeAddress: row.consignee_addr || '',
        carrier: row.carrier_name || row.airline_code || '',
        carrierCode: row.airline_code || '',
        origin: row.origin_airport_cd || '',
        destination: row.dest_airport_cd || '',
        routingTo1: row.dest_airport_cd || '',
        routingBy1: row.carrier_name || row.airline_code || '',
        flightNo: row.flight_no || '',
        flightDate: row.etd_dt || '',
        pieces: row.pieces || 0,
        weightUnit: 'K' as const,
        grossWeight: toNum(row.gross_weight_kg),
        chargeableWeight: toNumOrUndef(row.charge_weight_kg),
        totalCharge: toNumOrUndef(row.freight_charges),
        natureOfGoods: row.commodity_desc || 'CONSOLIDATION CARGO',
        dimensions: row.dimensions || undefined,
        volumeWeight: row.volume_cbm ? Math.round(toNum(row.volume_cbm) * 166.67 * 100) / 100 : undefined,
        currency: row.declared_currency || 'USD',
        declaredValueCarriage: row.declared_value ? String(row.declared_value) : 'NVD',
        declaredValueCustoms: row.declared_value ? String(row.declared_value) : 'NCV',
        insuranceAmount: row.insurance_value ? String(row.insurance_value) : 'NIL',
        weightChargePrepaid: isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        weightChargeCollect: !isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        totalPrepaid: isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        totalCollect: !isPrepaid ? toNumOrUndef(row.freight_charges) : undefined,
        handlingInfo: row.special_handling || '',
        executedOn: row.issue_dt || row.etd_dt || '',
        executedAt: row.issue_place || 'SEOUL, KOREA',
        issuerName: 'INTERGIS LOGISTICS CO., LTD.',
        notifyParty: row.notify_party || undefined,
        remarks: row.remarks || undefined,
      };

      return NextResponse.json({ success: true, data: printData });
    }

    return NextResponse.json({ error: 'Invalid type. Use "mawb" or "hawb"' }, { status: 400 });
  } catch (error) {
    console.error('Print data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch print data' }, { status: 500 });
  }
}
