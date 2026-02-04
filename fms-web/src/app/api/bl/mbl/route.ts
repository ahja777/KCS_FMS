import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Master B/L 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const carrierId = searchParams.get('carrier_id');
    const direction = searchParams.get('direction'); // EXPORT or IMPORT

    let whereClause = 'WHERE m.DEL_YN != "Y"';
    const params: (string | number)[] = [];

    if (direction) {
      whereClause += ' AND m.DIRECTION = ?';
      params.push(direction.toUpperCase());
    }
    if (status) {
      whereClause += ' AND m.STATUS_CD = ?';
      params.push(status);
    }
    if (carrierId) {
      whereClause += ' AND m.CARRIER_ID = ?';
      params.push(parseInt(carrierId));
    }

    const [rows] = await queryWithLog<RowDataPacket[]>(`
      SELECT
        m.MBL_ID as mbl_id,
        m.MBL_NO as mbl_no,
        m.SHIPMENT_ID as shipment_id,
        m.BOOKING_ID as booking_id,
        m.CARRIER_ID as carrier_id,
        cr.CARRIER_NM as carrier_name,
        m.VESSEL_NM as vessel_nm,
        m.VOYAGE_NO as voyage_no,
        m.POL_PORT_CD as pol_port_cd,
        m.POD_PORT_CD as pod_port_cd,
        pol.PORT_NM as pol_port_name,
        pod.PORT_NM as pod_port_name,
        m.PLACE_OF_RECEIPT as place_of_receipt,
        m.PLACE_OF_DELIVERY as place_of_delivery,
        m.FINAL_DEST as final_dest,
        DATE_FORMAT(m.ETD_DT, '%Y-%m-%d') as etd_dt,
        DATE_FORMAT(m.ATD_DT, '%Y-%m-%d') as atd_dt,
        DATE_FORMAT(m.ETA_DT, '%Y-%m-%d') as eta_dt,
        DATE_FORMAT(m.ATA_DT, '%Y-%m-%d') as ata_dt,
        DATE_FORMAT(m.ON_BOARD_DT, '%Y-%m-%d') as on_board_dt,
        DATE_FORMAT(m.ISSUE_DT, '%Y-%m-%d') as issue_dt,
        m.ISSUE_PLACE as issue_place,
        m.SHIPPER_NM as shipper_nm,
        m.CONSIGNEE_NM as consignee_nm,
        m.NOTIFY_PARTY as notify_party,
        m.TOTAL_PKG_QTY as total_pkg_qty,
        m.PKG_TYPE_CD as pkg_type_cd,
        m.GROSS_WEIGHT_KG as gross_weight_kg,
        m.VOLUME_CBM as volume_cbm,
        m.COMMODITY_DESC as commodity_desc,
        m.CNTR_COUNT as cntr_count,
        m.FREIGHT_TERM_CD as freight_term_cd,
        m.BL_TYPE_CD as bl_type_cd,
        m.ORIGINAL_BL_COUNT as original_bl_count,
        m.STATUS_CD as status_cd,
        m.DIRECTION as direction,
        m.SURRENDER_YN as surrender_yn,
        DATE_FORMAT(m.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm,
        (SELECT COUNT(*) FROM BL_HOUSE_BL h WHERE h.MBL_ID = m.MBL_ID AND h.DEL_YN != 'Y') as hbl_count
      FROM BL_MASTER_BL m
      LEFT JOIN MST_CARRIER cr ON m.CARRIER_ID = cr.CARRIER_ID
      LEFT JOIN MST_PORT pol ON m.POL_PORT_CD = pol.PORT_CD
      LEFT JOIN MST_PORT pod ON m.POD_PORT_CD = pod.PORT_CD
      ${whereClause}
      ORDER BY m.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch Master B/Ls' }, { status: 500 });
  }
}

// Master B/L 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 MBL 번호 생성
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(MBL_NO, LENGTH('MBL${year}') + 1) AS UNSIGNED)), 0) as max_seq FROM BL_MASTER_BL WHERE MBL_NO LIKE ?`,
      [`MBL${year}%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const mblNo = `MBL${year}${String(count).padStart(5, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, SHIPMENT_ID, BOOKING_ID, CARRIER_ID,
        VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST,
        ETD_DT, ETA_DT, ON_BOARD_DT, ISSUE_DT, ISSUE_PLACE,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, FREIGHT_TERM_CD, BL_TYPE_CD, ORIGINAL_BL_COUNT,
        STATUS_CD, DIRECTION, SURRENDER_YN, DEL_YN,
        CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        'DRAFT', ?, 'N', 'N',
        'admin', NOW()
      )
    `, [
      mblNo,
      body.shipment_id || null,
      body.booking_id || null,
      body.carrier_id,
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
      body.consignee_nm || null,
      body.notify_party || null,
      body.total_pkg_qty || null,
      body.pkg_type_cd || null,
      body.gross_weight_kg || null,
      body.volume_cbm || null,
      body.commodity_desc || null,
      body.freight_term_cd || 'PREPAID',
      body.bl_type_cd || 'ORIGINAL',
      body.original_bl_count || 3,
      body.direction || 'EXPORT'
    ]);

    return NextResponse.json({
      success: true,
      mbl_id: result.insertId,
      mbl_no: mblNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create Master B/L' }, { status: 500 });
  }
}

// Master B/L 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mbl_id, ...updateData } = body;

    if (!mbl_id) {
      return NextResponse.json({ error: 'MBL ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    const fieldMapping: Record<string, string> = {
      shipment_id: 'SHIPMENT_ID',
      booking_id: 'BOOKING_ID',
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
      consignee_nm: 'CONSIGNEE_NM',
      notify_party: 'NOTIFY_PARTY',
      total_pkg_qty: 'TOTAL_PKG_QTY',
      pkg_type_cd: 'PKG_TYPE_CD',
      gross_weight_kg: 'GROSS_WEIGHT_KG',
      volume_cbm: 'VOLUME_CBM',
      commodity_desc: 'COMMODITY_DESC',
      cntr_count: 'CNTR_COUNT',
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
    updateValues.push(mbl_id);

    await pool.query(`
      UPDATE BL_MASTER_BL
      SET ${updateFields.join(', ')}
      WHERE MBL_ID = ?
    `, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update Master B/L' }, { status: 500 });
  }
}

// Master B/L 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mblId = searchParams.get('id');

    if (!mblId) {
      return NextResponse.json({ error: 'MBL ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE BL_MASTER_BL
      SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE MBL_ID = ?
    `, [mblId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete Master B/L' }, { status: 500 });
  }
}
