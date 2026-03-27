import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: 권한 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userTypeCd = searchParams.get('userTypeCd') || '';
    const userId = searchParams.get('userId') || '';

    let sql = `
      SELECT p.PERM_ID, p.USER_TYPE_CD, t.USER_TYPE_NM, p.USER_ID,
             p.MENU_ID, m.MENU_NM, m.MENU_PATH, m.PARENT_MENU_ID, m.MENU_LEVEL,
             p.CAN_READ, p.CAN_CREATE, p.CAN_UPDATE, p.CAN_DELETE,
             p.CAN_PRINT, p.CAN_EXPORT, p.USE_YN
      FROM SYS_MENU_PERMISSION p
      JOIN SYS_MENU m ON p.MENU_ID = m.MENU_ID
      LEFT JOIN SYS_USER_TYPE t ON p.USER_TYPE_CD = t.USER_TYPE_CD
      WHERE p.USE_YN = 'Y'
    `;
    const params: string[] = [];

    if (userTypeCd) {
      sql += ` AND p.USER_TYPE_CD = ?`;
      params.push(userTypeCd);
    }
    if (userId) {
      sql += ` AND p.USER_ID = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY m.MENU_LEVEL, m.SORT_ORDER`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Permissions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST: 권한 저장 (일괄 저장)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { permissions, userTypeCd, userId } = body as {
      permissions: Array<{
        MENU_ID: string;
        CAN_READ: string;
        CAN_CREATE: string;
        CAN_UPDATE: string;
        CAN_DELETE: string;
        CAN_PRINT: string;
        CAN_EXPORT: string;
      }>;
      userTypeCd?: string;
      userId?: string;
    };

    if (!permissions || permissions.length === 0) {
      return NextResponse.json({ error: '저장할 권한 정보가 없습니다.' }, { status: 400 });
    }

    // 기존 권한 삭제 후 재등록
    if (userTypeCd) {
      await pool.query<ResultSetHeader>(
        `DELETE FROM SYS_MENU_PERMISSION WHERE USER_TYPE_CD = ? AND USER_ID IS NULL`,
        [userTypeCd]
      );
    }
    if (userId) {
      await pool.query<ResultSetHeader>(
        `DELETE FROM SYS_MENU_PERMISSION WHERE USER_ID = ?`,
        [userId]
      );
    }

    for (const perm of permissions) {
      await pool.query<ResultSetHeader>(
        `INSERT INTO SYS_MENU_PERMISSION
          (USER_TYPE_CD, USER_ID, MENU_ID, CAN_READ, CAN_CREATE, CAN_UPDATE, CAN_DELETE, CAN_PRINT, CAN_EXPORT, USE_YN, CREATED_BY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'SYSTEM')`,
        [userTypeCd || null, userId || null, perm.MENU_ID,
         perm.CAN_READ || 'N', perm.CAN_CREATE || 'N', perm.CAN_UPDATE || 'N',
         perm.CAN_DELETE || 'N', perm.CAN_PRINT || 'N', perm.CAN_EXPORT || 'N']
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permissions POST error:', error);
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
  }
}
