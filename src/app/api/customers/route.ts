import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        CUSTOMER_ID as customer_id,
        CUSTOMER_CD as customer_cd,
        CUSTOMER_NM as customer_name,
        CUSTOMER_TYPE_CD as customer_type
      FROM MST_CUSTOMER
      WHERE USE_YN = 'Y'
      ORDER BY CUSTOMER_NM
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
