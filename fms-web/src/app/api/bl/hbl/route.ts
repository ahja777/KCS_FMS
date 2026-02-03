import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// House B/L 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const shipmentId = searchParams.get('shipment_id');

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

    const [rows] = await queryWithLog<RowDataPacket[]>(`
      SELECT
        h.HBL_ID as hbl_id,
        h.HBL_NO as hbl_no,
        h.SHIPMENT_ID as shipment_id,
        h.MBL_ID as mbl_id,
        m.MBL_NO as mbl_no,
        h.CUSTOMER_ID as customer_id,
        c.CUSTOMER_NM as customer_name,
        h.CARRIER_ID as carrier_id,
        cr.CARRIER_NM as carrier_name,
        h.VESSEL_NM as vessel_nm,
        h.VOYAGE_NO as voyage_no,
        h.POL_PORT_CD as pol_port_cd,
        h.POD_PORT_CD as pod_port_cd,
        pol.PORT_NM as pol_port_name,
        pod.PORT_NM as pod_port_name,
        h.PLACE_OF_RECEIPT as place_of_receipt,
        h.PLACE_OF_DELIVERY as place_of_delivery,
        h.FINAL_DEST as final_dest,
        DATE_FORMAT(h.ETD_DT, '%Y-%m-%d') as etd_dt,
        DATE_FORMAT(h.ATD_DT, '%Y-%m-%d') as atd_dt,
        DATE_FORMAT(h.ETA_DT, '%Y-%m-%d') as eta_dt,
        DATE_FORMAT(h.ATA_DT, '%Y-%m-%d') as ata_dt,
        DATE_FORMAT(h.ON_BOARD_DT, '%Y-%m-%d') as on_board_dt,
        DATE_FORMAT(h.ISSUE_DT, '%Y-%m-%d') as issue_dt,
        h.ISSUE_PLACE as issue_place,
        h.SHIPPER_NM as shipper_nm,
        h.SHIPPER_ADDR as shipper_addr,
        h.CONSIGNEE_NM as consignee_nm,
        h.CONSIGNEE_ADDR as consignee_addr,
        h.NOTIFY_PARTY as notify_party,
        h.TOTAL_PKG_QTY as total_pkg_qty,
        h.PKG_TYPE_CD as pkg_type_cd,
        h.GROSS_WEIGHT_KG as gross_weight_kg,
        h.VOLUME_CBM as volume_cbm,
        h.COMMODITY_DESC as commodity_desc,
        h.HS_CODE as hs_code,
        h.MARKS_NOS as marks_nos,
        h.FREIGHT_TERM_CD as freight_term_cd,
        h.BL_TYPE_CD as bl_type_cd,
        h.ORIGINAL_BL_COUNT as original_bl_count,
        h.STATUS_CD as status_cd,
        h.PRINT_YN as print_yn,
        h.SURRENDER_YN as surrender_yn,
        DATE_FORMAT(h.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm
      FROM BL_HOUSE_BL h
      LEFT JOIN BL_MASTER_BL m ON h.MBL_ID = m.MBL_ID
      LEFT JOIN MST_CUSTOMER c ON h.CUSTOMER_ID = c.CUSTOMER_ID
      LEFT JOIN MST_CARRIER cr ON h.CARRIER_ID = cr.CARRIER_ID
      LEFT JOIN MST_PORT pol ON h.POL_PORT_CD = pol.PORT_CD
      LEFT JOIN MST_PORT pod ON h.POD_PORT_CD = pod.PORT_CD
      ${whereClause}
      ORDER BY h.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch House B/Ls' }, { status: 500 });
  }
}

// House B/L 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 HBL 번호 생성
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(HBL_NO, LENGTH('HBL${year}') + 1) AS UNSIGNED)), 0) as max_seq FROM BL_HOUSE_BL WHERE HBL_NO LIKE ?`,
      [`HBL${year}%`]
    );
    const count = countResult[0].max_seq + 1;
    const hblNo = `HBL${year}${String(count).padStart(5, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO BL_HOUSE_BL (
        HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
        VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST,
        ETD_DT, ETA_DT, ON_BOARD_DT, ISSUE_DT, ISSUE_PLACE,
        SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, HS_CODE, MARKS_NOS,
        FREIGHT_TERM_CD, BL_TYPE_CD, ORIGINAL_BL_COUNT,
        STATUS_CD, PRINT_YN, SURRENDER_YN, DEL_YN,
        CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        'DRAFT', 'N', 'N', 'N',
        'admin', NOW()
      )
    `, [
      hblNo,
      body.shipment_id,
      body.mbl_id || null,
      body.customer_id,
      body.carrier_id || null,
      body.vessel_nm || null,
      body.voyage_no || null,
      body.pol_port_cd,
      body.pod_port_cd,
      body.place_of_receipt || null,
      body.place_of_delivery || null,
      body.final_dest || null,
      body.etd_dt || null,
      body.eta_dt || null,
      body.on_board_dt || null,
      body.issue_dt || null,
      body.issue_place || null,
      body.shipper_nm || null,
      body.shipper_addr || null,
      body.consignee_nm || null,
      body.consignee_addr || null,
      body.notify_party || null,
      body.total_pkg_qty || null,
      body.pkg_type_cd || null,
      body.gross_weight_kg || null,
      body.volume_cbm || null,
      body.commodity_desc || null,
      body.hs_code || null,
      body.marks_nos || null,
      body.freight_term_cd || 'PREPAID',
      body.bl_type_cd || 'ORIGINAL',
      body.original_bl_count || 3
    ]);

    return NextResponse.json({
      success: true,
      hbl_id: result.insertId,
      hbl_no: hblNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create House B/L' }, { status: 500 });
  }
}

