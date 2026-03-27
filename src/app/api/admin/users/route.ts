import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

// GET: 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const userTypeCd = searchParams.get('userTypeCd') || '';
    const statusCd = searchParams.get('statusCd') || '';
    const useYn = searchParams.get('useYn') || '';

    let sql = `
      SELECT u.USER_ID, u.USER_NM, u.EMAIL, u.PHONE,
             u.USER_TYPE_CD, t.USER_TYPE_NM,
             u.COMPANY_CD, u.COMPANY_NM, u.DEPARTMENT, u.POSITION_NM,
             u.STATUS_CD, u.LAST_LOGIN_DTM, u.LOGIN_FAIL_CNT,
             u.USE_YN, u.CREATED_BY, u.CREATED_DTM, u.UPDATED_DTM
      FROM SYS_USER u
      LEFT JOIN SYS_USER_TYPE t ON u.USER_TYPE_CD = t.USER_TYPE_CD
      WHERE 1=1
    `;
    const params: string[] = [];

    if (keyword) {
      sql += ` AND (u.USER_ID LIKE ? OR u.USER_NM LIKE ? OR u.EMAIL LIKE ? OR u.COMPANY_NM LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (userTypeCd) {
      sql += ` AND u.USER_TYPE_CD = ?`;
      params.push(userTypeCd);
    }
    if (statusCd) {
      sql += ` AND u.STATUS_CD = ?`;
      params.push(statusCd);
    }
    if (useYn) {
      sql += ` AND u.USE_YN = ?`;
      params.push(useYn);
    }

    sql += ` ORDER BY u.CREATED_DTM DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: 사용자 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { USER_ID, USER_NM, PASSWORD, EMAIL, PHONE, USER_TYPE_CD, COMPANY_CD, COMPANY_NM, DEPARTMENT, POSITION_NM, STATUS_CD, USE_YN, isEdit } = body;

    if (!USER_ID || !USER_NM) {
      return NextResponse.json({ error: '사용자 ID와 이름은 필수입니다.' }, { status: 400 });
    }

    if (isEdit) {
      // 수정
      let sql = `UPDATE SYS_USER SET USER_NM=?, EMAIL=?, PHONE=?, USER_TYPE_CD=?,
                  COMPANY_CD=?, COMPANY_NM=?, DEPARTMENT=?, POSITION_NM=?,
                  STATUS_CD=?, USE_YN=?, UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()
                  WHERE USER_ID=?`;
      const params = [USER_NM, EMAIL || '', PHONE || '', USER_TYPE_CD || null,
                      COMPANY_CD || '', COMPANY_NM || '', DEPARTMENT || '', POSITION_NM || '',
                      STATUS_CD || 'ACTIVE', USE_YN || 'Y', USER_ID];

      await pool.query<ResultSetHeader>(sql, params);

      // 비밀번호 변경 시
      if (PASSWORD) {
        const hash = await bcrypt.hash(PASSWORD, 10);
        await pool.query<ResultSetHeader>(
          `UPDATE SYS_USER SET PASSWORD_HASH=?, PASSWORD_CHANGED_DTM=NOW() WHERE USER_ID=?`,
          [hash, USER_ID]
        );
      }
    } else {
      // 등록 - 중복 체크
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT USER_ID FROM SYS_USER WHERE USER_ID = ?`, [USER_ID]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: '이미 존재하는 사용자 ID입니다.' }, { status: 400 });
      }

      if (!PASSWORD) {
        return NextResponse.json({ error: '비밀번호는 필수입니다.' }, { status: 400 });
      }

      const hash = await bcrypt.hash(PASSWORD, 10);
      await pool.query<ResultSetHeader>(
        `INSERT INTO SYS_USER (USER_ID, USER_NM, PASSWORD_HASH, EMAIL, PHONE, USER_TYPE_CD,
          COMPANY_CD, COMPANY_NM, DEPARTMENT, POSITION_NM, STATUS_CD, USE_YN, CREATED_BY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM')`,
        [USER_ID, USER_NM, hash, EMAIL || '', PHONE || '', USER_TYPE_CD || null,
         COMPANY_CD || '', COMPANY_NM || '', DEPARTMENT || '', POSITION_NM || '',
         STATUS_CD || 'ACTIVE', USE_YN || 'Y']
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}

// DELETE: 사용자 삭제 (논리삭제)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds } = body as { userIds: string[] };

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: '삭제할 사용자를 선택해주세요.' }, { status: 400 });
    }

    for (const id of userIds) {
      await pool.query<ResultSetHeader>(
        `UPDATE SYS_USER SET USE_YN='N', STATUS_CD='INACTIVE', UPDATED_BY='SYSTEM', UPDATED_DTM=NOW() WHERE USER_ID=?`,
        [id]
      );
    }

    return NextResponse.json({ success: true, deleted: userIds.length });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 });
  }
}
