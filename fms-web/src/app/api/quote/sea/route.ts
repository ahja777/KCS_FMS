import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 해상 견적 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('quoteId');

    // 단건 조회
    if (quoteId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          q.QUOTE_ID as id,
          q.QUOTE_NO as quoteNo,
          DATE_FORMAT(q.QUOTE_DATE, '%Y-%m-%d') as quoteDate,
          q.CUSTOMER_ID as customerId,
          c.CUSTOMER_NM as shipper,
          q.CONSIGNEE_NM as consignee,
          q.POL_PORT_CD as pol,
          q.POD_PORT_CD as pod,
          q.CARRIER_CD as carrierCd,
          cr.CARRIER_NM as carrier,
          q.CONTAINER_TYPE as containerType,
          q.CONTAINER_QTY as containerQty,
          q.INCOTERMS as incoterms,
          DATE_FORMAT(q.VALID_FROM, '%Y-%m-%d') as validFrom,
          DATE_FORMAT(q.VALID_TO, '%Y-%m-%d') as validTo,
          q.TOTAL_AMOUNT as totalAmount,
          q.CURRENCY_CD as currency,
          q.STATUS as status,
          q.REMARK as remark,
          DATE_FORMAT(q.CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM QUO_QUOTE_SEA q
        LEFT JOIN MST_CUSTOMER c ON q.CUSTOMER_ID = c.CUSTOMER_ID
        LEFT JOIN MST_CARRIER cr ON q.CARRIER_CD = cr.CARRIER_CD
        WHERE q.QUOTE_ID = ?
      `, [quoteId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    // 목록 조회
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        q.QUOTE_ID as id,
        q.QUOTE_NO as quoteNo,
        DATE_FORMAT(q.QUOTE_DATE, '%Y-%m-%d') as quoteDate,
        q.REQUEST_NO as requestNo,
        c.CUSTOMER_NM as shipper,
        q.CONSIGNEE_NM as consignee,
        q.POL_PORT_CD as pol,
        q.POD_PORT_CD as pod,
        cr.CARRIER_NM as carrier,
        q.CONTAINER_TYPE as containerType,
        q.CONTAINER_QTY as containerQty,
        DATE_FORMAT(q.VALID_FROM, '%Y-%m-%d') as validFrom,
        DATE_FORMAT(q.VALID_TO, '%Y-%m-%d') as validTo,
        q.TOTAL_AMOUNT as totalAmount,
        q.CURRENCY_CD as currency,
        q.STATUS as status
      FROM QUO_QUOTE_SEA q
      LEFT JOIN MST_CUSTOMER c ON q.CUSTOMER_ID = c.CUSTOMER_ID
      LEFT JOIN MST_CARRIER cr ON q.CARRIER_CD = cr.CARRIER_CD
      ORDER BY q.CREATED_AT DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch sea quotes' }, { status: 500 });
  }
}

// 해상 견적 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 견적 번호 생성
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(QUOTE_NO, LENGTH('SQ-${year}-') + 1) AS UNSIGNED)), 0) as max_seq FROM QUO_QUOTE_SEA WHERE QUOTE_NO LIKE ?`,
      [`SQ-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const quoteNo = `SQ-${year}-${String(count).padStart(4, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO QUO_QUOTE_SEA (
        QUOTE_NO, QUOTE_DATE, REQUEST_NO, CUSTOMER_ID, CONSIGNEE_NM,
        POL_PORT_CD, POD_PORT_CD, CARRIER_CD, CONTAINER_TYPE, CONTAINER_QTY,
        INCOTERMS, VALID_FROM, VALID_TO, TOTAL_AMOUNT, CURRENCY_CD,
        STATUS, REMARK, CREATED_AT, CREATED_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'admin')
    `, [
      quoteNo,
      body.quoteDate || new Date().toISOString().split('T')[0],
      body.requestNo || null,
      body.customerId || null,
      body.consignee || '',
      body.pol || '',
      body.pod || '',
      body.carrierCd || null,
      body.containerType || '20DC',
      body.containerQty || 1,
      body.incoterms || 'CFR',
      body.validFrom || null,
      body.validTo || null,
      body.totalAmount || 0,
      body.currency || 'USD',
      body.status || 'draft',
      body.remark || ''
    ]);

    return NextResponse.json({
      success: true,
      quoteId: result.insertId,
      quoteNo: quoteNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create sea quote' }, { status: 500 });
  }
}

// 해상 견적 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE QUO_QUOTE_SEA SET
        QUOTE_DATE = ?,
        REQUEST_NO = ?,
        CUSTOMER_ID = ?,
        CONSIGNEE_NM = ?,
        POL_PORT_CD = ?,
        POD_PORT_CD = ?,
        CARRIER_CD = ?,
        CONTAINER_TYPE = ?,
        CONTAINER_QTY = ?,
        INCOTERMS = ?,
        VALID_FROM = ?,
        VALID_TO = ?,
        TOTAL_AMOUNT = ?,
        CURRENCY_CD = ?,
        STATUS = ?,
        REMARK = ?,
        UPDATED_AT = NOW(),
        UPDATED_BY = 'admin'
      WHERE QUOTE_ID = ?
    `, [
      body.quoteDate,
      body.requestNo || null,
      body.customerId || null,
      body.consignee || '',
      body.pol || '',
      body.pod || '',
      body.carrierCd || null,
      body.containerType || '20DC',
      body.containerQty || 1,
      body.incoterms || 'CFR',
      body.validFrom || null,
      body.validTo || null,
      body.totalAmount || 0,
      body.currency || 'USD',
      body.status || 'draft',
      body.remark || '',
      body.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update sea quote' }, { status: 500 });
  }
}

// 해상 견적 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Quote IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `DELETE FROM QUO_QUOTE_SEA WHERE QUOTE_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete sea quotes' }, { status: 500 });
  }
}
