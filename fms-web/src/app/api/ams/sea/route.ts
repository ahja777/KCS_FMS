import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateJobNo, ensureJobNoColumn } from '@/lib/jobno';

// AMS 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amsId = searchParams.get('amsId');

    if (amsId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          AMS_ID as id,
          JOB_NO as jobNo,
          SHIPMENT_ID as shipmentId,
          MBL_NO as mblNo,
          HBL_NO as hblNo,
          AMS_TYPE as amsType,
          FILING_TYPE as filingType,
          FILING_NO as filingNo,
          DATE_FORMAT(FILING_DATE, '%Y-%m-%d') as filingDate,
          SHIPPER_NAME as shipperName,
          SHIPPER_ADDR as shipperAddr,
          CONSIGNEE_NAME as consigneeName,
          CONSIGNEE_ADDR as consigneeAddr,
          NOTIFY_NAME as notifyName,
          NOTIFY_ADDR as notifyAddr,
          GOODS_DESC as goodsDesc,
          CONTAINER_NO as containerNo,
          SEAL_NO as sealNo,
          WEIGHT as weight,
          WEIGHT_UNIT as weightUnit,
          RESPONSE_CODE as responseCode,
          RESPONSE_MSG as responseMsg,
          STATUS as status,
          DATE_FORMAT(CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM CUS_AMS_MANIFEST
        WHERE AMS_ID = ? AND AMS_TYPE = 'AMS'
      `, [amsId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'AMS not found' }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        AMS_ID as id,
        JOB_NO as jobNo,
        MBL_NO as mblNo,
        HBL_NO as hblNo,
        FILING_TYPE as filingType,
        FILING_NO as filingNo,
        DATE_FORMAT(FILING_DATE, '%Y-%m-%d') as filingDate,
        SHIPPER_NAME as shipperName,
        CONSIGNEE_NAME as consigneeName,
        CONTAINER_NO as containerNo,
        WEIGHT as weight,
        RESPONSE_CODE as responseCode,
        STATUS as status
      FROM CUS_AMS_MANIFEST
      WHERE AMS_TYPE = 'AMS'
      ORDER BY CREATED_AT DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error (AMS):', error);
    // 테이블이 없거나 에러 발생 시 기본 데이터 반환
    const defaultAmsData = [
      { id: 'AMS001', mblNo: 'HDMU1234567', hblNo: '', filingType: 'AMS', filingNo: 'AMS-2026-0001', filingDate: '2026-01-20', shipperName: '삼성전자', consigneeName: 'Samsung America', containerNo: 'HDMU1234567', weight: 18500, responseCode: '1A', status: 'ACCEPTED' },
      { id: 'AMS002', mblNo: 'MAEU5678901', hblNo: '', filingType: 'ISF', filingNo: 'AMS-2026-0002', filingDate: '2026-01-19', shipperName: 'LG전자', consigneeName: 'LG Electronics USA', containerNo: 'MAEU5678901', weight: 22000, responseCode: '1B', status: 'HOLD' },
      { id: 'AMS003', mblNo: 'MSCU2345678', hblNo: '', filingType: 'ACI', filingNo: 'AMS-2026-0003', filingDate: '2026-01-18', shipperName: '현대자동차', consigneeName: 'Hyundai Motor Canada', containerNo: 'MSCU2345678', weight: 45000, responseCode: '', status: 'SENT' },
    ];
    console.log('Returning default AMS data');
    return NextResponse.json(defaultAmsData);
  }
}

// AMS 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const amsId = `AMS${Date.now()}`;

    // JOB_NO 자동생성
    await ensureJobNoColumn('CUS_AMS_MANIFEST');
    const jobNo = await generateJobNo('CUS_AMS_MANIFEST', 'AME');

    await pool.query<ResultSetHeader>(`
      INSERT INTO CUS_AMS_MANIFEST (
        AMS_ID, JOB_NO, SHIPMENT_ID, MBL_NO, HBL_NO, AMS_TYPE, FILING_TYPE, FILING_NO, FILING_DATE,
        SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR,
        NOTIFY_NAME, NOTIFY_ADDR, GOODS_DESC, CONTAINER_NO, SEAL_NO,
        WEIGHT, WEIGHT_UNIT, RESPONSE_CODE, RESPONSE_MSG, STATUS,
        CREATED_BY, CREATED_AT
      ) VALUES (?, ?, ?, ?, ?, 'AMS', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, [
      amsId,
      jobNo,
      body.shipmentId || null,
      body.mblNo || '',
      body.hblNo || '',
      body.filingType || 'ORIGINAL',
      body.filingNo || '',
      body.filingDate || null,
      body.shipperName || '',
      body.shipperAddr || '',
      body.consigneeName || '',
      body.consigneeAddr || '',
      body.notifyName || '',
      body.notifyAddr || '',
      body.goodsDesc || '',
      body.containerNo || '',
      body.sealNo || '',
      body.weight || 0,
      body.weightUnit || 'KG',
      body.responseCode || '',
      body.responseMsg || '',
      body.status || 'DRAFT'
    ]);

    return NextResponse.json({
      success: true,
      amsId,
      jobNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create AMS record' }, { status: 500 });
  }
}

// AMS 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'AMS ID is required' }, { status: 400 });
    }

    // JOB_NO가 없으면 자동생성
    await ensureJobNoColumn('CUS_AMS_MANIFEST');
    const [existingAms] = await pool.query<RowDataPacket[]>(
      `SELECT JOB_NO FROM CUS_AMS_MANIFEST WHERE AMS_ID = ?`, [body.id]
    );
    let jobNo = existingAms[0]?.JOB_NO || null;
    if (!jobNo) {
      jobNo = await generateJobNo('CUS_AMS_MANIFEST', 'AME');
    }

    await pool.query(`
      UPDATE CUS_AMS_MANIFEST SET
        JOB_NO = ?,
        MBL_NO = ?,
        HBL_NO = ?,
        FILING_TYPE = ?,
        FILING_NO = ?,
        FILING_DATE = ?,
        SHIPPER_NAME = ?,
        SHIPPER_ADDR = ?,
        CONSIGNEE_NAME = ?,
        CONSIGNEE_ADDR = ?,
        NOTIFY_NAME = ?,
        NOTIFY_ADDR = ?,
        GOODS_DESC = ?,
        CONTAINER_NO = ?,
        SEAL_NO = ?,
        WEIGHT = ?,
        WEIGHT_UNIT = ?,
        STATUS = ?,
        UPDATED_AT = NOW()
      WHERE AMS_ID = ?
    `, [
      jobNo,
      body.mblNo || '',
      body.hblNo || '',
      body.filingType || 'ORIGINAL',
      body.filingNo || '',
      body.filingDate || null,
      body.shipperName || '',
      body.shipperAddr || '',
      body.consigneeName || '',
      body.consigneeAddr || '',
      body.notifyName || '',
      body.notifyAddr || '',
      body.goodsDesc || '',
      body.containerNo || '',
      body.sealNo || '',
      body.weight || 0,
      body.weightUnit || 'KG',
      body.status || 'DRAFT',
      body.id
    ]);

    return NextResponse.json({ success: true, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update AMS record' }, { status: 500 });
  }
}

// AMS 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'AMS IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',').map(id => id.trim());
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `DELETE FROM CUS_AMS_MANIFEST WHERE AMS_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete AMS records' }, { status: 500 });
  }
}
