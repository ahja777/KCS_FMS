import { NextRequest, NextResponse } from 'next/server';
import { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 테이블 초기화 (앱 시작 시 1회)
let tablesCreated = false;

async function ensureTables() {
  if (tablesCreated) return;

  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS QUO_QUOTE_REQUEST (
      REQUEST_ID      INT AUTO_INCREMENT PRIMARY KEY,
      REQUEST_NO      VARCHAR(20) NOT NULL,
      REQUEST_DATE    DATE NOT NULL,
      BIZ_TYPE        VARCHAR(10) DEFAULT 'SEA',
      IO_TYPE         VARCHAR(10) DEFAULT 'EXPORT',
      CUSTOMER_ID     INT NULL,
      CUSTOMER_NM     VARCHAR(200) NULL,
      INPUT_EMPLOYEE  VARCHAR(100) NULL,
      ORIGIN_CD       VARCHAR(10) NULL,
      ORIGIN_NM       VARCHAR(100) NULL,
      DEST_CD         VARCHAR(10) NULL,
      DEST_NM         VARCHAR(100) NULL,
      INCOTERMS       VARCHAR(10) DEFAULT 'CIF',
      SHIPPING_DATE   DATE NULL,
      COMMODITY       VARCHAR(200) NULL,
      CARGO_TYPE      VARCHAR(20) DEFAULT 'GENERAL',
      WEIGHT_KG       DECIMAL(18,3) NULL,
      VOLUME_CBM      DECIMAL(18,3) NULL,
      QUANTITY        INT NULL,
      TOTAL_AMOUNT    DECIMAL(18,2) DEFAULT 0,
      CURRENCY_CD     VARCHAR(3) DEFAULT 'USD',
      STATUS          VARCHAR(20) DEFAULT '01',
      REMARK          TEXT NULL,
      CREATED_BY      VARCHAR(50) DEFAULT 'admin',
      CREATED_DTM     DATETIME DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY      VARCHAR(50) NULL,
      UPDATED_DTM     DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
      DEL_YN          CHAR(1) DEFAULT 'N',
      INDEX idx_qr_request_no (REQUEST_NO),
      INDEX idx_qr_biz_type (BIZ_TYPE),
      INDEX idx_qr_status (STATUS),
      INDEX idx_qr_created_dtm (CREATED_DTM)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS QUO_QUOTE_REQUEST_RATE (
      RATE_ID         INT AUTO_INCREMENT PRIMARY KEY,
      REQUEST_ID      INT NOT NULL,
      RATE_SEQ        INT DEFAULT 1,
      RATE_TYPE       VARCHAR(50) NULL,
      RATE_CD         VARCHAR(50) NULL,
      CURRENCY_CD     VARCHAR(3) DEFAULT 'USD',
      REMARK          VARCHAR(500) NULL,
      RATE_MIN        DECIMAL(18,2) NULL,
      RATE_45L        DECIMAL(18,2) NULL,
      RATE_45         DECIMAL(18,2) NULL,
      RATE_100        DECIMAL(18,2) NULL,
      RATE_300        DECIMAL(18,2) NULL,
      RATE_500        DECIMAL(18,2) NULL,
      RATE_1000       DECIMAL(18,2) NULL,
      RATE_PER_KG     DECIMAL(18,2) NULL,
      RATE_BL         DECIMAL(18,2) NULL,
      RATE_PER_MIN    DECIMAL(18,2) NULL,
      RATE_PER_BL     DECIMAL(18,2) NULL,
      RATE_PER_RTON   DECIMAL(18,2) NULL,
      RATE_DRY_20     DECIMAL(18,2) NULL,
      RATE_DRY_40     DECIMAL(18,2) NULL,
      CNTR_TYPE_A_CD  VARCHAR(20) NULL,
      CNTR_TYPE_A_RATE DECIMAL(18,2) NULL,
      CNTR_TYPE_B_CD  VARCHAR(20) NULL,
      CNTR_TYPE_B_RATE DECIMAL(18,2) NULL,
      CNTR_TYPE_C_CD  VARCHAR(20) NULL,
      CNTR_TYPE_C_RATE DECIMAL(18,2) NULL,
      RATE_BULK       DECIMAL(18,2) NULL,
      DEL_YN          CHAR(1) DEFAULT 'N',
      INDEX idx_qrr_request_id (REQUEST_ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await queryWithLog<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS QUO_QUOTE_REQUEST_TRANSPORT (
      TRANSPORT_ID    INT AUTO_INCREMENT PRIMARY KEY,
      REQUEST_ID      INT NOT NULL,
      TRANSPORT_SEQ   INT DEFAULT 1,
      RATE_CD         VARCHAR(50) NULL,
      ORIGIN_CD       VARCHAR(10) NULL,
      ORIGIN_NM       VARCHAR(100) NULL,
      DEST_CD         VARCHAR(10) NULL,
      DEST_NM         VARCHAR(100) NULL,
      ETC_DESC        VARCHAR(500) NULL,
      CONTACT_NM      VARCHAR(100) NULL,
      CONTACT_TEL     VARCHAR(50) NULL,
      CONTACT_FAX     VARCHAR(50) NULL,
      CONTACT_EMAIL   VARCHAR(200) NULL,
      TRANSPORT_TYPE  VARCHAR(50) NULL,
      VEHICLE_TYPE    VARCHAR(50) NULL,
      AMOUNT          DECIMAL(18,2) NULL,
      RATE_LCL        DECIMAL(18,2) NULL,
      RATE_20FT       DECIMAL(18,2) NULL,
      RATE_40FT       DECIMAL(18,2) NULL,
      DEL_YN          CHAR(1) DEFAULT 'N',
      INDEX idx_qrt_request_id (REQUEST_ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  tablesCreated = true;
}

// GET: 목록 조회 / 단건 조회
export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    // 단건 조회 (메인 + 운임정보 + 운송요율)
    if (requestId) {
      const [rows] = await queryWithLog<RowDataPacket[]>(`
        SELECT
          REQUEST_ID as id,
          REQUEST_NO as requestNo,
          DATE_FORMAT(REQUEST_DATE, '%Y-%m-%d') as requestDate,
          BIZ_TYPE as bizType,
          IO_TYPE as ioType,
          CUSTOMER_ID as customerId,
          CUSTOMER_NM as customerNm,
          INPUT_EMPLOYEE as inputEmployee,
          ORIGIN_CD as originCd,
          ORIGIN_NM as originNm,
          DEST_CD as destCd,
          DEST_NM as destNm,
          INCOTERMS as incoterms,
          DATE_FORMAT(SHIPPING_DATE, '%Y-%m-%d') as shippingDate,
          COMMODITY as commodity,
          CARGO_TYPE as cargoType,
          WEIGHT_KG as weightKg,
          VOLUME_CBM as volumeCbm,
          QUANTITY as quantity,
          TOTAL_AMOUNT as totalAmount,
          CURRENCY_CD as currencyCd,
          STATUS as status,
          REMARK as remark,
          CREATED_BY as createdBy,
          DATE_FORMAT(CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdDtm,
          UPDATED_BY as updatedBy,
          DATE_FORMAT(UPDATED_DTM, '%Y-%m-%d %H:%i:%s') as updatedDtm
        FROM QUO_QUOTE_REQUEST
        WHERE REQUEST_ID = ? AND DEL_YN = 'N'
      `, [requestId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      // 운임정보
      const [rateRows] = await queryWithLog<RowDataPacket[]>(`
        SELECT
          RATE_ID as rateId, RATE_SEQ as rateSeq, RATE_TYPE as rateType,
          RATE_CD as rateCd, CURRENCY_CD as currencyCd, REMARK as remark,
          RATE_MIN as rateMin, RATE_45L as rate45l, RATE_45 as rate45,
          RATE_100 as rate100, RATE_300 as rate300, RATE_500 as rate500,
          RATE_1000 as rate1000, RATE_PER_KG as ratePerKg, RATE_BL as rateBl,
          RATE_PER_MIN as ratePerMin, RATE_PER_BL as ratePerBl,
          RATE_PER_RTON as ratePerRton, RATE_DRY_20 as rateDry20,
          RATE_DRY_40 as rateDry40, CNTR_TYPE_A_CD as cntrTypeACd,
          CNTR_TYPE_A_RATE as cntrTypeARate, CNTR_TYPE_B_CD as cntrTypeBCd,
          CNTR_TYPE_B_RATE as cntrTypeBRate, CNTR_TYPE_C_CD as cntrTypeCCd,
          CNTR_TYPE_C_RATE as cntrTypeCRate, RATE_BULK as rateBulk
        FROM QUO_QUOTE_REQUEST_RATE
        WHERE REQUEST_ID = ? AND DEL_YN = 'N'
        ORDER BY RATE_SEQ
      `, [requestId]);

      // 운송요율
      const [transportRows] = await queryWithLog<RowDataPacket[]>(`
        SELECT
          TRANSPORT_ID as transportId, TRANSPORT_SEQ as transportSeq,
          RATE_CD as rateCd, ORIGIN_CD as originCd, ORIGIN_NM as originNm,
          DEST_CD as destCd, DEST_NM as destNm, ETC_DESC as etcDesc,
          CONTACT_NM as contactNm, CONTACT_TEL as contactTel,
          CONTACT_FAX as contactFax, CONTACT_EMAIL as contactEmail,
          TRANSPORT_TYPE as transportType, VEHICLE_TYPE as vehicleType,
          AMOUNT as amount, RATE_LCL as rateLcl,
          RATE_20FT as rate20ft, RATE_40FT as rate40ft
        FROM QUO_QUOTE_REQUEST_TRANSPORT
        WHERE REQUEST_ID = ? AND DEL_YN = 'N'
        ORDER BY TRANSPORT_SEQ
      `, [requestId]);

      return NextResponse.json({
        ...rows[0],
        rateInfoList: rateRows,
        transportRateList: transportRows,
      });
    }

    // 목록 조회 (필터 지원)
    const bizType = searchParams.get('bizType');
    const ioType = searchParams.get('ioType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const customer = searchParams.get('customer');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const quoteNo = searchParams.get('quoteNo');

    let sql = `
      SELECT
        REQUEST_ID as id,
        REQUEST_NO as requestNo,
        DATE_FORMAT(REQUEST_DATE, '%Y-%m-%d') as requestDate,
        BIZ_TYPE as bizType,
        IO_TYPE as ioType,
        CUSTOMER_NM as customerNm,
        INPUT_EMPLOYEE as inputEmployee,
        ORIGIN_CD as originCd,
        ORIGIN_NM as originNm,
        DEST_CD as destCd,
        DEST_NM as destNm,
        INCOTERMS as incoterms,
        TOTAL_AMOUNT as totalAmount,
        CURRENCY_CD as currencyCd,
        STATUS as status
      FROM QUO_QUOTE_REQUEST
      WHERE DEL_YN = 'N'
    `;
    const params: unknown[] = [];

    if (bizType) { sql += ' AND BIZ_TYPE = ?'; params.push(bizType); }
    if (ioType) { sql += ' AND IO_TYPE = ?'; params.push(ioType); }
    if (status) { sql += ' AND STATUS = ?'; params.push(status); }
    if (dateFrom) { sql += ' AND REQUEST_DATE >= ?'; params.push(dateFrom); }
    if (dateTo) { sql += ' AND REQUEST_DATE <= ?'; params.push(dateTo); }
    if (customer) { sql += ' AND CUSTOMER_NM LIKE ?'; params.push(`%${customer}%`); }
    if (origin) { sql += ' AND (ORIGIN_CD LIKE ? OR ORIGIN_NM LIKE ?)'; params.push(`%${origin}%`, `%${origin}%`); }
    if (destination) { sql += ' AND (DEST_CD LIKE ? OR DEST_NM LIKE ?)'; params.push(`%${destination}%`, `%${destination}%`); }
    if (quoteNo) { sql += ' AND REQUEST_NO LIKE ?'; params.push(`%${quoteNo}%`); }

    sql += ' ORDER BY CREATED_DTM DESC';

    const [rows] = await queryWithLog<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch quote requests' }, { status: 500 });
  }
}

// POST: 견적요청 등록
export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();

    // 견적번호 자동생성: QR-YYYY-NNNN
    const year = new Date().getFullYear();
    const [countResult] = await queryWithLog<RowDataPacket[]>(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(REQUEST_NO, LENGTH('QR-${year}-') + 1) AS UNSIGNED)), 0) as max_seq
       FROM QUO_QUOTE_REQUEST WHERE REQUEST_NO LIKE ?`,
      [`QR-${year}-%`]
    );
    const seq = Number(countResult[0].max_seq) + 1;
    const requestNo = `QR-${year}-${String(seq).padStart(4, '0')}`;

    // 메인 INSERT
    const [result] = await queryWithLog<ResultSetHeader>(`
      INSERT INTO QUO_QUOTE_REQUEST (
        REQUEST_NO, REQUEST_DATE, BIZ_TYPE, IO_TYPE,
        CUSTOMER_ID, CUSTOMER_NM, INPUT_EMPLOYEE,
        ORIGIN_CD, ORIGIN_NM, DEST_CD, DEST_NM,
        INCOTERMS, SHIPPING_DATE, COMMODITY, CARGO_TYPE,
        WEIGHT_KG, VOLUME_CBM, QUANTITY,
        TOTAL_AMOUNT, CURRENCY_CD, STATUS, REMARK,
        CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, [
      requestNo,
      body.requestDate || new Date().toISOString().split('T')[0],
      body.bizType || 'SEA',
      body.ioType || 'EXPORT',
      body.customerId || null,
      body.customerNm || null,
      body.inputEmployee || null,
      body.originCd || null,
      body.originNm || null,
      body.destCd || null,
      body.destNm || null,
      body.incoterms || 'CIF',
      body.shippingDate || null,
      body.commodity || null,
      body.cargoType || 'GENERAL',
      body.weightKg || null,
      body.volumeCbm || null,
      body.quantity || null,
      body.totalAmount || 0,
      body.currencyCd || 'USD',
      body.status || '01',
      body.remark || null,
    ]);

    const requestId = result.insertId;

    // 운임정보 INSERT
    if (body.rateInfoList && Array.isArray(body.rateInfoList)) {
      for (let i = 0; i < body.rateInfoList.length; i++) {
        const r = body.rateInfoList[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO QUO_QUOTE_REQUEST_RATE (
            REQUEST_ID, RATE_SEQ, RATE_TYPE, RATE_CD, CURRENCY_CD, REMARK,
            RATE_MIN, RATE_45L, RATE_45, RATE_100, RATE_300, RATE_500, RATE_1000,
            RATE_PER_KG, RATE_BL,
            RATE_PER_MIN, RATE_PER_BL, RATE_PER_RTON, RATE_DRY_20, RATE_DRY_40,
            CNTR_TYPE_A_CD, CNTR_TYPE_A_RATE, CNTR_TYPE_B_CD, CNTR_TYPE_B_RATE,
            CNTR_TYPE_C_CD, CNTR_TYPE_C_RATE, RATE_BULK
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          requestId, i + 1,
          r.rateType || null, r.rateCd || null, r.currencyCd || 'USD', r.remark || null,
          r.rateMin ?? null, r.rate45l ?? null, r.rate45 ?? null,
          r.rate100 ?? null, r.rate300 ?? null, r.rate500 ?? null, r.rate1000 ?? null,
          r.ratePerKg ?? null, r.rateBl ?? null,
          r.ratePerMin ?? null, r.ratePerBl ?? null, r.ratePerRton ?? null,
          r.rateDry20 ?? null, r.rateDry40 ?? null,
          r.cntrTypeACd || null, r.cntrTypeARate ?? null,
          r.cntrTypeBCd || null, r.cntrTypeBRate ?? null,
          r.cntrTypeCCd || null, r.cntrTypeCRate ?? null,
          r.rateBulk ?? null,
        ]);
      }
    }

    // 운송요율 INSERT
    if (body.transportRateList && Array.isArray(body.transportRateList)) {
      for (let i = 0; i < body.transportRateList.length; i++) {
        const t = body.transportRateList[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO QUO_QUOTE_REQUEST_TRANSPORT (
            REQUEST_ID, TRANSPORT_SEQ, RATE_CD,
            ORIGIN_CD, ORIGIN_NM, DEST_CD, DEST_NM,
            ETC_DESC, CONTACT_NM, CONTACT_TEL, CONTACT_FAX, CONTACT_EMAIL,
            TRANSPORT_TYPE, VEHICLE_TYPE, AMOUNT,
            RATE_LCL, RATE_20FT, RATE_40FT
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          requestId, i + 1,
          t.rateCd || null,
          t.originCd || null, t.originNm || null,
          t.destCd || null, t.destNm || null,
          t.etcDesc || null, t.contactNm || null,
          t.contactTel || null, t.contactFax || null, t.contactEmail || null,
          t.transportType || null, t.vehicleType || null, t.amount ?? null,
          t.rateLcl ?? null, t.rate20ft ?? null, t.rate40ft ?? null,
        ]);
      }
    }

    return NextResponse.json({ success: true, requestId, requestNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create quote request' }, { status: 500 });
  }
}

// PUT: 견적요청 수정
export async function PUT(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // 메인 UPDATE
    await queryWithLog<ResultSetHeader>(`
      UPDATE QUO_QUOTE_REQUEST SET
        BIZ_TYPE = ?, IO_TYPE = ?,
        CUSTOMER_ID = ?, CUSTOMER_NM = ?, INPUT_EMPLOYEE = ?,
        ORIGIN_CD = ?, ORIGIN_NM = ?, DEST_CD = ?, DEST_NM = ?,
        INCOTERMS = ?, SHIPPING_DATE = ?, COMMODITY = ?, CARGO_TYPE = ?,
        WEIGHT_KG = ?, VOLUME_CBM = ?, QUANTITY = ?,
        TOTAL_AMOUNT = ?, CURRENCY_CD = ?, STATUS = ?, REMARK = ?,
        UPDATED_BY = 'admin', UPDATED_DTM = NOW()
      WHERE REQUEST_ID = ? AND DEL_YN = 'N'
    `, [
      body.bizType || 'SEA', body.ioType || 'EXPORT',
      body.customerId || null, body.customerNm || null, body.inputEmployee || null,
      body.originCd || null, body.originNm || null,
      body.destCd || null, body.destNm || null,
      body.incoterms || 'CIF', body.shippingDate || null,
      body.commodity || null, body.cargoType || 'GENERAL',
      body.weightKg || null, body.volumeCbm || null, body.quantity || null,
      body.totalAmount || 0, body.currencyCd || 'USD',
      body.status || '01', body.remark || null,
      body.id,
    ]);

    // 기존 서브레코드 소프트 삭제
    await queryWithLog<ResultSetHeader>(
      `UPDATE QUO_QUOTE_REQUEST_RATE SET DEL_YN = 'Y' WHERE REQUEST_ID = ?`,
      [body.id]
    );
    await queryWithLog<ResultSetHeader>(
      `UPDATE QUO_QUOTE_REQUEST_TRANSPORT SET DEL_YN = 'Y' WHERE REQUEST_ID = ?`,
      [body.id]
    );

    // 새 운임정보 INSERT
    if (body.rateInfoList && Array.isArray(body.rateInfoList)) {
      for (let i = 0; i < body.rateInfoList.length; i++) {
        const r = body.rateInfoList[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO QUO_QUOTE_REQUEST_RATE (
            REQUEST_ID, RATE_SEQ, RATE_TYPE, RATE_CD, CURRENCY_CD, REMARK,
            RATE_MIN, RATE_45L, RATE_45, RATE_100, RATE_300, RATE_500, RATE_1000,
            RATE_PER_KG, RATE_BL,
            RATE_PER_MIN, RATE_PER_BL, RATE_PER_RTON, RATE_DRY_20, RATE_DRY_40,
            CNTR_TYPE_A_CD, CNTR_TYPE_A_RATE, CNTR_TYPE_B_CD, CNTR_TYPE_B_RATE,
            CNTR_TYPE_C_CD, CNTR_TYPE_C_RATE, RATE_BULK
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          body.id, i + 1,
          r.rateType || null, r.rateCd || null, r.currencyCd || 'USD', r.remark || null,
          r.rateMin ?? null, r.rate45l ?? null, r.rate45 ?? null,
          r.rate100 ?? null, r.rate300 ?? null, r.rate500 ?? null, r.rate1000 ?? null,
          r.ratePerKg ?? null, r.rateBl ?? null,
          r.ratePerMin ?? null, r.ratePerBl ?? null, r.ratePerRton ?? null,
          r.rateDry20 ?? null, r.rateDry40 ?? null,
          r.cntrTypeACd || null, r.cntrTypeARate ?? null,
          r.cntrTypeBCd || null, r.cntrTypeBRate ?? null,
          r.cntrTypeCCd || null, r.cntrTypeCRate ?? null,
          r.rateBulk ?? null,
        ]);
      }
    }

    // 새 운송요율 INSERT
    if (body.transportRateList && Array.isArray(body.transportRateList)) {
      for (let i = 0; i < body.transportRateList.length; i++) {
        const t = body.transportRateList[i];
        await queryWithLog<ResultSetHeader>(`
          INSERT INTO QUO_QUOTE_REQUEST_TRANSPORT (
            REQUEST_ID, TRANSPORT_SEQ, RATE_CD,
            ORIGIN_CD, ORIGIN_NM, DEST_CD, DEST_NM,
            ETC_DESC, CONTACT_NM, CONTACT_TEL, CONTACT_FAX, CONTACT_EMAIL,
            TRANSPORT_TYPE, VEHICLE_TYPE, AMOUNT,
            RATE_LCL, RATE_20FT, RATE_40FT
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          body.id, i + 1,
          t.rateCd || null,
          t.originCd || null, t.originNm || null,
          t.destCd || null, t.destNm || null,
          t.etcDesc || null, t.contactNm || null,
          t.contactTel || null, t.contactFax || null, t.contactEmail || null,
          t.transportType || null, t.vehicleType || null, t.amount ?? null,
          t.rateLcl ?? null, t.rate20ft ?? null, t.rate40ft ?? null,
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update quote request' }, { status: 500 });
  }
}

// DELETE: 견적요청 소프트 삭제
export async function DELETE(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    const placeholders = idArray.map(() => '?').join(',');

    // 메인 소프트 삭제
    await queryWithLog<ResultSetHeader>(
      `UPDATE QUO_QUOTE_REQUEST SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE REQUEST_ID IN (${placeholders})`,
      idArray
    );

    // 서브테이블 소프트 삭제
    await queryWithLog<ResultSetHeader>(
      `UPDATE QUO_QUOTE_REQUEST_RATE SET DEL_YN = 'Y' WHERE REQUEST_ID IN (${placeholders})`,
      idArray
    );
    await queryWithLog<ResultSetHeader>(
      `UPDATE QUO_QUOTE_REQUEST_TRANSPORT SET DEL_YN = 'Y' WHERE REQUEST_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete quote requests' }, { status: 500 });
  }
}
