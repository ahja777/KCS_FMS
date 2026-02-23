import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateJobNo, ensureJobNoColumn } from '@/lib/jobno';

// 통관 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const declarationId = searchParams.get('declarationId');

    if (declarationId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          d.DECLARATION_ID as id,
          d.DECLARATION_NO as declarationNo,
          d.JOB_NO as jobNo,
          d.DECLARATION_TYPE as declarationType,
          DATE_FORMAT(d.DECLARATION_DATE, '%Y-%m-%d') as declarationDate,
          d.CUSTOMS_BROKER_ID as brokerId,
          b.BROKER_NM as brokerName,
          d.DECLARANT as declarant,
          d.IMPORTER_EXPORTER as importerExporter,
          d.IMPORTER_EXPORTER_BRN as brn,
          d.HS_CODE as hsCode,
          d.GOODS_DESC as goodsDesc,
          d.COUNTRY_ORIGIN as countryOrigin,
          d.PACKAGE_QTY as packageQty,
          d.GROSS_WEIGHT as grossWeight,
          d.DECLARED_VALUE as declaredValue,
          d.CURRENCY as currency,
          d.DUTY_AMOUNT as dutyAmount,
          d.VAT_AMOUNT as vatAmount,
          d.TOTAL_TAX as totalTax,
          d.STATUS as status,
          DATE_FORMAT(d.CLEARANCE_DATE, '%Y-%m-%d') as clearanceDate,
          DATE_FORMAT(d.RELEASE_DATE, '%Y-%m-%d') as releaseDate,
          d.REMARKS as remarks,
          DATE_FORMAT(d.CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM CUS_DECLARATION d
        LEFT JOIN MST_CUSTOMS_BROKER b ON d.CUSTOMS_BROKER_ID = b.BROKER_ID
        WHERE d.DECLARATION_ID = ?
      `, [declarationId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Declaration not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        d.DECLARATION_ID as id,
        d.DECLARATION_NO as declarationNo,
        d.JOB_NO as jobNo,
        d.DECLARATION_TYPE as declarationType,
        DATE_FORMAT(d.DECLARATION_DATE, '%Y-%m-%d') as declarationDate,
        b.BROKER_NM as brokerName,
        d.IMPORTER_EXPORTER as importerExporter,
        d.HS_CODE as hsCode,
        d.GOODS_DESC as goodsDesc,
        d.PACKAGE_QTY as packageQty,
        d.GROSS_WEIGHT as grossWeight,
        d.DECLARED_VALUE as declaredValue,
        d.CURRENCY as currency,
        d.TOTAL_TAX as totalTax,
        d.STATUS as status,
        DATE_FORMAT(d.CLEARANCE_DATE, '%Y-%m-%d') as clearanceDate
      FROM CUS_DECLARATION d
      LEFT JOIN MST_CUSTOMS_BROKER b ON d.CUSTOMS_BROKER_ID = b.BROKER_ID
      ORDER BY d.CREATED_AT DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch declarations' }, { status: 500 });
  }
}

// 통관 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const declarationId = `DEC${Date.now()}`;
    const year = new Date().getFullYear();
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(DECLARATION_NO, LENGTH('CUS-${year}-') + 1) AS UNSIGNED)), 0) as max_seq FROM CUS_DECLARATION WHERE DECLARATION_NO LIKE ?`,
      [`CUS-${year}-%`]
    );
    const count = Number(countResult[0].max_seq) + 1;
    const declarationNo = `CUS-${year}-${String(count).padStart(4, '0')}`;

    // shipmentId가 없으면 자동 생성
    let shipmentId = body.shipmentId;
    if (!shipmentId) {
      const [customers] = await pool.query<RowDataPacket[]>(`SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1`);
      const customerId = customers.length > 0 ? customers[0].CUSTOMER_ID : 1;
      const [shipResult] = await pool.query<ResultSetHeader>(`
        INSERT INTO ORD_SHIPMENT (SHIPMENT_NO, TRANSPORT_MODE_CD, TRADE_TYPE_CD, CUSTOMER_ID, STATUS_CD, CREATED_BY, CREATED_DTM, DEL_YN)
        VALUES (?, 'SEA', ?, ?, 'PENDING', 'admin', NOW(), 'N')
      `, [`SHP${Date.now()}`, body.declarationType || 'EXPORT', customerId]);
      shipmentId = shipResult.insertId;
    }

    // JOB_NO 자동생성
    await ensureJobNoColumn('CUS_DECLARATION');
    const jobNo = await generateJobNo('CUS_DECLARATION', 'CDE');

    await pool.query<ResultSetHeader>(`
      INSERT INTO CUS_DECLARATION (
        DECLARATION_ID, DECLARATION_NO, JOB_NO, SHIPMENT_ID, DECLARATION_TYPE, DECLARATION_DATE,
        CUSTOMS_BROKER_ID, DECLARANT, IMPORTER_EXPORTER, IMPORTER_EXPORTER_BRN,
        HS_CODE, GOODS_DESC, COUNTRY_ORIGIN, PACKAGE_QTY, GROSS_WEIGHT,
        DECLARED_VALUE, CURRENCY, DUTY_AMOUNT, VAT_AMOUNT, TOTAL_TAX,
        STATUS, CLEARANCE_DATE, RELEASE_DATE, REMARKS, CREATED_BY, CREATED_AT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, [
      declarationId,
      declarationNo,
      jobNo,
      shipmentId,
      body.declarationType || 'EXPORT',
      body.declarationDate || new Date().toISOString().split('T')[0],
      body.brokerId || null,
      body.declarant || '',
      body.importerExporter || '',
      body.brn || '',
      body.hsCode || '',
      body.goodsDesc || '',
      body.countryOrigin || '',
      body.packageQty || 0,
      body.grossWeight || 0,
      body.declaredValue || 0,
      body.currency || 'USD',
      body.dutyAmount || 0,
      body.vatAmount || 0,
      body.totalTax || 0,
      body.status || 'DRAFT',
      body.clearanceDate || null,
      body.releaseDate || null,
      body.remarks || ''
    ]);

    return NextResponse.json({
      success: true,
      declarationId,
      declarationNo,
      jobNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create declaration' }, { status: 500 });
  }
}

// 통관 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Declaration ID is required' }, { status: 400 });
    }

    // JOB_NO가 없으면 자동생성
    await ensureJobNoColumn('CUS_DECLARATION');
    const [existingDec] = await pool.query<RowDataPacket[]>(
      `SELECT JOB_NO FROM CUS_DECLARATION WHERE DECLARATION_ID = ?`, [body.id]
    );
    let jobNo = existingDec[0]?.JOB_NO || null;
    if (!jobNo) {
      jobNo = await generateJobNo('CUS_DECLARATION', 'CDE');
    }

    await pool.query(`
      UPDATE CUS_DECLARATION SET
        JOB_NO = ?,
        DECLARATION_TYPE = ?,
        DECLARATION_DATE = ?,
        CUSTOMS_BROKER_ID = ?,
        DECLARANT = ?,
        IMPORTER_EXPORTER = ?,
        IMPORTER_EXPORTER_BRN = ?,
        HS_CODE = ?,
        GOODS_DESC = ?,
        COUNTRY_ORIGIN = ?,
        PACKAGE_QTY = ?,
        GROSS_WEIGHT = ?,
        DECLARED_VALUE = ?,
        CURRENCY = ?,
        DUTY_AMOUNT = ?,
        VAT_AMOUNT = ?,
        TOTAL_TAX = ?,
        STATUS = ?,
        CLEARANCE_DATE = ?,
        RELEASE_DATE = ?,
        REMARKS = ?,
        UPDATED_BY = 'admin',
        UPDATED_AT = NOW()
      WHERE DECLARATION_ID = ?
    `, [
      jobNo,
      body.declarationType || 'EXPORT',
      body.declarationDate,
      body.brokerId || null,
      body.declarant || '',
      body.importerExporter || '',
      body.brn || '',
      body.hsCode || '',
      body.goodsDesc || '',
      body.countryOrigin || '',
      body.packageQty || 0,
      body.grossWeight || 0,
      body.declaredValue || 0,
      body.currency || 'USD',
      body.dutyAmount || 0,
      body.vatAmount || 0,
      body.totalTax || 0,
      body.status || 'DRAFT',
      body.clearanceDate || null,
      body.releaseDate || null,
      body.remarks || '',
      body.id
    ]);

    return NextResponse.json({ success: true, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update declaration' }, { status: 500 });
  }
}

// 통관 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Declaration IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',').map(id => id.trim());
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `DELETE FROM CUS_DECLARATION WHERE DECLARATION_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete declarations' }, { status: 500 });
  }
}
