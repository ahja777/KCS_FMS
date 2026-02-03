import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// 통관정산 목록 조회 / 단건 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (accountId) {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          ACCOUNT_ID as id, JOB_NO as jobNo, BOUND_TYPE as boundType,
          BUSINESS_TYPE as businessType, TRADE_TERMS as tradeTerms, BRANCH as branch,
          MBL_NO as mblNo, HBL_NO as hblNo, CASEQ_NO as caseqNo,
          ACCOUNT_CODE as accountCode, ACCOUNT_NAME as accountName,
          SHIPPER_CODE as shipperCode, SHIPPER_NAME as shipperName, SHIPPER_ADDR as shipperAddr,
          CONSIGNEE_CODE as consigneeCode, CONSIGNEE_NAME as consigneeName, CONSIGNEE_ADDR as consigneeAddr,
          DATE_FORMAT(PERFORMANCE_DATE, '%Y-%m-%d') as performanceDate,
          PERFORMANCE_AMT as performanceAmt,
          PACKAGES as packages, PACKAGE_UNIT as packageUnit,
          WEIGHT as weight, WEIGHT_UNIT as weightUnit, CBM as cbm,
          DATE_FORMAT(INPUT_DATE, '%Y-%m-%d') as inputDate,
          DATE_FORMAT(OB_AR_DATE, '%Y-%m-%d') as obArDate,
          FLIGHT_NO as flightNo, VESSEL_NAME as vesselName, VOYAGE_NO as voyageNo,
          CONTAINER_TYPE as containerType, CALL_SIGN as callSign,
          POL as pol, POD as pod, SALES_EMPLOYEE as salesEmployee,
          LC_NO as lcNo, INV_NO as invNo, PO_NO as poNo, ITEM as item,
          CONTAINER_20DR as container20dr, CONTAINER_20HC as container20hc, CONTAINER_20RF as container20rf,
          CONTAINER_40DR as container40dr, CONTAINER_40HC as container40hc, CONTAINER_40RF as container40rf,
          DATE_FORMAT(CUSTOMS_DATE, '%Y-%m-%d') as customsDate,
          LICENSE_NO as licenseNo, BROKER_CODE as brokerCode, BROKER_NAME as brokerName,
          CUSTOMS_OFFICE as customsOffice,
          DATE_FORMAT(TRANSPORT_DATE, '%Y-%m-%d') as transportDate,
          BONDED_WAREHOUSE as bondedWarehouse, CUSTOMS_TYPE as customsType, CUSTOMS_DEPT as customsDept,
          DECLARED_VALUE as declaredValue, CURRENCY as currency, EX_RATE as exRate,
          DUTY_RATE as dutyRate, ASSESSED_VALUE as assessedValue, FREIGHT_AMT as freightAmt,
          DUTY_AMT as dutyAmt, VAT_RATE as vatRate, VAT_AMT as vatAmt,
          REMARKS as remarks, STATUS as status,
          DATE_FORMAT(CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM CUS_ACCOUNT WHERE ACCOUNT_ID = ?
      `, [accountId]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    // 목록 조회 (필터 파라미터)
    const boundType = searchParams.get('boundType');
    const businessType = searchParams.get('businessType');
    const tradeTerms = searchParams.get('tradeTerms');
    const branch = searchParams.get('branch');
    const obArDateFrom = searchParams.get('obArDateFrom');
    const obArDateTo = searchParams.get('obArDateTo');
    const customsDateFrom = searchParams.get('customsDateFrom');
    const customsDateTo = searchParams.get('customsDateTo');
    const accountName = searchParams.get('accountName');
    const noType = searchParams.get('noType');
    const noValue = searchParams.get('noValue');
    const employee = searchParams.get('employee');
    const status = searchParams.get('status');

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (boundType) { conditions.push('BOUND_TYPE = ?'); params.push(boundType); }
    if (businessType) { conditions.push('BUSINESS_TYPE = ?'); params.push(businessType); }
    if (tradeTerms) { conditions.push('TRADE_TERMS = ?'); params.push(tradeTerms); }
    if (branch) { conditions.push('BRANCH = ?'); params.push(branch); }
    if (obArDateFrom) { conditions.push('OB_AR_DATE >= ?'); params.push(obArDateFrom); }
    if (obArDateTo) { conditions.push('OB_AR_DATE <= ?'); params.push(obArDateTo); }
    if (customsDateFrom) { conditions.push('CUSTOMS_DATE >= ?'); params.push(customsDateFrom); }
    if (customsDateTo) { conditions.push('CUSTOMS_DATE <= ?'); params.push(customsDateTo); }
    if (accountName) { conditions.push('ACCOUNT_NAME LIKE ?'); params.push(`%${accountName}%`); }
    if (employee) { conditions.push('SALES_EMPLOYEE LIKE ?'); params.push(`%${employee}%`); }
    if (status) { conditions.push('STATUS = ?'); params.push(status); }
    if (noValue && noType) {
      const col = noType === 'MBL_NO' ? 'MBL_NO' : noType === 'HBL_NO' ? 'HBL_NO' : 'JOB_NO';
      conditions.push(`${col} LIKE ?`);
      params.push(`%${noValue}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `SELECT
        ACCOUNT_ID as id, JOB_NO as jobNo, BOUND_TYPE as boundType,
        BUSINESS_TYPE as businessType, TRADE_TERMS as tradeTerms, BRANCH as branch,
        MBL_NO as mblNo, HBL_NO as hblNo,
        ACCOUNT_NAME as accountName, PACKAGES as packages, PACKAGE_UNIT as packageUnit,
        SALES_EMPLOYEE as salesEmployee,
        DATE_FORMAT(OB_AR_DATE, '%Y-%m-%d') as obArDate,
        DATE_FORMAT(CUSTOMS_DATE, '%Y-%m-%d') as customsDate,
        WEIGHT as weight, CBM as cbm,
        PERFORMANCE_AMT as performanceAmt,
        STATUS as status,
        DATE_FORMAT(CREATED_AT, '%Y-%m-%d') as createdAt
      FROM CUS_ACCOUNT ${whereClause}
      ORDER BY CREATED_AT DESC`;
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// 통관정산 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const year = new Date().getFullYear();
    const prefix = `CA-${year}-`;
    const startPos = prefix.length + 1; // SUBSTRING is 1-based
    const seqSql = `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, ${startPos}) AS UNSIGNED)), 0) as max_seq FROM CUS_ACCOUNT WHERE JOB_NO LIKE ?`;
    const [countResult] = await pool.query<RowDataPacket[]>(seqSql, [`${prefix}%`]);
    const count = Number(countResult[0].max_seq) + 1;
    const jobNo = `${prefix}${String(count).padStart(4, '0')}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO CUS_ACCOUNT (
        JOB_NO, BOUND_TYPE, BUSINESS_TYPE, TRADE_TERMS, BRANCH,
        MBL_NO, HBL_NO, CASEQ_NO,
        ACCOUNT_CODE, ACCOUNT_NAME,
        SHIPPER_CODE, SHIPPER_NAME, SHIPPER_ADDR,
        CONSIGNEE_CODE, CONSIGNEE_NAME, CONSIGNEE_ADDR,
        PERFORMANCE_DATE, PERFORMANCE_AMT,
        PACKAGES, PACKAGE_UNIT, WEIGHT, WEIGHT_UNIT, CBM,
        INPUT_DATE, OB_AR_DATE,
        FLIGHT_NO, VESSEL_NAME, VOYAGE_NO,
        CONTAINER_TYPE, CALL_SIGN, POL, POD,
        SALES_EMPLOYEE, LC_NO, INV_NO, PO_NO, ITEM,
        CONTAINER_20DR, CONTAINER_20HC, CONTAINER_20RF,
        CONTAINER_40DR, CONTAINER_40HC, CONTAINER_40RF,
        CUSTOMS_DATE, LICENSE_NO, BROKER_CODE, BROKER_NAME,
        CUSTOMS_OFFICE, TRANSPORT_DATE, BONDED_WAREHOUSE,
        CUSTOMS_TYPE, CUSTOMS_DEPT,
        DECLARED_VALUE, CURRENCY, EX_RATE, DUTY_RATE,
        ASSESSED_VALUE, FREIGHT_AMT, DUTY_AMT, VAT_RATE, VAT_AMT,
        REMARKS, STATUS, CREATED_BY, CREATED_AT
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 'admin', NOW()
      )
    `, [
      jobNo,
      body.boundType || 'AI',
      body.businessType || '통관B/L',
      body.tradeTerms || 'CFR',
      body.branch || '',
      body.mblNo || '',
      body.hblNo || '',
      body.caseqNo || '',
      body.accountCode || '',
      body.accountName || '',
      body.shipperCode || '',
      body.shipperName || '',
      body.shipperAddr || '',
      body.consigneeCode || '',
      body.consigneeName || '',
      body.consigneeAddr || '',
      body.performanceDate || null,
      body.performanceAmt || 0,
      body.packages || 0,
      body.packageUnit || 'CT',
      body.weight || 0,
      body.weightUnit || 'KG',
      body.cbm || 0,
      body.inputDate || new Date().toISOString().split('T')[0],
      body.obArDate || null,
      body.flightNo || '',
      body.vesselName || '',
      body.voyageNo || '',
      body.containerType || '',
      body.callSign || '',
      body.pol || '',
      body.pod || '',
      body.salesEmployee || '',
      body.lcNo || '',
      body.invNo || '',
      body.poNo || '',
      body.item || '',
      body.container20dr || 0,
      body.container20hc || 0,
      body.container20rf || 0,
      body.container40dr || 0,
      body.container40hc || 0,
      body.container40rf || 0,
      body.customsDate || null,
      body.licenseNo || '',
      body.brokerCode || '',
      body.brokerName || '',
      body.customsOffice || '',
      body.transportDate || null,
      body.bondedWarehouse || '',
      body.customsType || '',
      body.customsDept || '',
      body.declaredValue || 0,
      body.currency || 'USD',
      body.exRate || 0,
      body.dutyRate || 0,
      body.assessedValue || 0,
      body.freightAmt || 0,
      body.dutyAmt || 0,
      body.vatRate || 10,
      body.vatAmt || 0,
      body.remarks || '',
      body.status || 'DRAFT',
    ]);

    return NextResponse.json({
      success: true,
      accountId: result.insertId,
      jobNo,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// 통관정산 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.query(`
      UPDATE CUS_ACCOUNT SET
        BOUND_TYPE=?, BUSINESS_TYPE=?, TRADE_TERMS=?, BRANCH=?,
        MBL_NO=?, HBL_NO=?, CASEQ_NO=?,
        ACCOUNT_CODE=?, ACCOUNT_NAME=?,
        SHIPPER_CODE=?, SHIPPER_NAME=?, SHIPPER_ADDR=?,
        CONSIGNEE_CODE=?, CONSIGNEE_NAME=?, CONSIGNEE_ADDR=?,
        PERFORMANCE_DATE=?, PERFORMANCE_AMT=?,
        PACKAGES=?, PACKAGE_UNIT=?, WEIGHT=?, WEIGHT_UNIT=?, CBM=?,
        INPUT_DATE=?, OB_AR_DATE=?,
        FLIGHT_NO=?, VESSEL_NAME=?, VOYAGE_NO=?,
        CONTAINER_TYPE=?, CALL_SIGN=?, POL=?, POD=?,
        SALES_EMPLOYEE=?, LC_NO=?, INV_NO=?, PO_NO=?, ITEM=?,
        CONTAINER_20DR=?, CONTAINER_20HC=?, CONTAINER_20RF=?,
        CONTAINER_40DR=?, CONTAINER_40HC=?, CONTAINER_40RF=?,
        CUSTOMS_DATE=?, LICENSE_NO=?, BROKER_CODE=?, BROKER_NAME=?,
        CUSTOMS_OFFICE=?, TRANSPORT_DATE=?, BONDED_WAREHOUSE=?,
        CUSTOMS_TYPE=?, CUSTOMS_DEPT=?,
        DECLARED_VALUE=?, CURRENCY=?, EX_RATE=?, DUTY_RATE=?,
        ASSESSED_VALUE=?, FREIGHT_AMT=?, DUTY_AMT=?, VAT_RATE=?, VAT_AMT=?,
        REMARKS=?, STATUS=?,
        UPDATED_BY='admin', UPDATED_AT=NOW()
      WHERE ACCOUNT_ID=?
    `, [
      body.boundType || 'AI', body.businessType || '통관B/L', body.tradeTerms || 'CFR', body.branch || '',
      body.mblNo || '', body.hblNo || '', body.caseqNo || '',
      body.accountCode || '', body.accountName || '',
      body.shipperCode || '', body.shipperName || '', body.shipperAddr || '',
      body.consigneeCode || '', body.consigneeName || '', body.consigneeAddr || '',
      body.performanceDate || null, body.performanceAmt || 0,
      body.packages || 0, body.packageUnit || 'CT', body.weight || 0, body.weightUnit || 'KG', body.cbm || 0,
      body.inputDate || null, body.obArDate || null,
      body.flightNo || '', body.vesselName || '', body.voyageNo || '',
      body.containerType || '', body.callSign || '', body.pol || '', body.pod || '',
      body.salesEmployee || '', body.lcNo || '', body.invNo || '', body.poNo || '', body.item || '',
      body.container20dr || 0, body.container20hc || 0, body.container20rf || 0,
      body.container40dr || 0, body.container40hc || 0, body.container40rf || 0,
      body.customsDate || null, body.licenseNo || '', body.brokerCode || '', body.brokerName || '',
      body.customsOffice || '', body.transportDate || null, body.bondedWarehouse || '',
      body.customsType || '', body.customsDept || '',
      body.declaredValue || 0, body.currency || 'USD', body.exRate || 0, body.dutyRate || 0,
      body.assessedValue || 0, body.freightAmt || 0, body.dutyAmt || 0, body.vatRate || 10, body.vatAmt || 0,
      body.remarks || '', body.status || 'DRAFT',
      body.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// 통관정산 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    if (!ids) {
      return NextResponse.json({ error: 'IDs are required' }, { status: 400 });
    }

    const idArray = ids.split(',').map(id => id.trim());
    const placeholders = idArray.map(() => '?').join(',');

    // 관련 데이터 삭제 (billing detail -> billing, expense detail -> expense, then account)
    for (const id of idArray) {
      await pool.query(`DELETE FROM CUS_ACCOUNT_BILLING_DETAIL WHERE BILLING_ID IN (SELECT BILLING_ID FROM CUS_ACCOUNT_BILLING WHERE ACCOUNT_ID = ?)`, [id]);
      await pool.query(`DELETE FROM CUS_ACCOUNT_BILLING WHERE ACCOUNT_ID = ?`, [id]);
      await pool.query(`DELETE FROM CUS_ACCOUNT_EXPENSE_DETAIL WHERE EXPENSE_ID IN (SELECT EXPENSE_ID FROM CUS_ACCOUNT_EXPENSE WHERE ACCOUNT_ID = ?)`, [id]);
      await pool.query(`DELETE FROM CUS_ACCOUNT_EXPENSE WHERE ACCOUNT_ID = ?`, [id]);
    }

    await pool.query(`DELETE FROM CUS_ACCOUNT WHERE ACCOUNT_ID IN (${placeholders})`, idArray);

    return NextResponse.json({ success: true, deleted: idArray.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
