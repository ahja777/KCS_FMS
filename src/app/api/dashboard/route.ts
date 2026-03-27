import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // 통계 데이터
    const [totalShipments] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ORD_SHIPMENT WHERE DEL_YN = 'N'`
    );

    const [inTransit] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ORD_SHIPMENT WHERE STATUS_CD IN ('SHIPPED', 'DEPARTED', 'IN_TRANSIT') AND DEL_YN = 'N'`
    );

    const [pendingBL] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ORD_SHIPMENT WHERE STATUS_CD IN ('PENDING', 'BOOKED') AND DEL_YN = 'N'`
    );

    // 최근 Shipment 목록
    const [recentShipments] = await pool.query<RowDataPacket[]>(`
      SELECT
        s.SHIPMENT_NO as shipment_no,
        s.TRANSPORT_MODE_CD as transport_mode,
        c.CUSTOMER_NM as customer_name,
        CONCAT(s.ORIGIN_PORT_CD, ' → ', s.DEST_PORT_CD) as route,
        s.STATUS_CD as status,
        DATE_FORMAT(s.ETA_DT, '%Y-%m-%d') as eta,
        COALESCE(s.TOTAL_PKG_QTY, 0) as pkg_qty,
        COALESCE(s.PKG_TYPE_CD, 'PKG') as pkg_type,
        COALESCE(s.GROSS_WEIGHT_KG, 0) as gross_weight,
        COALESCE(s.VOLUME_CBM, 0) as volume_cbm
      FROM ORD_SHIPMENT s
      LEFT JOIN MST_CUSTOMER c ON s.CUSTOMER_ID = c.CUSTOMER_ID
      WHERE s.DEL_YN = 'N'
      ORDER BY s.CREATED_DTM DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats: {
        totalShipments: totalShipments[0].count,
        inTransit: inTransit[0].count,
        pendingBL: pendingBL[0].count,
      },
      recentShipments,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
