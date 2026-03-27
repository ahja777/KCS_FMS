import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - 오더 타입 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bizType = searchParams.get('bizType');
  const isActive = searchParams.get('isActive');

  try {
    let query = 'SELECT * FROM oms_order_type WHERE 1=1';
    const params: (string | boolean)[] = [];

    if (bizType) {
      query += ' AND biz_type = ?';
      params.push(bizType);
    }
    if (isActive !== null && isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true');
    }

    query += ' ORDER BY order_type_code';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Order Type GET Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - 오더 타입 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO oms_order_type (
        order_type_code, order_type_name, biz_type, description, related_system, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.order_type_code,
        body.order_type_name,
        body.biz_type,
        body.description,
        body.related_system,
        body.is_active !== false
      ]
    );

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
      message: '오더 타입이 생성되었습니다.'
    });
  } catch (error) {
    console.error('Order Type POST Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT - 오더 타입 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    const updatable = ['order_type_code','order_type_name','biz_type','description','related_system','is_active'];
    for (const key of updatable) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key] === '' ? null : body[key]);
      }
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: '수정할 필드가 없습니다.' }, { status: 400 });
    }
    values.push(body.id);
    await pool.query(`UPDATE oms_order_type SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({
      success: true,
      message: '오더 타입이 수정되었습니다.'
    });
  } catch (error) {
    console.error('Order Type PUT Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 오더 타입 삭제
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    await pool.query('DELETE FROM oms_order_type WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '오더 타입이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Order Type DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
