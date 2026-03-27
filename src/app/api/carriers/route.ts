import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        CARRIER_ID as carrier_id,
        CARRIER_CD as carrier_cd,
        CARRIER_NM as carrier_name,
        CARRIER_TYPE_CD as carrier_type
      FROM MST_CARRIER
      WHERE USE_YN = 'Y' AND DEL_YN = 'N'
      ORDER BY CARRIER_NM
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 });
  }
}
