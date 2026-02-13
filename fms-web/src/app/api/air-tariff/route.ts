import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: 항공운임 Tariff 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const airline = searchParams.get('airline') || '';
    const cargoType = searchParams.get('cargoType') || '';
    const chargeCode = searchParams.get('chargeCode') || '';
    const keyword = searchParams.get('keyword') || '';

    let sql = `
      SELECT ID, TARIFF_DATE, AIRLINE, ORIGIN, DESTINATION, CHARGE_CODE, CARGO_TYPE,
             CURRENCY, WEIGHT_UNIT, RATE_MIN, RATE_UNDER45, RATE_45, RATE_100, RATE_300,
             RATE_500, RATE_1000, RATE_PER_KG, RATE_PER_BL, USE_YN,
             CREATED_BY, CREATED_DTM, UPDATED_BY, UPDATED_DTM
      FROM MST_AIR_TARIFF
      WHERE DEL_YN = 'N'
    `;
    const params: string[] = [];

    if (origin) {
      sql += ` AND ORIGIN = ?`;
      params.push(origin.toUpperCase());
    }
    if (destination) {
      sql += ` AND DESTINATION = ?`;
      params.push(destination.toUpperCase());
    }
    if (airline) {
      sql += ` AND AIRLINE = ?`;
      params.push(airline);
    }
    if (cargoType) {
      sql += ` AND CARGO_TYPE = ?`;
      params.push(cargoType);
    }
    if (chargeCode) {
      sql += ` AND CHARGE_CODE = ?`;
      params.push(chargeCode);
    }
    if (keyword) {
      sql += ` AND (ORIGIN LIKE ? OR DESTINATION LIKE ? OR AIRLINE LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ` ORDER BY ORIGIN, DESTINATION, AIRLINE LIMIT 500`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Air tariff GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch air tariff data' }, { status: 500 });
  }
}

// POST: 항공운임 Tariff 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ID, TARIFF_DATE, AIRLINE, ORIGIN, DESTINATION, CHARGE_CODE, CARGO_TYPE,
      CURRENCY, WEIGHT_UNIT, RATE_MIN, RATE_UNDER45, RATE_45, RATE_100, RATE_300,
      RATE_500, RATE_1000, RATE_PER_KG, RATE_PER_BL, USE_YN
    } = body;

    if (!ORIGIN || !DESTINATION) {
      return NextResponse.json({ error: '출발공항과 도착공항은 필수입니다.' }, { status: 400 });
    }

    if (ID) {
      // 수정
      await pool.query<ResultSetHeader>(
        `UPDATE MST_AIR_TARIFF SET
          TARIFF_DATE=?, AIRLINE=?, ORIGIN=?, DESTINATION=?, CHARGE_CODE=?, CARGO_TYPE=?,
          CURRENCY=?, WEIGHT_UNIT=?, RATE_MIN=?, RATE_UNDER45=?, RATE_45=?, RATE_100=?,
          RATE_300=?, RATE_500=?, RATE_1000=?, RATE_PER_KG=?, RATE_PER_BL=?, USE_YN=?,
          UPDATED_BY='SYSTEM', UPDATED_DTM=NOW()
         WHERE ID = ?`,
        [TARIFF_DATE || null, AIRLINE || '', ORIGIN, DESTINATION, CHARGE_CODE || 'AFC', CARGO_TYPE || 'NORMAL',
         CURRENCY || 'KRW', WEIGHT_UNIT || 'KG', RATE_MIN || 0, RATE_UNDER45 || 0, RATE_45 || 0,
         RATE_100 || 0, RATE_300 || 0, RATE_500 || 0, RATE_1000 || 0, RATE_PER_KG || 0, RATE_PER_BL || 0,
         USE_YN || 'Y', ID]
      );
    } else {
      // 등록
      await pool.query<ResultSetHeader>(
        `INSERT INTO MST_AIR_TARIFF
          (TARIFF_DATE, AIRLINE, ORIGIN, DESTINATION, CHARGE_CODE, CARGO_TYPE, CURRENCY, WEIGHT_UNIT,
           RATE_MIN, RATE_UNDER45, RATE_45, RATE_100, RATE_300, RATE_500, RATE_1000, RATE_PER_KG, RATE_PER_BL,
           USE_YN, DEL_YN, CREATED_BY, CREATED_DTM)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'SYSTEM', NOW())`,
        [TARIFF_DATE || null, AIRLINE || '', ORIGIN, DESTINATION, CHARGE_CODE || 'AFC', CARGO_TYPE || 'NORMAL',
         CURRENCY || 'KRW', WEIGHT_UNIT || 'KG', RATE_MIN || 0, RATE_UNDER45 || 0, RATE_45 || 0,
         RATE_100 || 0, RATE_300 || 0, RATE_500 || 0, RATE_1000 || 0, RATE_PER_KG || 0, RATE_PER_BL || 0,
         USE_YN || 'Y']
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Air tariff POST error:', error);
    return NextResponse.json({ error: 'Failed to save air tariff' }, { status: 500 });
  }
}

// DELETE: 항공운임 Tariff 삭제 (논리삭제)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: number[] };

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: '삭제할 항목을 선택해주세요.' }, { status: 400 });
    }

    for (const id of ids) {
      await pool.query<ResultSetHeader>(
        `UPDATE MST_AIR_TARIFF SET DEL_YN = 'Y', UPDATED_BY = 'SYSTEM', UPDATED_DTM = NOW() WHERE ID = ?`,
        [id]
      );
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Air tariff DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete air tariff' }, { status: 500 });
  }
}
