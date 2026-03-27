import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// B/L + AWB 통합 검색 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // sea, air, all
    const keyword = searchParams.get('keyword') || '';
    const ioType = searchParams.get('ioType') || '';
    const shipperName = searchParams.get('shipperName') || '';
    const consigneeName = searchParams.get('consigneeName') || '';
    const vesselName = searchParams.get('vesselName') || '';
    const flightNo = searchParams.get('flightNo') || '';
    const polCd = searchParams.get('pol') || '';
    const podCd = searchParams.get('pod') || '';
    const obDateFrom = searchParams.get('obDateFrom') || '';
    const obDateTo = searchParams.get('obDateTo') || '';
    const arDateFrom = searchParams.get('arDateFrom') || '';
    const arDateTo = searchParams.get('arDateTo') || '';

    const results: RowDataPacket[] = [];

    // 해상 B/L 검색
    if (type === 'sea' || type === 'all') {
      const seaWhere: string[] = ["b.DEL_YN = 'N'"];
      const seaParams: string[] = [];

      if (keyword) {
        seaWhere.push("(b.M_BL_NO LIKE ? OR b.H_BL_NO LIKE ? OR b.JOB_NO LIKE ? OR b.SHIPPER_NM LIKE ? OR b.CONSIGNEE_NM LIKE ?)");
        const kw = `%${keyword}%`;
        seaParams.push(kw, kw, kw, kw, kw);
      }
      if (ioType) { seaWhere.push("b.IO_TYPE = ?"); seaParams.push(ioType); }
      if (shipperName) { seaWhere.push("b.SHIPPER_NM LIKE ?"); seaParams.push(`%${shipperName}%`); }
      if (consigneeName) { seaWhere.push("b.CONSIGNEE_NM LIKE ?"); seaParams.push(`%${consigneeName}%`); }
      if (vesselName) { seaWhere.push("b.VESSEL_NM LIKE ?"); seaParams.push(`%${vesselName}%`); }
      if (polCd) { seaWhere.push("b.POL_CD LIKE ?"); seaParams.push(`%${polCd}%`); }
      if (podCd) { seaWhere.push("b.POD_CD LIKE ?"); seaParams.push(`%${podCd}%`); }
      if (obDateFrom) { seaWhere.push("b.ETD_DT >= ?"); seaParams.push(obDateFrom); }
      if (obDateTo) { seaWhere.push("b.ETD_DT <= ?"); seaParams.push(obDateTo); }
      if (arDateFrom) { seaWhere.push("b.ETA_DT >= ?"); seaParams.push(arDateFrom); }
      if (arDateTo) { seaWhere.push("b.ETA_DT <= ?"); seaParams.push(arDateTo); }

      const seaSql = `
        SELECT
          'SEA' as docType,
          b.BL_ID as id,
          b.JOB_NO as jobNo,
          b.M_BL_NO as mblNo,
          b.H_BL_NO as hblNo,
          b.IO_TYPE as ioType,
          b.SHIPPER_NM as shipperName,
          b.CONSIGNEE_NM as consigneeName,
          b.VESSEL_NM as vesselName,
          b.VOYAGE_NO as voyageNo,
          '' as flightNo,
          b.POL_CD as pol,
          b.POD_CD as pod,
          b.PACKAGE_QTY as packages,
          b.PACKAGE_UNIT as packageUnit,
          b.GROSS_WEIGHT_KG as weight,
          b.MEASUREMENT_CBM as cbm,
          b.CONTAINER_TYPE as containerType,
          b.LC_NO as lcNo,
          b.PO_NO as poNo,
          DATE_FORMAT(b.ETD_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(b.ETA_DT, '%Y-%m-%d') as eta,
          b.STATUS_CD as status
        FROM ORD_OCEAN_BL b
        WHERE ${seaWhere.join(' AND ')}
        ORDER BY b.CREATED_DTM DESC
        LIMIT 100
      `;
      const [seaRows] = await pool.query<RowDataPacket[]>(seaSql, seaParams);
      results.push(...seaRows);
    }

    // 항공 AWB 검색
    if (type === 'air' || type === 'all') {
      const airWhere: string[] = ["a.DEL_YN = 'N'"];
      const airParams: string[] = [];

      if (keyword) {
        airWhere.push("(a.M_AWB_NO LIKE ? OR a.H_AWB_NO LIKE ? OR a.JOB_NO LIKE ? OR a.SHIPPER_NM LIKE ? OR a.CONSIGNEE_NM LIKE ?)");
        const kw = `%${keyword}%`;
        airParams.push(kw, kw, kw, kw, kw);
      }
      if (ioType) { airWhere.push("a.IO_TYPE = ?"); airParams.push(ioType); }
      if (shipperName) { airWhere.push("a.SHIPPER_NM LIKE ?"); airParams.push(`%${shipperName}%`); }
      if (consigneeName) { airWhere.push("a.CONSIGNEE_NM LIKE ?"); airParams.push(`%${consigneeName}%`); }
      if (flightNo) { airWhere.push("a.FLIGHT_NO LIKE ?"); airParams.push(`%${flightNo}%`); }
      if (polCd) { airWhere.push("a.DEPARTURE_CD LIKE ?"); airParams.push(`%${polCd}%`); }
      if (podCd) { airWhere.push("a.ARRIVAL_CD LIKE ?"); airParams.push(`%${podCd}%`); }
      if (obDateFrom) { airWhere.push("a.DEPARTURE_DT >= ?"); airParams.push(obDateFrom); }
      if (obDateTo) { airWhere.push("a.DEPARTURE_DT <= ?"); airParams.push(obDateTo); }
      if (arDateFrom) { airWhere.push("a.ARRIVAL_DT >= ?"); airParams.push(arDateFrom); }
      if (arDateTo) { airWhere.push("a.ARRIVAL_DT <= ?"); airParams.push(arDateTo); }

      const airSql = `
        SELECT
          'AIR' as docType,
          a.AWB_ID as id,
          a.JOB_NO as jobNo,
          a.M_AWB_NO as mblNo,
          a.H_AWB_NO as hblNo,
          a.IO_TYPE as ioType,
          a.SHIPPER_NM as shipperName,
          a.CONSIGNEE_NM as consigneeName,
          '' as vesselName,
          '' as voyageNo,
          a.FLIGHT_NO as flightNo,
          a.DEPARTURE_CD as pol,
          a.ARRIVAL_CD as pod,
          a.PIECES_QTY as packages,
          'PCS' as packageUnit,
          a.GROSS_WEIGHT_KG as weight,
          0 as cbm,
          '' as containerType,
          a.LC_NO as lcNo,
          a.PO_NO as poNo,
          DATE_FORMAT(a.DEPARTURE_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(a.ARRIVAL_DT, '%Y-%m-%d') as eta,
          a.STATUS_CD as status
        FROM ORD_AIR_AWB a
        WHERE ${airWhere.join(' AND ')}
        ORDER BY a.CREATED_DTM DESC
        LIMIT 100
      `;
      const [airRows] = await pool.query<RowDataPacket[]>(airSql, airParams);
      results.push(...airRows);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('BL/AWB search error:', error);
    return NextResponse.json({ error: 'Failed to search B/L(AWB)' }, { status: 500 });
  }
}
