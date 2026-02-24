import { NextRequest, NextResponse } from 'next/server';
import { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 테이블 생성 (최초 1회)
async function ensureTables() {
  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS FRT_CORPORATE_RATE (
      RATE_ID INT AUTO_INCREMENT PRIMARY KEY,
      RATE_NO VARCHAR(20) NOT NULL,
      TRANSPORT_MODE VARCHAR(10) NOT NULL,
      IO_TYPE VARCHAR(10) DEFAULT 'EXPORT',
      BIZ_TYPE VARCHAR(20) DEFAULT 'LOCAL',
      SALES_REP VARCHAR(100),
      CUSTOMER_CD VARCHAR(20),
      CUSTOMER_NM VARCHAR(200),
      CARRIER_CD VARCHAR(20),
      CARRIER_NM VARCHAR(200),
      POL_CD VARCHAR(10),
      POL_NM VARCHAR(100),
      POD_CD VARCHAR(10),
      POD_NM VARCHAR(100),
      POD2_CD VARCHAR(10),
      POD2_NM VARCHAR(100),
      INSURANCE_AMT DECIMAL(18,2),
      STORAGE_AMT DECIMAL(18,2),
      HANDLING_AMT DECIMAL(18,2),
      INPUT_EMPLOYEE VARCHAR(100),
      REGION_CD VARCHAR(20),
      REMARK TEXT,
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT NOW(),
      UPDATED_BY VARCHAR(50),
      UPDATED_DTM DATETIME,
      DEL_YN CHAR(1) DEFAULT 'N'
    )
  `);

  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS FRT_CORPORATE_RATE_DETAIL (
      DETAIL_ID INT AUTO_INCREMENT PRIMARY KEY,
      RATE_ID INT NOT NULL,
      DETAIL_SEQ INT DEFAULT 1,
      FREIGHT_TYPE VARCHAR(10),
      FREIGHT_CD VARCHAR(20),
      CURRENCY_CD VARCHAR(3) DEFAULT 'USD',
      RATE_MIN DECIMAL(18,2),
      RATE_BL DECIMAL(18,2),
      RATE_RTON DECIMAL(18,2),
      CNTR_DRY_20 DECIMAL(18,2),
      CNTR_DRY_40 DECIMAL(18,2),
      CNTR_TYPE_A_CD VARCHAR(10),
      CNTR_TYPE_A_RATE DECIMAL(18,2),
      CNTR_TYPE_B_CD VARCHAR(10),
      CNTR_TYPE_B_RATE DECIMAL(18,2),
      CNTR_TYPE_C_CD VARCHAR(10),
      CNTR_TYPE_C_RATE DECIMAL(18,2),
      RATE_BULK DECIMAL(18,2),
      KG_LB VARCHAR(5),
      RATE_AWB DECIMAL(18,2),
      RATE_MIN_AIR DECIMAL(18,2),
      RATE_45L DECIMAL(18,2),
      RATE_45 DECIMAL(18,2),
      RATE_100 DECIMAL(18,2),
      RATE_300 DECIMAL(18,2),
      RATE_500 DECIMAL(18,2),
      RATE_1000 DECIMAL(18,2),
      DEL_YN CHAR(1) DEFAULT 'N'
    )
  `);

  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS FRT_CORPORATE_RATE_TRANSPORT (
      TRANSPORT_ID INT AUTO_INCREMENT PRIMARY KEY,
      RATE_ID INT NOT NULL,
      TRANSPORT_SEQ INT DEFAULT 1,
      FREIGHT_CD VARCHAR(20),
      ORIGIN_CD VARCHAR(10),
      ORIGIN_NM VARCHAR(100),
      DEST_CD VARCHAR(10),
      DEST_NM VARCHAR(100),
      RATE_LCL DECIMAL(18,2),
      RATE_20FT DECIMAL(18,2),
      RATE_40FT DECIMAL(18,2),
      ETC_TRANSPORT DECIMAL(18,2),
      MANAGER_NM VARCHAR(100),
      MANAGER_TEL VARCHAR(50),
      MANAGER_FAX VARCHAR(50),
      MANAGER_EMAIL VARCHAR(200),
      DEL_YN CHAR(1) DEFAULT 'N'
    )
  `);
}

// RATE_NO 자동생성
async function generateRateNo(transportMode: string): Promise<string> {
  const prefix = transportMode === 'AIR' ? 'CA' : 'CR';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const [rows] = await queryWithLog<RowDataPacket[]>(
    `SELECT IFNULL(MAX(CAST(SUBSTRING(RATE_NO, LENGTH(?) + 1) AS UNSIGNED)), 0) as max_seq
     FROM FRT_CORPORATE_RATE WHERE RATE_NO LIKE ?`,
    [`${prefix}-${year}-`, pattern]
  );
  const seq = Number(rows[0].max_seq) + 1;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();

    const { searchParams } = new URL(request.url);
    const rateId = searchParams.get('rateId');
    const transportMode = searchParams.get('transportMode') || '';
    const ioType = searchParams.get('ioType') || '';
    const customerCd = searchParams.get('customerCd') || '';
    const carrierCd = searchParams.get('carrierCd') || '';
    const polCd = searchParams.get('polCd') || '';
    const podCd = searchParams.get('podCd') || '';

    // 단건 상세 조회
    if (rateId) {
      const [master] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM FRT_CORPORATE_RATE WHERE RATE_ID = ? AND DEL_YN = 'N'`,
        [rateId]
      );
      if (master.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const [details] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM FRT_CORPORATE_RATE_DETAIL WHERE RATE_ID = ? AND DEL_YN = 'N' ORDER BY DETAIL_SEQ`,
        [rateId]
      );

      const [transports] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM FRT_CORPORATE_RATE_TRANSPORT WHERE RATE_ID = ? AND DEL_YN = 'N' ORDER BY TRANSPORT_SEQ`,
        [rateId]
      );

      return NextResponse.json({
        ...master[0],
        details,
        transports,
      });
    }

    // 목록 조회
    let sql = `SELECT RATE_ID, RATE_NO, TRANSPORT_MODE, IO_TYPE, BIZ_TYPE,
      CUSTOMER_CD, CUSTOMER_NM, CARRIER_CD, CARRIER_NM,
      POL_CD, POL_NM, POD_CD, POD_NM, POD2_CD, POD2_NM,
      INSURANCE_AMT, STORAGE_AMT, HANDLING_AMT, INPUT_EMPLOYEE,
      DATE_FORMAT(CREATED_DTM, '%Y-%m-%d') as CREATED_DATE
      FROM FRT_CORPORATE_RATE WHERE DEL_YN = 'N'`;
    const params: unknown[] = [];

    if (transportMode) {
      sql += ' AND TRANSPORT_MODE = ?';
      params.push(transportMode);
    }
    if (ioType) {
      sql += ' AND IO_TYPE = ?';
      params.push(ioType);
    }
    if (customerCd) {
      sql += ' AND CUSTOMER_CD LIKE ?';
      params.push(`%${customerCd}%`);
    }
    if (carrierCd) {
      sql += ' AND CARRIER_CD LIKE ?';
      params.push(`%${carrierCd}%`);
    }
    if (polCd) {
      sql += ' AND POL_CD = ?';
      params.push(polCd);
    }
    if (podCd) {
      sql += ' AND POD_CD = ?';
      params.push(podCd);
    }

    sql += ' ORDER BY CREATED_DTM DESC';

    const [rows] = await queryWithLog<RowDataPacket[]>(sql, params);

    // 목록에 detail/transport 첫 행 포함
    const enriched = [];
    for (const row of rows) {
      const [details] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM FRT_CORPORATE_RATE_DETAIL WHERE RATE_ID = ? AND DEL_YN = 'N' ORDER BY DETAIL_SEQ LIMIT 5`,
        [row.RATE_ID]
      );
      const [transports] = await queryWithLog<RowDataPacket[]>(
        `SELECT * FROM FRT_CORPORATE_RATE_TRANSPORT WHERE RATE_ID = ? AND DEL_YN = 'N' ORDER BY TRANSPORT_SEQ LIMIT 3`,
        [row.RATE_ID]
      );
      enriched.push({ ...row, details, transports });
    }

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Corporate rate GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();

    const rateNo = await generateRateNo(body.transportMode || 'SEA');

    const [result] = await queryWithLog<ResultSetHeader>(`
      INSERT INTO FRT_CORPORATE_RATE (
        RATE_NO, TRANSPORT_MODE, IO_TYPE, BIZ_TYPE, SALES_REP,
        CUSTOMER_CD, CUSTOMER_NM, CARRIER_CD, CARRIER_NM,
        POL_CD, POL_NM, POD_CD, POD_NM, POD2_CD, POD2_NM,
        INSURANCE_AMT, STORAGE_AMT, HANDLING_AMT,
        INPUT_EMPLOYEE, REGION_CD, REMARK,
        CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, [
      rateNo,
      body.transportMode || 'SEA',
      body.ioType || 'EXPORT',
      body.bizType || 'LOCAL',
      body.salesRep || null,
      body.customerCd || null,
      body.customerNm || null,
      body.carrierCd || null,
      body.carrierNm || null,
      body.polCd || null,
      body.polNm || null,
      body.podCd || null,
      body.podNm || null,
      body.pod2Cd || null,
      body.pod2Nm || null,
      body.insuranceAmt || 0,
      body.storageAmt || 0,
      body.handlingAmt || 0,
      body.inputEmployee || null,
      body.regionCd || null,
      body.remark || null,
    ]);

    const rateId = result.insertId;

    // Detail rows
    if (body.details && Array.isArray(body.details)) {
      for (let i = 0; i < body.details.length; i++) {
        const d = body.details[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO FRT_CORPORATE_RATE_DETAIL (
            RATE_ID, DETAIL_SEQ, FREIGHT_TYPE, FREIGHT_CD, CURRENCY_CD,
            RATE_MIN, RATE_BL, RATE_RTON, CNTR_DRY_20, CNTR_DRY_40,
            CNTR_TYPE_A_CD, CNTR_TYPE_A_RATE, CNTR_TYPE_B_CD, CNTR_TYPE_B_RATE,
            CNTR_TYPE_C_CD, CNTR_TYPE_C_RATE, RATE_BULK,
            KG_LB, RATE_AWB, RATE_MIN_AIR, RATE_45L, RATE_45,
            RATE_100, RATE_300, RATE_500, RATE_1000
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rateId, i + 1,
          d.freightType || null, d.freightCd || null, d.currencyCd || 'USD',
          d.rateMin || 0, d.rateBl || 0, d.rateRton || 0,
          d.cntrDry20 || 0, d.cntrDry40 || 0,
          d.cntrTypeACd || null, d.cntrTypeARate || 0,
          d.cntrTypeBCd || null, d.cntrTypeBRate || 0,
          d.cntrTypeCCd || null, d.cntrTypeCRate || 0,
          d.rateBulk || 0,
          d.kgLb || null, d.rateAwb || 0, d.rateMinAir || 0,
          d.rate45l || 0, d.rate45 || 0,
          d.rate100 || 0, d.rate300 || 0, d.rate500 || 0, d.rate1000 || 0,
        ]);
      }
    }

    // Transport rows
    if (body.transports && Array.isArray(body.transports)) {
      for (let i = 0; i < body.transports.length; i++) {
        const t = body.transports[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO FRT_CORPORATE_RATE_TRANSPORT (
            RATE_ID, TRANSPORT_SEQ, FREIGHT_CD,
            ORIGIN_CD, ORIGIN_NM, DEST_CD, DEST_NM,
            RATE_LCL, RATE_20FT, RATE_40FT, ETC_TRANSPORT,
            MANAGER_NM, MANAGER_TEL, MANAGER_FAX, MANAGER_EMAIL
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rateId, i + 1,
          t.freightCd || null,
          t.originCd || null, t.originNm || null,
          t.destCd || null, t.destNm || null,
          t.rateLcl || 0, t.rate20ft || 0, t.rate40ft || 0,
          t.etcTransport || 0,
          t.managerNm || null, t.managerTel || null,
          t.managerFax || null, t.managerEmail || null,
        ]);
      }
    }

    return NextResponse.json({ success: true, rateId, rateNo });
  } catch (error) {
    console.error('Corporate rate POST error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();

    if (!body.rateId) {
      return NextResponse.json({ error: 'rateId is required' }, { status: 400 });
    }

    await queryWithLog<ResultSetHeader>(`
      UPDATE FRT_CORPORATE_RATE SET
        IO_TYPE = ?, BIZ_TYPE = ?, SALES_REP = ?,
        CUSTOMER_CD = ?, CUSTOMER_NM = ?,
        CARRIER_CD = ?, CARRIER_NM = ?,
        POL_CD = ?, POL_NM = ?, POD_CD = ?, POD_NM = ?,
        POD2_CD = ?, POD2_NM = ?,
        INSURANCE_AMT = ?, STORAGE_AMT = ?, HANDLING_AMT = ?,
        INPUT_EMPLOYEE = ?, REGION_CD = ?, REMARK = ?,
        UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE RATE_ID = ?
    `, [
      body.ioType || 'EXPORT', body.bizType || 'LOCAL', body.salesRep || null,
      body.customerCd || null, body.customerNm || null,
      body.carrierCd || null, body.carrierNm || null,
      body.polCd || null, body.polNm || null,
      body.podCd || null, body.podNm || null,
      body.pod2Cd || null, body.pod2Nm || null,
      body.insuranceAmt || 0, body.storageAmt || 0, body.handlingAmt || 0,
      body.inputEmployee || null, body.regionCd || null, body.remark || null,
      body.rateId,
    ]);

    // Soft delete old details, re-insert
    await queryWithLog<ResultSetHeader>(
      `UPDATE FRT_CORPORATE_RATE_DETAIL SET DEL_YN = 'Y' WHERE RATE_ID = ?`,
      [body.rateId]
    );
    if (body.details && Array.isArray(body.details)) {
      for (let i = 0; i < body.details.length; i++) {
        const d = body.details[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO FRT_CORPORATE_RATE_DETAIL (
            RATE_ID, DETAIL_SEQ, FREIGHT_TYPE, FREIGHT_CD, CURRENCY_CD,
            RATE_MIN, RATE_BL, RATE_RTON, CNTR_DRY_20, CNTR_DRY_40,
            CNTR_TYPE_A_CD, CNTR_TYPE_A_RATE, CNTR_TYPE_B_CD, CNTR_TYPE_B_RATE,
            CNTR_TYPE_C_CD, CNTR_TYPE_C_RATE, RATE_BULK,
            KG_LB, RATE_AWB, RATE_MIN_AIR, RATE_45L, RATE_45,
            RATE_100, RATE_300, RATE_500, RATE_1000
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          body.rateId, i + 1,
          d.freightType || null, d.freightCd || null, d.currencyCd || 'USD',
          d.rateMin || 0, d.rateBl || 0, d.rateRton || 0,
          d.cntrDry20 || 0, d.cntrDry40 || 0,
          d.cntrTypeACd || null, d.cntrTypeARate || 0,
          d.cntrTypeBCd || null, d.cntrTypeBRate || 0,
          d.cntrTypeCCd || null, d.cntrTypeCRate || 0,
          d.rateBulk || 0,
          d.kgLb || null, d.rateAwb || 0, d.rateMinAir || 0,
          d.rate45l || 0, d.rate45 || 0,
          d.rate100 || 0, d.rate300 || 0, d.rate500 || 0, d.rate1000 || 0,
        ]);
      }
    }

    // Soft delete old transports, re-insert
    await queryWithLog<ResultSetHeader>(
      `UPDATE FRT_CORPORATE_RATE_TRANSPORT SET DEL_YN = 'Y' WHERE RATE_ID = ?`,
      [body.rateId]
    );
    if (body.transports && Array.isArray(body.transports)) {
      for (let i = 0; i < body.transports.length; i++) {
        const t = body.transports[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO FRT_CORPORATE_RATE_TRANSPORT (
            RATE_ID, TRANSPORT_SEQ, FREIGHT_CD,
            ORIGIN_CD, ORIGIN_NM, DEST_CD, DEST_NM,
            RATE_LCL, RATE_20FT, RATE_40FT, ETC_TRANSPORT,
            MANAGER_NM, MANAGER_TEL, MANAGER_FAX, MANAGER_EMAIL
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          body.rateId, i + 1,
          t.freightCd || null,
          t.originCd || null, t.originNm || null,
          t.destCd || null, t.destNm || null,
          t.rateLcl || 0, t.rate20ft || 0, t.rate40ft || 0,
          t.etcTransport || 0,
          t.managerNm || null, t.managerTel || null,
          t.managerFax || null, t.managerEmail || null,
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Corporate rate PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'ids is required' }, { status: 400 });
    }

    const idArray = ids.split(',').map(Number);
    const placeholders = idArray.map(() => '?').join(',');

    await queryWithLog<ResultSetHeader>(
      `UPDATE FRT_CORPORATE_RATE SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE RATE_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Corporate rate DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
