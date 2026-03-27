import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: Other Charge 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mawbId = searchParams.get('mawbId');

    if (!mawbId) {
      return NextResponse.json({ error: 'mawbId is required' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ID, MAWB_ID, CHARGE_CODE, CURRENCY, RATE, AMOUNT, PC_TYPE, AC_TYPE
       FROM TRN_AIR_MAWB_CHARGE WHERE MAWB_ID = ? AND DEL_YN = 'N' ORDER BY ID`,
      [mawbId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('MAWB Charge GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}

// POST: Other Charge 전체 교체 (기존 삭제 + 새로 삽입)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mawbId, charges } = body as {
      mawbId: number;
      charges: Array<{
        chargeCode: string;
        currency: string;
        rate: number;
        amount: number;
        pcType: string;
        acType: string;
      }>;
    };

    if (!mawbId) {
      return NextResponse.json({ error: 'mawbId is required' }, { status: 400 });
    }

    // 기존 데이터 논리 삭제
    await pool.query<ResultSetHeader>(
      `UPDATE TRN_AIR_MAWB_CHARGE SET DEL_YN = 'Y' WHERE MAWB_ID = ?`,
      [mawbId]
    );

    // 새 데이터 삽입
    if (charges && charges.length > 0) {
      for (const c of charges) {
        await pool.query<ResultSetHeader>(
          `INSERT INTO TRN_AIR_MAWB_CHARGE (MAWB_ID, CHARGE_CODE, CURRENCY, RATE, AMOUNT, PC_TYPE, AC_TYPE, DEL_YN, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'N', NOW())`,
          [mawbId, c.chargeCode || null, c.currency || 'USD', c.rate || 0, c.amount || 0, c.pcType || null, c.acType || null]
        );
      }
    }

    return NextResponse.json({ success: true, count: charges?.length || 0 });
  } catch (error) {
    console.error('MAWB Charge POST error:', error);
    return NextResponse.json({ error: 'Failed to save charges' }, { status: 500 });
  }
}
