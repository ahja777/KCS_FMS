import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: 메뉴 목록 조회
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT MENU_ID, MENU_NM, MENU_PATH, PARENT_MENU_ID, MENU_LEVEL, SORT_ORDER, ICON, USE_YN
       FROM SYS_MENU
       WHERE USE_YN = 'Y'
       ORDER BY MENU_LEVEL, SORT_ORDER`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Menus GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 });
  }
}
