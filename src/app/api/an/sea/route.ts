import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 해상수입 도착통지(A/N) 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 상세 조회
      const [rows] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM TRN_AN_SEA WHERE AN_ID = ?`,
        [id]
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    // 목록 조회
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const anNo = searchParams.get('anNo');
    const blNo = searchParams.get('blNo');
    const consignee = searchParams.get('consignee');
    const cargoStatus = searchParams.get('cargoStatus');
    const customsStatus = searchParams.get('customsStatus');
    const status = searchParams.get('status');

    let sql = `SELECT * FROM TRN_AN_SEA WHERE 1=1`;
    const params: (string | number)[] = [];

    if (startDate && endDate) {
      sql += ` AND AN_DATE BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (anNo) {
      sql += ` AND AN_NO LIKE ?`;
      params.push(`%${anNo}%`);
    }
    if (blNo) {
      sql += ` AND (BL_NO LIKE ? OR HBL_NO LIKE ?)`;
      params.push(`%${blNo}%`, `%${blNo}%`);
    }
    if (consignee) {
      sql += ` AND CONSIGNEE LIKE ?`;
      params.push(`%${consignee}%`);
    }
    if (cargoStatus) {
      sql += ` AND CARGO_STATUS = ?`;
      params.push(cargoStatus);
    }
    if (customsStatus) {
      sql += ` AND CUSTOMS_STATUS = ?`;
      params.push(customsStatus);
    }
    if (status) {
      sql += ` AND STATUS = ?`;
      params.push(status);
    }

    sql += ` ORDER BY AN_DATE DESC, AN_ID DESC`;

    const [rows] = await queryWithLog<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching A/N list:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// 해상수입 도착통지(A/N) 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // A/N 번호 자동 생성
    const today = new Date();
    const year = today.getFullYear();
    const [countResult] = await queryWithLog<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM TRN_AN_SEA WHERE AN_NO LIKE ?`,
      [`AN-SEA-${year}-%`]
    );
    const count = (countResult[0]?.cnt || 0) + 1;
    const anNo = `AN-SEA-${year}-${String(count).padStart(4, '0')}`;

    const [result] = await queryWithLog<ResultSetHeader>(
      `INSERT INTO TRN_AN_SEA (
        AN_NO, AN_DATE, BL_NO, HBL_NO, SHIPPER, SHIPPER_ADDR, CONSIGNEE, CONSIGNEE_ADDR,
        NOTIFY_PARTY, NOTIFY_ADDR, CARRIER_CD, CARRIER_NM, VESSEL_NM, VOYAGE_NO,
        POL, POD, FINAL_DEST, ETD, ATD, ETA, ATA,
        CARGO_STATUS, CUSTOMS_STATUS, CONTAINER_INFO, CONTAINER_CNT, PACKAGE_CNT,
        GROSS_WEIGHT, MEASUREMENT, COMMODITY, FREIGHT_TYPE, FREIGHT_AMT, CURRENCY,
        STORAGE_INFO, DO_NO, DO_ISSUE_DATE, STATUS, REMARKS, CRT_USER
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        anNo,
        body.anDate || today.toISOString().split('T')[0],
        body.blNo || null,
        body.hblNo || null,
        body.shipper || null,
        body.shipperAddr || null,
        body.consignee || null,
        body.consigneeAddr || null,
        body.notifyParty || null,
        body.notifyAddr || null,
        body.carrierCd || null,
        body.carrierNm || null,
        body.vesselNm || null,
        body.voyageNo || null,
        body.pol || null,
        body.pod || null,
        body.finalDest || null,
        body.etd || null,
        body.atd || null,
        body.eta || null,
        body.ata || null,
        body.cargoStatus || 'IN_TRANSIT',
        body.customsStatus || 'PENDING',
        body.containerInfo || null,
        body.containerCnt || 0,
        body.packageCnt || 0,
        body.grossWeight || 0,
        body.measurement || 0,
        body.commodity || null,
        body.freightType || null,
        body.freightAmt || 0,
        body.currency || null,
        body.storageInfo || null,
        body.doNo || null,
        body.doIssueDate || null,
        body.status || 'DRAFT',
        body.remarks || null,
        body.crtUser || 'SYSTEM'
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      anNo: anNo
    });
  } catch (error) {
    console.error('Error creating A/N:', error);
    return NextResponse.json({ error: 'Failed to create data' }, { status: 500 });
  }
}

// 해상수입 도착통지(A/N) 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    const fieldMap: Record<string, string> = {
      anDate: 'AN_DATE',
      blNo: 'BL_NO',
      hblNo: 'HBL_NO',
      shipper: 'SHIPPER',
      shipperAddr: 'SHIPPER_ADDR',
      consignee: 'CONSIGNEE',
      consigneeAddr: 'CONSIGNEE_ADDR',
      notifyParty: 'NOTIFY_PARTY',
      notifyAddr: 'NOTIFY_ADDR',
      carrierCd: 'CARRIER_CD',
      carrierNm: 'CARRIER_NM',
      vesselNm: 'VESSEL_NM',
      voyageNo: 'VOYAGE_NO',
      pol: 'POL',
      pod: 'POD',
      finalDest: 'FINAL_DEST',
      etd: 'ETD',
      atd: 'ATD',
      eta: 'ETA',
      ata: 'ATA',
      cargoStatus: 'CARGO_STATUS',
      customsStatus: 'CUSTOMS_STATUS',
      containerInfo: 'CONTAINER_INFO',
      containerCnt: 'CONTAINER_CNT',
      packageCnt: 'PACKAGE_CNT',
      grossWeight: 'GROSS_WEIGHT',
      measurement: 'MEASUREMENT',
      commodity: 'COMMODITY',
      freightType: 'FREIGHT_TYPE',
      freightAmt: 'FREIGHT_AMT',
      currency: 'CURRENCY',
      storageInfo: 'STORAGE_INFO',
      doNo: 'DO_NO',
      doIssueDate: 'DO_ISSUE_DATE',
      anSentYn: 'AN_SENT_YN',
      anSentDate: 'AN_SENT_DATE',
      status: 'STATUS',
      remarks: 'REMARKS',
      updUser: 'UPD_USER'
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (fieldMap[key]) {
        setClauses.push(`${fieldMap[key]} = ?`);
        params.push(value === '' ? null : value as string | number | null);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);

    await queryWithLog<ResultSetHeader>(
      `UPDATE TRN_AN_SEA SET ${setClauses.join(', ')} WHERE AN_ID = ?`,
      params
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating A/N:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

// 해상수입 도착통지(A/N) 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await queryWithLog<ResultSetHeader>(
      `DELETE FROM TRN_AN_SEA WHERE AN_ID = ?`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting A/N:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
