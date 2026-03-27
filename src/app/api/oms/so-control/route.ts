import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - S/O Control 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const customerCode = searchParams.get('customerCode');
  const isActive = searchParams.get('isActive');

  try {
    let query = 'SELECT * FROM oms_so_control WHERE 1=1';
    const params: (string | boolean)[] = [];

    if (customerCode) {
      query += ' AND customer_code = ?';
      params.push(customerCode);
    }
    if (isActive !== null && isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true');
    }

    query += ' ORDER BY control_code';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('S/O Control GET Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - S/O Control 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO oms_so_control (
        control_code, control_name, customer_code, order_type_code, biz_type,
        check_validation, auto_release, auto_value_assignment, method_type,
        execution_module, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.control_code,
        body.control_name,
        body.customer_code,
        body.order_type_code,
        body.biz_type,
        body.check_validation !== false,
        body.auto_release || false,
        body.auto_value_assignment || false,
        body.method_type || 'SEQUENTIAL',
        body.execution_module,
        body.is_active !== false
      ]
    );

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
      message: 'S/O Control이 생성되었습니다.'
    });
  } catch (error) {
    console.error('S/O Control POST Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT - S/O Control 수정
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
    const updatable = ['control_code','control_name','customer_code','order_type_code','biz_type','check_validation','auto_release','auto_value_assignment','method_type','execution_module','is_active'];
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
    await pool.query(`UPDATE oms_so_control SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({
      success: true,
      message: 'S/O Control이 수정되었습니다.'
    });
  } catch (error) {
    console.error('S/O Control PUT Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - S/O Control 삭제
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
    await pool.query('DELETE FROM oms_so_control WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'S/O Control이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('S/O Control DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
