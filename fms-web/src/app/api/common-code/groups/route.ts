import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT GROUP_CD, GROUP_NM, GROUP_NM_E, DESCRIPTION, USE_YN, SORT_ORDER
       FROM MST_CODE_GROUP
       WHERE USE_YN = 'Y'
       ORDER BY SORT_ORDER, GROUP_CD`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Code group GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch code groups' }, { status: 500 });
  }
}
