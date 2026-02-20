import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: 회사 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyCd = searchParams.get('companyCd') || '';

    let sql = `SELECT * FROM SYS_COMPANY WHERE USE_YN = 'Y'`;
    const params: string[] = [];

    if (companyCd) {
      sql += ` AND COMPANY_CD = ?`;
      params.push(companyCd);
    }

    sql += ` ORDER BY CREATED_DTM DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Company GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 });
  }
}

// POST: 회사 정보 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      COMPANY_CD, COMPANY_NM, COMPANY_NM_EN, BIZ_NO, CORP_NO,
      CEO_NM, BIZ_TYPE, BIZ_ITEM, ADDRESS, ADDRESS_EN,
      TEL, FAX, EMAIL, HOMEPAGE, LOGO_PATH
    } = body;

    if (!COMPANY_CD || !COMPANY_NM) {
      return NextResponse.json({ error: '회사코드와 회사명은 필수입니다.' }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO SYS_COMPANY (COMPANY_CD, COMPANY_NM, COMPANY_NM_EN, BIZ_NO, CORP_NO,
        CEO_NM, BIZ_TYPE, BIZ_ITEM, ADDRESS, ADDRESS_EN, TEL, FAX, EMAIL, HOMEPAGE, LOGO_PATH, CREATED_BY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM')
       ON DUPLICATE KEY UPDATE
        COMPANY_NM=VALUES(COMPANY_NM), COMPANY_NM_EN=VALUES(COMPANY_NM_EN),
        BIZ_NO=VALUES(BIZ_NO), CORP_NO=VALUES(CORP_NO), CEO_NM=VALUES(CEO_NM),
        BIZ_TYPE=VALUES(BIZ_TYPE), BIZ_ITEM=VALUES(BIZ_ITEM),
        ADDRESS=VALUES(ADDRESS), ADDRESS_EN=VALUES(ADDRESS_EN),
        TEL=VALUES(TEL), FAX=VALUES(FAX), EMAIL=VALUES(EMAIL),
        HOMEPAGE=VALUES(HOMEPAGE), LOGO_PATH=VALUES(LOGO_PATH),
        UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()`,
      [COMPANY_CD, COMPANY_NM, COMPANY_NM_EN || '', BIZ_NO || '', CORP_NO || '',
       CEO_NM || '', BIZ_TYPE || '', BIZ_ITEM || '', ADDRESS || '', ADDRESS_EN || '',
       TEL || '', FAX || '', EMAIL || '', HOMEPAGE || '', LOGO_PATH || '']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Company POST error:', error);
    return NextResponse.json({ error: 'Failed to save company info' }, { status: 500 });
  }
}

// DELETE: 회사 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyCodes } = body as { companyCodes: string[] };

    if (!companyCodes || companyCodes.length === 0) {
      return NextResponse.json({ error: '삭제할 회사를 선택해주세요.' }, { status: 400 });
    }

    for (const cd of companyCodes) {
      await pool.query<ResultSetHeader>(
        `UPDATE SYS_COMPANY SET USE_YN='N', UPDATED_BY='SYSTEM', UPDATED_DTM=NOW() WHERE COMPANY_CD=?`,
        [cd]
      );
    }

    return NextResponse.json({ success: true, deleted: companyCodes.length });
  } catch (error) {
    console.error('Company DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}
