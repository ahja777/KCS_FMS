import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: 사용자 유형 목록 조회
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT USER_TYPE_CD, USER_TYPE_NM, DESCRIPTION, SORT_ORDER, USE_YN
       FROM SYS_USER_TYPE
       WHERE USE_YN = 'Y'
       ORDER BY SORT_ORDER`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('User types GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch user types' }, { status: 500 });
  }
}
