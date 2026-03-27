import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupCd = formData.get('groupCd') as string;

    if (!file || !groupCd) {
      return NextResponse.json({ error: '파일과 그룹코드는 필수입니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    let count = 0;
    for (const row of data) {
      const codeCd = String(row['CODE_CD'] || row['코드'] || row['Code'] || '').trim();
      const codeNm = String(row['CODE_NM'] || row['코드명'] || row['Name'] || '').trim();
      const codeNmEn = String(row['CODE_NM_EN'] || row['영문명'] || row['Name(E)'] || '').trim();
      const useYn = String(row['USE_YN'] || row['사용여부'] || 'Y').trim();

      if (!codeCd) continue;

      await pool.query<ResultSetHeader>(
        `INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_DTM, DEL_YN)
         VALUES (?, ?, ?, ?, ?, ?, 'SYSTEM', NOW(), 'N')
         ON DUPLICATE KEY UPDATE CODE_NM=VALUES(CODE_NM), CODE_NM_EN=VALUES(CODE_NM_EN), USE_YN=VALUES(USE_YN), UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()`,
        [groupCd, codeCd, codeNm, codeNmEn, count, useYn || 'Y']
      );
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
