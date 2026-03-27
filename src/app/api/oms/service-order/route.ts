import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - 서비스 오더 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const bizType = searchParams.get('bizType');
  const customerCode = searchParams.get('customerCode');
  const executionModule = searchParams.get('executionModule');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  try {
    let query = `
      SELECT
        so.*,
        ot.order_type_name
      FROM oms_service_order so
      LEFT JOIN oms_order_type ot ON so.order_type_code = ot.order_type_code
      WHERE 1=1
    `;
    const params: (string | null)[] = [];

    if (status) {
      query += ' AND so.status = ?';
      params.push(status);
    }
    if (bizType) {
      query += ' AND so.biz_type = ?';
      params.push(bizType);
    }
    if (customerCode) {
      query += ' AND so.customer_code = ?';
      params.push(customerCode);
    }
    if (executionModule) {
      query += ' AND so.execution_module = ?';
      params.push(executionModule);
    }
    if (fromDate) {
      query += ' AND so.created_at >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND so.created_at <= ?';
      params.push(toDate + ' 23:59:59');
    }

    query += ' ORDER BY so.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Service Order GET Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - 서비스 오더 생성 (C/O에서 변환 또는 직접 생성)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // S/O 번호 자동 생성
    const today = new Date();
    const prefix = `SO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(so_number, LENGTH('${prefix}-') + 1) AS UNSIGNED)), 0) as max_seq FROM oms_service_order WHERE so_number LIKE ?`,
      [`${prefix}%`]
    );
    const seq = String((countResult[0]?.max_seq || 0) + 1).padStart(4, '0');
    const soNumber = `${prefix}-${seq}`;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO oms_service_order (
        so_number, co_number, order_type_code, biz_type, customer_code, customer_name,
        shipper_name, consignee_name, pol, pod, etd, eta,
        cargo_type, commodity, quantity, weight, volume, incoterms,
        execution_module, control_type, auto_release, status, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        soNumber,
        body.co_number || null,
        body.order_type_code,
        body.biz_type || 'FORWARDING',
        body.customer_code,
        body.customer_name,
        body.shipper_name,
        body.consignee_name,
        body.pol,
        body.pod,
        body.etd || null,
        body.eta || null,
        body.cargo_type,
        body.commodity,
        body.quantity || 0,
        body.weight || 0,
        body.volume || 0,
        body.incoterms,
        body.execution_module || null,
        body.control_type,
        body.auto_release || false,
        body.status || 'DRAFT',
        body.remarks,
        body.created_by || 'admin'
      ]
    );

    // C/O 상태 업데이트 (연결된 경우)
    if (body.co_number) {
      await pool.query(
        'UPDATE oms_customer_order SET status = ? WHERE co_number = ?',
        ['PROCESSING', body.co_number]
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, so_number: soNumber },
      message: '서비스 오더가 생성되었습니다.'
    });
  } catch (error) {
    console.error('Service Order POST Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT - 서비스 오더 수정
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
    const updatable = ['order_type_code','biz_type','customer_code','customer_name','shipper_name','consignee_name','pol','pod','etd','eta','cargo_type','commodity','quantity','weight','volume','incoterms','execution_module','control_type','auto_release','status','remarks'];
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
    await pool.query(`UPDATE oms_service_order SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({
      success: true,
      message: '서비스 오더가 수정되었습니다.'
    });
  } catch (error) {
    console.error('Service Order PUT Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 서비스 오더 삭제
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
    await pool.query('DELETE FROM oms_service_order WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '서비스 오더가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Service Order DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
