import { NextRequest, NextResponse } from 'next/server';
import pool, { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 수입 B/L 타입 정의
interface ImportBLRequest {
  // 기본 정보
  importExport: 'IN' | 'OUT';
  businessType: 'CONSOL' | 'CO-LOAD' | 'SIMPLE';
  paymentMethod: 'PREPAID' | 'COLLECT';
  mblNo: string;
  hblNo: string;
  srNo?: string;
  bookingNo?: string;

  // 당사자 정보
  shipperCode?: string;
  shipperName?: string;
  shipperAddress?: string;
  consigneeCode?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  notifyCode?: string;
  notifyName?: string;
  notifyAddress?: string;
  forwardingAgentCode?: string;
  forwardingAgentName?: string;

  // 운송 정보
  placeOfReceipt?: string;
  placeOfReceiptName?: string;
  portOfLoading: string;
  portOfLoadingName?: string;
  portOfDischarge: string;
  portOfDischargeName?: string;
  placeOfDelivery?: string;
  placeOfDeliveryName?: string;
  finalDestination?: string;
  finalDestinationName?: string;
  carrierCode?: string;
  carrierName?: string;
  vesselName?: string;
  voyageNo?: string;
  etd?: string;
  eta?: string;
  serviceTerm?: string;
  freightTerm: 'PREPAID' | 'COLLECT';
  freightPayableAt?: string;
  blIssueDate?: string;
  blIssuePlace?: string;

  // 화물 정보
  containerType: 'LCL' | 'FCL' | 'BULK';
  packageQty?: number;
  packageUnit?: string;
  grossWeight?: number;
  weightUnit?: string;
  measurement?: number;
  measurementUnit?: string;
  cargoDescription?: string;
  marksAndNumbers?: string;

  // 컨테이너 정보
  containers?: ContainerInfo[];

  // 기타 비용
  otherCharges?: OtherCharge[];

  // 비고
  remarks?: string;
}

interface ContainerInfo {
  containerNo: string;
  sealNo?: string;
  containerType: string;
  size?: string;
  packageQty?: number;
  packageUnit?: string;
  grossWeight?: number;
  measurement?: number;
}

interface OtherCharge {
  code: string;
  description?: string;
  currency: string;
  prepaid?: number;
  collect?: number;
}

// JOB NO 생성 (HBL_NO 기반)
function generateJobNo(hblNo: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `IMP${year}${month}${day}${random}`;
}

// MBL 번호로 기존 MBL 조회 또는 생성
async function findOrCreateMBL(mblNo: string, data: ImportBLRequest): Promise<number> {
  // 기존 MBL 조회
  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT MBL_ID FROM BL_MASTER_BL WHERE MBL_NO = ? AND DEL_YN != 'Y'`,
    [mblNo]
  );

  if (existing.length > 0) {
    return existing[0].MBL_ID;
  }

  // 신규 MBL 생성
  const [result] = await queryWithLog<ResultSetHeader>(`
    INSERT INTO BL_MASTER_BL (
      MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO,
      POL_PORT_CD, POD_PORT_CD, PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST,
      ETD_DT, ETA_DT, ISSUE_DT, ISSUE_PLACE,
      SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
      TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
      COMMODITY_DESC, FREIGHT_TERM_CD, BL_TYPE_CD,
      STATUS_CD, SURRENDER_YN, DEL_YN,
      CREATED_BY, CREATED_DTM
    ) VALUES (
      ?,
      COALESCE(
        (SELECT CARRIER_ID FROM MST_CARRIER WHERE CARRIER_CD = ? LIMIT 1),
        (SELECT CARRIER_ID FROM MST_CARRIER LIMIT 1)
      ),
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, 'ORIGINAL',
      'DRAFT', 'N', 'N',
      'admin', NOW()
    )
  `, [
    mblNo,
    data.carrierCode || '',
    data.vesselName || null,
    data.voyageNo || null,
    data.portOfLoading,
    data.portOfDischarge,
    data.placeOfReceipt || null,
    data.placeOfDelivery || null,
    data.finalDestination || null,
    data.etd || null,
    data.eta || null,
    data.blIssueDate || null,
    data.blIssuePlace || null,
    data.shipperName || null,
    data.consigneeName || null,
    data.notifyName || null,
    data.packageQty || null,
    data.packageUnit || null,
    data.grossWeight || null,
    data.measurement || null,
    data.cargoDescription || null,
    data.freightTerm
  ]);

  return result.insertId;
}

// 수입 B/L 등록
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const body: ImportBLRequest = await request.json();

    // 필수 필드 검증
    if (!body.mblNo) {
      return NextResponse.json({ error: 'M B/L No는 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.hblNo) {
      return NextResponse.json({ error: 'H B/L No는 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.portOfLoading) {
      return NextResponse.json({ error: 'Port of Loading은 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.portOfDischarge) {
      return NextResponse.json({ error: 'Port of Discharge는 필수 입력 항목입니다.' }, { status: 400 });
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // JOB NO 생성
    const jobNo = generateJobNo(body.hblNo);

    // MBL 조회 또는 생성
    const mblId = await findOrCreateMBL(body.mblNo, body);

    // HBL 중복 체크
    const [existingHbl] = await connection.query<RowDataPacket[]>(
      `SELECT HBL_ID FROM BL_HOUSE_BL WHERE HBL_NO = ? AND DEL_YN != 'Y'`,
      [body.hblNo]
    );

    if (existingHbl.length > 0) {
      await connection.rollback();
      return NextResponse.json({ error: `H B/L No '${body.hblNo}'가 이미 존재합니다.` }, { status: 400 });
    }

    // HBL 생성
    const [hblResult] = await connection.query<ResultSetHeader>(`
      INSERT INTO BL_HOUSE_BL (
        HBL_NO, MBL_ID, SHIPMENT_ID,
        CUSTOMER_ID, CARRIER_ID,
        VESSEL_NM, VOYAGE_NO,
        POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST,
        ETD_DT, ETA_DT, ISSUE_DT, ISSUE_PLACE,
        SHIPPER_NM, SHIPPER_ADDR,
        CONSIGNEE_NM, CONSIGNEE_ADDR,
        NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD,
        GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, MARKS_NOS,
        FREIGHT_TERM_CD,
        BL_TYPE_CD, ORIGINAL_BL_COUNT,
        STATUS_CD, PRINT_YN, SURRENDER_YN, DEL_YN,
        CREATED_BY, CREATED_DTM
      ) VALUES (
        ?, ?, 0,
        COALESCE(
          (SELECT CUSTOMER_ID FROM MST_CUSTOMER WHERE CUSTOMER_CD = ? LIMIT 1),
          (SELECT CUSTOMER_ID FROM MST_CUSTOMER LIMIT 1)
        ),
        COALESCE(
          (SELECT CARRIER_ID FROM MST_CARRIER WHERE CARRIER_CD = ? LIMIT 1),
          (SELECT CARRIER_ID FROM MST_CARRIER LIMIT 1)
        ),
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?,
        'ORIGINAL', 3,
        'DRAFT', 'N', 'N', 'N',
        'admin', NOW()
      )
    `, [
      body.hblNo,
      mblId,
      body.consigneeCode || '',
      body.carrierCode || '',
      body.vesselName || null,
      body.voyageNo || null,
      body.portOfLoading,
      body.portOfDischarge,
      body.placeOfReceipt || null,
      body.placeOfDelivery || null,
      body.finalDestination || null,
      body.etd || null,
      body.eta || null,
      body.blIssueDate || null,
      body.blIssuePlace || null,
      body.shipperName || null,
      body.shipperAddress || null,
      body.consigneeName || null,
      body.consigneeAddress || null,
      body.notifyName || null,
      body.packageQty || null,
      body.packageUnit || null,
      body.grossWeight || null,
      body.measurement || null,
      body.cargoDescription || null,
      body.marksAndNumbers || null,
      body.freightTerm
    ]);

    const hblId = hblResult.insertId;

    // 컨테이너 정보 저장
    if (body.containers && body.containers.length > 0) {
      for (const container of body.containers) {
        await connection.query(`
          INSERT INTO BL_CONTAINER (
            HBL_ID, MBL_ID,
            CNTR_NO, SEAL_NO, CNTR_TYPE_CD, CNTR_SIZE_CD,
            PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
            DEL_YN, CREATED_BY, CREATED_DTM
          ) VALUES (
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            'N', 'admin', NOW()
          )
        `, [
          hblId,
          mblId,
          container.containerNo,
          container.sealNo || null,
          container.containerType,
          container.size || null,
          container.packageQty || null,
          container.packageUnit || null,
          container.grossWeight || null,
          container.measurement || null
        ]);
      }
    }

    // 기타 비용 저장
    if (body.otherCharges && body.otherCharges.length > 0) {
      for (const charge of body.otherCharges) {
        await connection.query(`
          INSERT INTO BL_CHARGE (
            HBL_ID, CHARGE_CD, CHARGE_DESC,
            CURRENCY_CD, PREPAID_AMT, COLLECT_AMT,
            DEL_YN, CREATED_BY, CREATED_DTM
          ) VALUES (
            ?, ?, ?,
            ?, ?, ?,
            'N', 'admin', NOW()
          )
        `, [
          hblId,
          charge.code,
          charge.description || null,
          charge.currency,
          charge.prepaid || 0,
          charge.collect || 0
        ]);
      }
    }

    // 트랜잭션 커밋
    await connection.commit();

    console.log(`\n✅ 수입 B/L 등록 완료: JOB_NO=${jobNo}, HBL_NO=${body.hblNo}, MBL_NO=${body.mblNo}`);

    return NextResponse.json({
      success: true,
      jobNo,
      hblId,
      hblNo: body.hblNo,
      mblId,
      mblNo: body.mblNo,
      message: 'B/L이 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Database error:', error);
    return NextResponse.json({
      error: 'B/L 등록에 실패했습니다.',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// 수입 B/L 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mblNo = searchParams.get('mbl_no');
    const hblNo = searchParams.get('hbl_no');
    const hblId = searchParams.get('hbl_id');

    let whereClause = 'WHERE h.DEL_YN != "Y"';
    const params: (string | number)[] = [];

    // 특정 HBL ID로 조회 (수정 화면용)
    if (hblId) {
      whereClause += ' AND h.HBL_ID = ?';
      params.push(parseInt(hblId));
    }
    if (status) {
      whereClause += ' AND h.STATUS_CD = ?';
      params.push(status);
    }
    if (mblNo) {
      whereClause += ' AND m.MBL_NO LIKE ?';
      params.push(`%${mblNo}%`);
    }
    if (hblNo) {
      whereClause += ' AND h.HBL_NO LIKE ?';
      params.push(`%${hblNo}%`);
    }

    const [rows] = await queryWithLog<RowDataPacket[]>(`
      SELECT
        h.HBL_ID as hbl_id,
        h.HBL_NO as hbl_no,
        h.MBL_ID as mbl_id,
        m.MBL_NO as mbl_no,
        h.CUSTOMER_ID as customer_id,
        c.CUSTOMER_NM as customer_name,
        h.CARRIER_ID as carrier_id,
        cr.CARRIER_NM as carrier_name,
        cr.CARRIER_CD as carrier_code,
        h.VESSEL_NM as vessel_nm,
        h.VOYAGE_NO as voyage_no,
        h.POL_PORT_CD as pol_port_cd,
        h.POD_PORT_CD as pod_port_cd,
        pol.PORT_NM as pol_port_name,
        pod.PORT_NM as pod_port_name,
        h.PLACE_OF_RECEIPT as place_of_receipt,
        h.PLACE_OF_DELIVERY as place_of_delivery,
        h.FINAL_DEST as final_dest,
        DATE_FORMAT(h.ETD_DT, '%Y-%m-%d') as etd_dt,
        DATE_FORMAT(h.ATD_DT, '%Y-%m-%d') as atd_dt,
        DATE_FORMAT(h.ETA_DT, '%Y-%m-%d') as eta_dt,
        DATE_FORMAT(h.ATA_DT, '%Y-%m-%d') as ata_dt,
        DATE_FORMAT(h.ISSUE_DT, '%Y-%m-%d') as issue_dt,
        h.ISSUE_PLACE as issue_place,
        h.SHIPPER_NM as shipper_nm,
        h.SHIPPER_ADDR as shipper_addr,
        h.CONSIGNEE_NM as consignee_nm,
        h.CONSIGNEE_ADDR as consignee_addr,
        h.NOTIFY_PARTY as notify_party,
        h.TOTAL_PKG_QTY as total_pkg_qty,
        h.PKG_TYPE_CD as pkg_type_cd,
        h.GROSS_WEIGHT_KG as gross_weight_kg,
        h.VOLUME_CBM as volume_cbm,
        h.COMMODITY_DESC as commodity_desc,
        h.MARKS_NOS as marks_nos,
        h.FREIGHT_TERM_CD as freight_term_cd,
        h.BL_TYPE_CD as bl_type_cd,
        h.STATUS_CD as status_cd,
        DATE_FORMAT(h.CREATED_DTM, '%Y-%m-%d %H:%i') as created_dtm
      FROM BL_HOUSE_BL h
      LEFT JOIN BL_MASTER_BL m ON h.MBL_ID = m.MBL_ID
      LEFT JOIN MST_CUSTOMER c ON h.CUSTOMER_ID = c.CUSTOMER_ID
      LEFT JOIN MST_CARRIER cr ON h.CARRIER_ID = cr.CARRIER_ID
      LEFT JOIN MST_PORT pol ON h.POL_PORT_CD = pol.PORT_CD
      LEFT JOIN MST_PORT pod ON h.POD_PORT_CD = pod.PORT_CD
      ${whereClause}
      ORDER BY h.CREATED_DTM DESC
    `, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch Import B/Ls' }, { status: 500 });
  }
}

// 수입 B/L 수정
export async function PUT(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const body: ImportBLRequest & { hblId: number } = await request.json();

    // 필수 필드 검증
    if (!body.hblId) {
      return NextResponse.json({ error: 'HBL ID는 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.hblNo) {
      return NextResponse.json({ error: 'H B/L No는 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.portOfLoading) {
      return NextResponse.json({ error: 'Port of Loading은 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (!body.portOfDischarge) {
      return NextResponse.json({ error: 'Port of Discharge는 필수 입력 항목입니다.' }, { status: 400 });
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 기존 HBL 존재 확인
    const [existingHbl] = await connection.query<RowDataPacket[]>(
      `SELECT HBL_ID, MBL_ID FROM BL_HOUSE_BL WHERE HBL_ID = ? AND DEL_YN != 'Y'`,
      [body.hblId]
    );

    if (existingHbl.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: '해당 B/L을 찾을 수 없습니다.' }, { status: 404 });
    }

    const mblId = existingHbl[0].MBL_ID;

    // HBL 수정
    await connection.query(`
      UPDATE BL_HOUSE_BL SET
        HBL_NO = ?,
        CUSTOMER_ID = COALESCE(
          (SELECT CUSTOMER_ID FROM MST_CUSTOMER WHERE CUSTOMER_CD = ? LIMIT 1),
          CUSTOMER_ID
        ),
        CARRIER_ID = COALESCE(
          (SELECT CARRIER_ID FROM MST_CARRIER WHERE CARRIER_CD = ? LIMIT 1),
          CARRIER_ID
        ),
        VESSEL_NM = ?,
        VOYAGE_NO = ?,
        POL_PORT_CD = ?,
        POD_PORT_CD = ?,
        PLACE_OF_RECEIPT = ?,
        PLACE_OF_DELIVERY = ?,
        FINAL_DEST = ?,
        ETD_DT = ?,
        ETA_DT = ?,
        ISSUE_DT = ?,
        ISSUE_PLACE = ?,
        SHIPPER_NM = ?,
        SHIPPER_ADDR = ?,
        CONSIGNEE_NM = ?,
        CONSIGNEE_ADDR = ?,
        NOTIFY_PARTY = ?,
        TOTAL_PKG_QTY = ?,
        PKG_TYPE_CD = ?,
        GROSS_WEIGHT_KG = ?,
        VOLUME_CBM = ?,
        COMMODITY_DESC = ?,
        MARKS_NOS = ?,
        FREIGHT_TERM_CD = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE HBL_ID = ?
    `, [
      body.hblNo,
      body.consigneeCode || '',
      body.carrierCode || '',
      body.vesselName || null,
      body.voyageNo || null,
      body.portOfLoading,
      body.portOfDischarge,
      body.placeOfReceipt || null,
      body.placeOfDelivery || null,
      body.finalDestination || null,
      body.etd || null,
      body.eta || null,
      body.blIssueDate || null,
      body.blIssuePlace || null,
      body.shipperName || null,
      body.shipperAddress || null,
      body.consigneeName || null,
      body.consigneeAddress || null,
      body.notifyName || null,
      body.packageQty || null,
      body.packageUnit || null,
      body.grossWeight || null,
      body.measurement || null,
      body.cargoDescription || null,
      body.marksAndNumbers || null,
      body.freightTerm,
      body.hblId
    ]);

    // MBL 수정 (MBL No가 있으면)
    if (body.mblNo && mblId) {
      await connection.query(`
        UPDATE BL_MASTER_BL SET
          MBL_NO = ?,
          VESSEL_NM = ?,
          VOYAGE_NO = ?,
          POL_PORT_CD = ?,
          POD_PORT_CD = ?,
          PLACE_OF_RECEIPT = ?,
          PLACE_OF_DELIVERY = ?,
          FINAL_DEST = ?,
          ETD_DT = ?,
          ETA_DT = ?,
          ISSUE_DT = ?,
          ISSUE_PLACE = ?,
          SHIPPER_NM = ?,
          CONSIGNEE_NM = ?,
          NOTIFY_PARTY = ?,
          TOTAL_PKG_QTY = ?,
          PKG_TYPE_CD = ?,
          GROSS_WEIGHT_KG = ?,
          VOLUME_CBM = ?,
          COMMODITY_DESC = ?,
          FREIGHT_TERM_CD = ?,
          UPDATED_BY = 'admin',
          UPDATED_DTM = NOW()
        WHERE MBL_ID = ?
      `, [
        body.mblNo,
        body.vesselName || null,
        body.voyageNo || null,
        body.portOfLoading,
        body.portOfDischarge,
        body.placeOfReceipt || null,
        body.placeOfDelivery || null,
        body.finalDestination || null,
        body.etd || null,
        body.eta || null,
        body.blIssueDate || null,
        body.blIssuePlace || null,
        body.shipperName || null,
        body.consigneeName || null,
        body.notifyName || null,
        body.packageQty || null,
        body.packageUnit || null,
        body.grossWeight || null,
        body.measurement || null,
        body.cargoDescription || null,
        body.freightTerm,
        mblId
      ]);
    }

    // 기존 컨테이너 삭제 후 재등록
    if (body.containers && body.containers.length > 0) {
      await connection.query(
        `UPDATE BL_CONTAINER SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE HBL_ID = ?`,
        [body.hblId]
      );

      for (const container of body.containers) {
        await connection.query(`
          INSERT INTO BL_CONTAINER (
            HBL_ID, MBL_ID,
            CNTR_NO, SEAL_NO, CNTR_TYPE_CD, CNTR_SIZE_CD,
            PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
            DEL_YN, CREATED_BY, CREATED_DTM
          ) VALUES (
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            'N', 'admin', NOW()
          )
        `, [
          body.hblId,
          mblId,
          container.containerNo,
          container.sealNo || null,
          container.containerType,
          container.size || null,
          container.packageQty || null,
          container.packageUnit || null,
          container.grossWeight || null,
          container.measurement || null
        ]);
      }
    }

    // 기존 비용 삭제 후 재등록
    if (body.otherCharges && body.otherCharges.length > 0) {
      await connection.query(
        `UPDATE BL_CHARGE SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE HBL_ID = ?`,
        [body.hblId]
      );

      for (const charge of body.otherCharges) {
        await connection.query(`
          INSERT INTO BL_CHARGE (
            HBL_ID, CHARGE_CD, CHARGE_DESC,
            CURRENCY_CD, PREPAID_AMT, COLLECT_AMT,
            DEL_YN, CREATED_BY, CREATED_DTM
          ) VALUES (
            ?, ?, ?,
            ?, ?, ?,
            'N', 'admin', NOW()
          )
        `, [
          body.hblId,
          charge.code,
          charge.description || null,
          charge.currency,
          charge.prepaid || 0,
          charge.collect || 0
        ]);
      }
    }

    // 트랜잭션 커밋
    await connection.commit();

    console.log(`\n✅ 수입 B/L 수정 완료: HBL_ID=${body.hblId}, HBL_NO=${body.hblNo}`);

    return NextResponse.json({
      success: true,
      hblId: body.hblId,
      hblNo: body.hblNo,
      mblId,
      mblNo: body.mblNo,
      message: 'B/L이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Database error:', error);
    return NextResponse.json({
      error: 'B/L 수정에 실패했습니다.',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// 수입 B/L 삭제 (논리적 삭제)
export async function DELETE(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const { searchParams } = new URL(request.url);
    const hblId = searchParams.get('hbl_id');
    const hblIds = searchParams.get('hbl_ids'); // 다건 삭제용 (콤마 구분)

    // 삭제할 ID 목록 구성
    let idsToDelete: number[] = [];

    if (hblIds) {
      // 다건 삭제
      idsToDelete = hblIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else if (hblId) {
      // 단건 삭제
      idsToDelete = [parseInt(hblId)];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: '삭제할 B/L ID가 필요합니다.' }, { status: 400 });
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 삭제할 HBL들의 MBL_ID 조회
    const placeholders = idsToDelete.map(() => '?').join(',');
    const [hblRows] = await connection.query<RowDataPacket[]>(
      `SELECT HBL_ID, MBL_ID, HBL_NO FROM BL_HOUSE_BL WHERE HBL_ID IN (${placeholders}) AND DEL_YN != 'Y'`,
      idsToDelete
    );

    if (hblRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: '삭제할 B/L을 찾을 수 없습니다.' }, { status: 404 });
    }

    const foundIds = hblRows.map((row: RowDataPacket) => row.HBL_ID);
    const deletedHblNos = hblRows.map((row: RowDataPacket) => row.HBL_NO);

    // HBL 논리적 삭제
    await connection.query(
      `UPDATE BL_HOUSE_BL SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE HBL_ID IN (${placeholders})`,
      foundIds
    );

    // 관련 컨테이너 논리적 삭제 (테이블이 존재하는 경우에만)
    try {
      await connection.query(
        `UPDATE BL_CONTAINER SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE HBL_ID IN (${placeholders})`,
        foundIds
      );
    } catch {
      // BL_CONTAINER 테이블이 없으면 무시
    }

    // 관련 비용 논리적 삭제 (테이블이 존재하는 경우에만)
    try {
      await connection.query(
        `UPDATE BL_CHARGE SET DEL_YN = 'Y', UPDATED_BY = 'admin', UPDATED_DTM = NOW() WHERE HBL_ID IN (${placeholders})`,
        foundIds
      );
    } catch {
      // BL_CHARGE 테이블이 없으면 무시
    }

    // 트랜잭션 커밋
    await connection.commit();

    console.log(`\n✅ 수입 B/L 삭제 완료: ${foundIds.length}건 (HBL_NO: ${deletedHblNos.join(', ')})`);

    return NextResponse.json({
      success: true,
      deletedCount: foundIds.length,
      deletedIds: foundIds,
      deletedHblNos,
      message: `${foundIds.length}건의 B/L이 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Database error:', error);
    return NextResponse.json({
      error: 'B/L 삭제에 실패했습니다.',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    connection.release();
  }
}