// House B/L 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { hbl_id, ...updateData } = body;

    if (!hbl_id) {
      return NextResponse.json({ error: 'HBL ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    const fieldMapping: Record<string, string> = {
      mbl_id: 'MBL_ID',
      customer_id: 'CUSTOMER_ID',
      carrier_id: 'CARRIER_ID',
      vessel_nm: 'VESSEL_NM',
      voyage_no: 'VOYAGE_NO',
      pol_port_cd: 'POL_PORT_CD',
      pod_port_cd: 'POD_PORT_CD',
      place_of_receipt: 'PLACE_OF_RECEIPT',
      place_of_delivery: 'PLACE_OF_DELIVERY',
      final_dest: 'FINAL_DEST',
      etd_dt: 'ETD_DT',
      eta_dt: 'ETA_DT',
      on_board_dt: 'ON_BOARD_DT',
      issue_dt: 'ISSUE_DT',
      issue_place: 'ISSUE_PLACE',
      shipper_nm: 'SHIPPER_NM',
      shipper_addr: 'SHIPPER_ADDR',
      consignee_nm: 'CONSIGNEE_NM',
      consignee_addr: 'CONSIGNEE_ADDR',
      notify_party: 'NOTIFY_PARTY',
      total_pkg_qty: 'TOTAL_PKG_QTY',
      pkg_type_cd: 'PKG_TYPE_CD',
      gross_weight_kg: 'GROSS_WEIGHT_KG',
      volume_cbm: 'VOLUME_CBM',
      commodity_desc: 'COMMODITY_DESC',
      hs_code: 'HS_CODE',
      marks_nos: 'MARKS_NOS',
      freight_term_cd: 'FREIGHT_TERM_CD',
      bl_type_cd: 'BL_TYPE_CD',
      original_bl_count: 'ORIGINAL_BL_COUNT',
      status_cd: 'STATUS_CD',
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
    updateValues.push(hbl_id);

    await pool.query(`
      UPDATE BL_HOUSE_BL
      SET ${updateFields.join(', ')}
      WHERE HBL_ID = ?
    `, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update House B/L' }, { status: 500 });
  }
}

// House B/L 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hblId = searchParams.get('id');

    if (!hblId) {
      return NextResponse.json({ error: 'HBL ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE BL_HOUSE_BL
      SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE HBL_ID = ?
    `, [hblId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete House B/L' }, { status: 500 });
  }
}
