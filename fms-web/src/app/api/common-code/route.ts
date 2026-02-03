import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: 공통코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupCd = searchParams.get('groupCd') || '';
    const keyword = searchParams.get('keyword') || '';
    const useYn = searchParams.get('useYn') || '';

    let sql = `
      SELECT c.CODE_GROUP_ID, c.CODE_CD, c.CODE_NM, c.CODE_NM_EN,
             c.SORT_ORDER, c.ATTR1, c.ATTR2, c.ATTR3, c.DESCRIPTION,
             c.USE_YN, c.CREATED_BY, c.CREATED_DTM, c.UPDATED_BY, c.UPDATED_DTM,
             g.GROUP_NM
      FROM MST_COMMON_CODE c
      LEFT JOIN MST_CODE_GROUP g ON c.CODE_GROUP_ID = g.GROUP_CD
      WHERE c.DEL_YN = 'N'
    `;
    const params: string[] = [];

    if (groupCd) {
      sql += ` AND c.CODE_GROUP_ID = ?`;
      params.push(groupCd);
    }
    if (keyword) {
      sql += ` AND (c.CODE_CD LIKE ? OR c.CODE_NM LIKE ? OR c.CODE_NM_EN LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (useYn) {
      sql += ` AND c.USE_YN = ?`;
      params.push(useYn);
    }

    sql += ` ORDER BY c.CODE_GROUP_ID, c.SORT_ORDER, c.CODE_CD`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Common code GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch common codes' }, { status: 500 });
  }
}

// POST: 공통코드 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, ATTR1, ATTR2, ATTR3, DESCRIPTION, USE_YN } = body;

    if (!CODE_GROUP_ID || !CODE_CD) {
      return NextResponse.json({ error: '그룹코드와 코드는 필수입니다.' }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, ATTR1, ATTR2, ATTR3, DESCRIPTION, USE_YN, CREATED_BY, CREATED_DTM, DEL_YN)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM', NOW(), 'N')
       ON DUPLICATE KEY UPDATE CODE_NM=VALUES(CODE_NM), CODE_NM_EN=VALUES(CODE_NM_EN), SORT_ORDER=VALUES(SORT_ORDER),
       ATTR1=VALUES(ATTR1), ATTR2=VALUES(ATTR2), ATTR3=VALUES(ATTR3), DESCRIPTION=VALUES(DESCRIPTION), USE_YN=VALUES(USE_YN),
       UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()`,
      [CODE_GROUP_ID, CODE_CD, CODE_NM || '', CODE_NM_EN || '', SORT_ORDER || 0, ATTR1 || '', ATTR2 || '', ATTR3 || '', DESCRIPTION || '', USE_YN || 'Y']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Common code POST error:', error);
    return NextResponse.json({ error: 'Failed to save common code' }, { status: 500 });
  }
}

// DELETE: 공통코드 삭제 (논리삭제)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: { CODE_GROUP_ID: string; CODE_CD: string }[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '삭제할 항목을 선택해주세요.' }, { status: 400 });
    }

    for (const item of items) {
      await pool.query<ResultSetHeader>(
        `UPDATE MST_COMMON_CODE SET DEL_YN = 'Y', UPDATED_BY = 'SYSTEM', UPDATED_DTM = NOW() WHERE CODE_GROUP_ID = ? AND CODE_CD = ?`,
        [item.CODE_GROUP_ID, item.CODE_CD]
      );
    }

    return NextResponse.json({ success: true, deleted: items.length });
  } catch (error) {
    console.error('Common code DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete common codes' }, { status: 500 });
  }
}
