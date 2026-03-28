import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateJobNo } from '@/lib/jobno';

// 해상 B/L 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blId = searchParams.get('blId');

    // 단건 조회
    if (blId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          b.BL_ID as id,
          b.JOB_NO as jobNo,
          b.BOOKING_NO as bookingNo,
          b.M_BL_NO as mblNo,
          b.H_BL_NO as hblNo,
          b.SR_NO as srNo,
          b.IO_TYPE as ioType,
          b.BIZ_TYPE as businessType,
          b.BL_TYPE as blType,
          b.STATUS_CD as status,
          b.SHIPPER_CD as shipperCode,
          b.SHIPPER_NM as shipperName,
          b.SHIPPER_ADDR as shipperAddress,
          b.CONSIGNEE_CD as consigneeCode,
          b.CONSIGNEE_NM as consigneeName,
          b.CONSIGNEE_ADDR as consigneeAddress,
          b.NOTIFY_CD as notifyCode,
          b.NOTIFY_NM as notifyName,
          b.NOTIFY_ADDR as notifyAddress,
          b.FOR_DELIVERY_CD as forDeliveryCode,
          b.FOR_DELIVERY_NM as forDeliveryName,
          b.FOR_DELIVERY_ADDR as forDeliveryAddress,
          b.PLACE_OF_RECEIPT as placeOfReceipt,
          b.LINE_CD as lineCode,
          b.LINE_NM as lineName,
          b.POL_CD as portOfLoading,
          b.POD_CD as portOfDischarge,
          b.PLACE_OF_DELIVERY as placeOfDelivery,
          b.FINAL_DEST as finalDestination,
          b.VESSEL_NM as vesselName,
          b.VOYAGE_NO as voyageNo,
          DATE_FORMAT(b.ONBOARD_DT, '%Y-%m-%d') as onboardDate,
          DATE_FORMAT(b.ETD_DT, '%Y-%m-%d') as etd,
          DATE_FORMAT(b.ETA_DT, '%Y-%m-%d') as eta,
          b.FREIGHT_TERM as freightTerm,
          b.SERVICE_TERM as serviceTerm,
          b.CONTAINER_TYPE as containerType,
          b.PACKAGE_QTY as packageQty,
          b.PACKAGE_UNIT as packageUnit,
          b.GROSS_WEIGHT_KG as grossWeight,
          b.MEASUREMENT_CBM as measurement,
          b.R_TON as rton,
          b.ISSUE_PLACE as issuePlace,
          DATE_FORMAT(b.ISSUE_DT, '%Y-%m-%d') as issueDate,
          b.BL_ISSUE_TYPE as blIssueType,
          b.NO_OF_ORIGINAL_BL as noOfOriginalBL,
          b.AGENT_CD as agentCode,
          b.AGENT_NM as agentName,
          b.PARTNER_CD as partnerCode,
          b.PARTNER_NM as partnerName,
          b.COUNTRY_CD as countryCode,
          b.REGION_CD as regionCode,
          b.LC_NO as lcNo,
          b.PO_NO as poNo,
          DATE_FORMAT(b.CREATED_DTM, '%Y-%m-%d %H:%i:%s') as createdAt,
          DATE_FORMAT(b.UPDATED_DTM, '%Y-%m-%d %H:%i:%s') as updatedAt
        FROM ORD_OCEAN_BL b
        WHERE b.BL_ID = ? AND b.DEL_YN = 'N'
      `, [blId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'B/L not found' }, { status: 404 });
      }

      // 컨테이너 정보 조회
      const [containers] = await pool.query<RowDataPacket[]>(`
        SELECT
          CNTR_ID as id,
          CNTR_NO as containerNo,
          CNTR_TYPE as containerType,
          SEAL_1_NO as seal1No,
          SEAL_2_NO as seal2No,
          SEAL_3_NO as seal3No,
          PACKAGE_QTY as packageQty,
          PACKAGE_UNIT as packageUnit,
          GROSS_WEIGHT_KG as grossWeight,
          MEASUREMENT_CBM as measurement
        FROM ORD_OCEAN_BL_CNTR
        WHERE BL_ID = ? AND DEL_YN = 'N'
        ORDER BY CNTR_SEQ
      `, [blId]);

      // 운임 정보 조회
      const [charges] = await pool.query<RowDataPacket[]>(`
        SELECT
          CHARGE_ID as id,
          CHARGE_CD as code,
          CHARGE_NM as charges,
          CURRENCY_CD as currency,
          PREPAID_AMT as prepaid,
          COLLECT_AMT as collect
        FROM ORD_OCEAN_BL_CHARGE
        WHERE BL_ID = ? AND DEL_YN = 'N'
        ORDER BY CHARGE_SEQ
      `, [blId]);

      const result = {
        ...rows[0],
        containers: containers,
        otherCharges: charges,
      };

      return NextResponse.json(result);
    }

    // 목록 조회
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        b.BL_ID as id,
        DATE_FORMAT(b.ONBOARD_DT, '%Y-%m-%d') as obDate,
        DATE_FORMAT(b.ETA_DT, '%Y-%m-%d') as arDate,
        b.JOB_NO as jobNo,
        b.SR_NO as srNo,
        b.M_BL_NO as mblNo,
        b.H_BL_NO as hblNo,
        b.LC_NO as lcNo,
        b.PO_NO as poNo,
        b.BL_TYPE as type,
        CASE WHEN b.BIZ_TYPE = 'CONSOL' THEN 'C' ELSE 'D' END as dc,
        CASE WHEN b.BIZ_TYPE = 'CONSOL' THEN 'L' ELSE 'N' END as ln,
        CASE WHEN b.FREIGHT_TERM = 'PREPAID' THEN 'P' ELSE 'C' END as pc,
        '' as inco,
        b.SHIPPER_NM as shipperName,
        b.CONSIGNEE_NM as consigneeName,
        b.POL_CD as pol,
        b.POD_CD as pod,
        CONCAT(b.VESSEL_NM, ' / ', b.VOYAGE_NO) as vesselVoyage,
        b.IO_TYPE as ioType,
        b.STATUS_CD as status
      FROM ORD_OCEAN_BL b
      WHERE b.DEL_YN = 'N'
      ORDER BY b.CREATED_DTM DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch B/L data' }, { status: 500 });
  }
}

// 해상 B/L 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 두 가지 형태 지원: { main, cargo, other } 또는 flat 구조
    const main = body.main || body;
    const cargo = body.cargo || {};
    const other = body.other || {};

    // 새 JOB NO 생성
    const ioType = main.ioType || 'OUT';
    const prefix = ioType === 'OUT' ? 'SEX' : 'SIM';
    const jobNo = await generateJobNo('ORD_OCEAN_BL', prefix);

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO ORD_OCEAN_BL (
        JOB_NO, BOOKING_NO, M_BL_NO, H_BL_NO, SR_NO,
        IO_TYPE, BIZ_TYPE, BL_TYPE, STATUS_CD,
        SHIPPER_CD, SHIPPER_NM, SHIPPER_ADDR,
        CONSIGNEE_CD, CONSIGNEE_NM, CONSIGNEE_ADDR,
        NOTIFY_CD, NOTIFY_NM, NOTIFY_ADDR,
        FOR_DELIVERY_CD, FOR_DELIVERY_NM, FOR_DELIVERY_ADDR,
        PLACE_OF_RECEIPT, LINE_CD, LINE_NM,
        POL_CD, POD_CD, PLACE_OF_DELIVERY, FINAL_DEST,
        VESSEL_NM, VOYAGE_NO, ONBOARD_DT, ETD_DT, ETA_DT,
        FREIGHT_TERM, SERVICE_TERM,
        CONTAINER_TYPE, PACKAGE_QTY, PACKAGE_UNIT,
        GROSS_WEIGHT_KG, MEASUREMENT_CBM, R_TON,
        ISSUE_PLACE, ISSUE_DT, BL_ISSUE_TYPE, NO_OF_ORIGINAL_BL,
        AGENT_CD, AGENT_NM, PARTNER_CD, PARTNER_NM,
        COUNTRY_CD, REGION_CD, LC_NO, PO_NO,
        CREATED_BY, CREATED_DTM, DEL_YN
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
    `, [
      jobNo,
      main.bookingNo || null,
      main.mblNo || null,
      main.hblNo || '',
      main.srNo || null,
      main.ioType || 'OUT',
      main.businessType || 'SIMPLE',
      main.blType || 'ORIGINAL',
      'DRAFT',
      main.shipperCode || null,
      main.shipperName || '',
      main.shipperAddress || '',
      main.consigneeCode || null,
      main.consigneeName || '',
      main.consigneeAddress || '',
      main.notifyCode || null,
      main.notifyName || '',
      main.notifyAddress || '',
      main.forDeliveryCode || null,
      main.forDeliveryName || '',
      main.forDeliveryAddress || '',
      main.placeOfReceipt || '',
      main.lineCode || null,
      main.lineName || '',
      main.portOfLoading || '',
      main.portOfDischarge || '',
      main.placeOfDelivery || '',
      main.finalDestination || '',
      main.vesselName || '',
      main.voyageNo || '',
      main.onboardDate || null,
      main.etd || null,
      main.eta || null,
      main.freightTerm || 'PREPAID',
      main.serviceTerm || 'CY/CY',
      cargo.containerType || 'FCL',
      cargo.packageQty || 0,
      cargo.packageUnit || 'PKG',
      cargo.grossWeight || 0,
      cargo.measurement || 0,
      cargo.rton || 0,
      cargo.issuePlace || '',
      cargo.issueDate || null,
      cargo.blIssueType || 'ORIGINAL',
      cargo.noOfOriginalBL || 3,
      other.agentCode || null,
      other.agentName || '',
      other.partnerCode || null,
      other.partnerName || '',
      other.countryCode || '',
      other.regionCode || '',
      other.lcNo || '',
      other.poNo || ''
    ]);

    const blId = result.insertId;

    // 컨테이너 정보 저장
    if (cargo.containers && cargo.containers.length > 0) {
      for (let i = 0; i < cargo.containers.length; i++) {
        const container = cargo.containers[i];
        await pool.query(`
          INSERT INTO ORD_OCEAN_BL_CNTR (
            BL_ID, CNTR_SEQ, CNTR_NO, CNTR_TYPE,
            SEAL_1_NO, SEAL_2_NO, SEAL_3_NO,
            PACKAGE_QTY, PACKAGE_UNIT, GROSS_WEIGHT_KG, MEASUREMENT_CBM,
            CREATED_BY, CREATED_DTM, DEL_YN
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
        `, [
          blId,
          i + 1,
          container.containerNo || '',
          container.containerType || '',
          container.seal1No || '',
          container.seal2No || '',
          container.seal3No || '',
          container.packageQty || 0,
          container.packageUnit || 'PKG',
          container.grossWeight || 0,
          container.measurement || 0
        ]);
      }
    }

    // 운임 정보 저장
    if (cargo.otherCharges && cargo.otherCharges.length > 0) {
      for (let i = 0; i < cargo.otherCharges.length; i++) {
        const charge = cargo.otherCharges[i];
        await pool.query(`
          INSERT INTO ORD_OCEAN_BL_CHARGE (
            BL_ID, CHARGE_SEQ, CHARGE_CD, CHARGE_NM,
            CURRENCY_CD, PREPAID_AMT, COLLECT_AMT,
            CREATED_BY, CREATED_DTM, DEL_YN
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
        `, [
          blId,
          i + 1,
          charge.code || '',
          charge.charges || '',
          charge.currency || 'USD',
          charge.prepaid || 0,
          charge.collect || 0
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      blId: blId,
      jobNo: jobNo
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create B/L' }, { status: 500 });
  }
}

// 해상 B/L 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    const main = body.main || body;
    const cargo = body.cargo || body;
    const other = body.other || body;

    if (!id) {
      return NextResponse.json({ error: 'B/L ID is required' }, { status: 400 });
    }

    // JOB_NO가 없으면 자동생성
    const [existingBl] = await pool.query<RowDataPacket[]>(
      `SELECT JOB_NO, IO_TYPE FROM ORD_OCEAN_BL WHERE BL_ID = ?`, [id]
    );
    let jobNo = existingBl[0]?.JOB_NO || null;
    if (!jobNo) {
      const ioType = main?.ioType || existingBl[0]?.IO_TYPE || 'OUT';
      const prefix = ioType === 'OUT' ? 'SEX' : 'SIM';
      jobNo = await generateJobNo('ORD_OCEAN_BL', prefix);
    }

    await pool.query(`
      UPDATE ORD_OCEAN_BL SET
        JOB_NO = ?,
        BOOKING_NO = ?,
        M_BL_NO = ?,
        H_BL_NO = ?,
        SR_NO = ?,
        IO_TYPE = ?,
        BIZ_TYPE = ?,
        BL_TYPE = ?,
        SHIPPER_CD = ?,
        SHIPPER_NM = ?,
        SHIPPER_ADDR = ?,
        CONSIGNEE_CD = ?,
        CONSIGNEE_NM = ?,
        CONSIGNEE_ADDR = ?,
        NOTIFY_CD = ?,
        NOTIFY_NM = ?,
        NOTIFY_ADDR = ?,
        FOR_DELIVERY_CD = ?,
        FOR_DELIVERY_NM = ?,
        FOR_DELIVERY_ADDR = ?,
        PLACE_OF_RECEIPT = ?,
        LINE_CD = ?,
        LINE_NM = ?,
        POL_CD = ?,
        POD_CD = ?,
        PLACE_OF_DELIVERY = ?,
        FINAL_DEST = ?,
        VESSEL_NM = ?,
        VOYAGE_NO = ?,
        ONBOARD_DT = ?,
        ETD_DT = ?,
        ETA_DT = ?,
        FREIGHT_TERM = ?,
        SERVICE_TERM = ?,
        CONTAINER_TYPE = ?,
        PACKAGE_QTY = ?,
        PACKAGE_UNIT = ?,
        GROSS_WEIGHT_KG = ?,
        MEASUREMENT_CBM = ?,
        R_TON = ?,
        ISSUE_PLACE = ?,
        ISSUE_DT = ?,
        BL_ISSUE_TYPE = ?,
        NO_OF_ORIGINAL_BL = ?,
        AGENT_CD = ?,
        AGENT_NM = ?,
        PARTNER_CD = ?,
        PARTNER_NM = ?,
        COUNTRY_CD = ?,
        REGION_CD = ?,
        LC_NO = ?,
        PO_NO = ?,
        UPDATED_BY = 'admin',
        UPDATED_DTM = NOW()
      WHERE BL_ID = ?
    `, [
      jobNo,
      main.bookingNo || null,
      main.mblNo || null,
      main.hblNo || '',
      main.srNo || null,
      main.ioType || 'OUT',
      main.businessType || 'SIMPLE',
      main.blType || 'ORIGINAL',
      main.shipperCode || null,
      main.shipperName || '',
      main.shipperAddress || '',
      main.consigneeCode || null,
      main.consigneeName || '',
      main.consigneeAddress || '',
      main.notifyCode || null,
      main.notifyName || '',
      main.notifyAddress || '',
      main.forDeliveryCode || null,
      main.forDeliveryName || '',
      main.forDeliveryAddress || '',
      main.placeOfReceipt || '',
      main.lineCode || null,
      main.lineName || '',
      main.portOfLoading || '',
      main.portOfDischarge || '',
      main.placeOfDelivery || '',
      main.finalDestination || '',
      main.vesselName || '',
      main.voyageNo || '',
      main.onboardDate || null,
      main.etd || null,
      main.eta || null,
      main.freightTerm || 'PREPAID',
      main.serviceTerm || 'CY/CY',
      cargo.containerType || 'FCL',
      cargo.packageQty || 0,
      cargo.packageUnit || 'PKG',
      cargo.grossWeight || 0,
      cargo.measurement || 0,
      cargo.rton || 0,
      cargo.issuePlace || '',
      cargo.issueDate || null,
      cargo.blIssueType || 'ORIGINAL',
      cargo.noOfOriginalBL || 3,
      other.agentCode || null,
      other.agentName || '',
      other.partnerCode || null,
      other.partnerName || '',
      other.countryCode || '',
      other.regionCode || '',
      other.lcNo || '',
      other.poNo || '',
      id
    ]);

    // 기존 컨테이너/운임 삭제 후 재등록
    await pool.query(`UPDATE ORD_OCEAN_BL_CNTR SET DEL_YN = 'Y' WHERE BL_ID = ?`, [id]);
    await pool.query(`UPDATE ORD_OCEAN_BL_CHARGE SET DEL_YN = 'Y' WHERE BL_ID = ?`, [id]);

    // 컨테이너 정보 저장
    if (cargo.containers && cargo.containers.length > 0) {
      for (let i = 0; i < cargo.containers.length; i++) {
        const container = cargo.containers[i];
        await pool.query(`
          INSERT INTO ORD_OCEAN_BL_CNTR (
            BL_ID, CNTR_SEQ, CNTR_NO, CNTR_TYPE,
            SEAL_1_NO, SEAL_2_NO, SEAL_3_NO,
            PACKAGE_QTY, PACKAGE_UNIT, GROSS_WEIGHT_KG, MEASUREMENT_CBM,
            CREATED_BY, CREATED_DTM, DEL_YN
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
        `, [
          id,
          i + 1,
          container.containerNo || '',
          container.containerType || '',
          container.seal1No || '',
          container.seal2No || '',
          container.seal3No || '',
          container.packageQty || 0,
          container.packageUnit || 'PKG',
          container.grossWeight || 0,
          container.measurement || 0
        ]);
      }
    }

    // 운임 정보 저장
    if (cargo.otherCharges && cargo.otherCharges.length > 0) {
      for (let i = 0; i < cargo.otherCharges.length; i++) {
        const charge = cargo.otherCharges[i];
        await pool.query(`
          INSERT INTO ORD_OCEAN_BL_CHARGE (
            BL_ID, CHARGE_SEQ, CHARGE_CD, CHARGE_NM,
            CURRENCY_CD, PREPAID_AMT, COLLECT_AMT,
            CREATED_BY, CREATED_DTM, DEL_YN
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', NOW(), 'N')
        `, [
          id,
          i + 1,
          charge.code || '',
          charge.charges || '',
          charge.currency || 'USD',
          charge.prepaid || 0,
          charge.collect || 0
        ]);
      }
    }

    return NextResponse.json({ success: true, jobNo });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update B/L' }, { status: 500 });
  }
}

// 해상 B/L 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'B/L IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');

    await pool.query(
      `UPDATE ORD_OCEAN_BL SET DEL_YN = 'Y', UPDATED_DTM = NOW() WHERE BL_ID IN (${placeholders})`,
      idArray
    );

    // 관련 컨테이너/운임 정보도 삭제 처리
    await pool.query(
      `UPDATE ORD_OCEAN_BL_CNTR SET DEL_YN = 'Y' WHERE BL_ID IN (${placeholders})`,
      idArray
    );
    await pool.query(
      `UPDATE ORD_OCEAN_BL_CHARGE SET DEL_YN = 'Y' WHERE BL_ID IN (${placeholders})`,
      idArray
    );

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete B/L' }, { status: 500 });
  }
}
