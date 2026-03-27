import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일은 필수입니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    let count = 0;
    for (const row of data) {
      const origin = String(row['Origin'] || row['ORIGIN'] || row['출발공항'] || '').trim();
      const destination = String(row['Destn'] || row['Destination'] || row['DESTINATION'] || row['도착공항'] || '').trim();

      if (!origin || !destination) continue;

      const airline = String(row['Airline'] || row['AIRLINE'] || row['항공사'] || '').trim();
      const chargeCode = String(row['Charge Code'] || row['CHARGE_CODE'] || row['요금코드'] || 'AFC').trim();
      const cargoType = String(row['Cargo Type'] || row['CARGO_TYPE'] || row['화물유형'] || 'NORMAL').trim();
      const currency = String(row['Cur'] || row['CURRENCY'] || row['통화'] || 'KRW').trim();
      const weightUnit = String(row['Kg/Lb'] || row['WEIGHT_UNIT'] || row['중량단위'] || 'KG').trim();
      const rateMin = Number(row['Min'] || row['RATE_MIN'] || row['최소운임'] || 0);
      const rateUnder45 = Number(row['-45'] || row['RATE_UNDER45'] || 0);
      const rate45 = Number(row['+45'] || row['RATE_45'] || 0);
      const rate100 = Number(row['100'] || row['RATE_100'] || 0);
      const rate300 = Number(row['300'] || row['RATE_300'] || 0);
      const rate500 = Number(row['500'] || row['RATE_500'] || 0);
      const rate1000 = Number(row['1000'] || row['RATE_1000'] || 0);
      const ratePerKg = Number(row['Rate/Kg.Lb'] || row['RATE_PER_KG'] || 0);
      const ratePerBl = Number(row['Rate_PerBL'] || row['RATE_PER_BL'] || 0);

      await pool.query<ResultSetHeader>(
        `INSERT INTO MST_AIR_TARIFF
          (AIRLINE, ORIGIN, DESTINATION, CHARGE_CODE, CARGO_TYPE, CURRENCY, WEIGHT_UNIT,
           RATE_MIN, RATE_UNDER45, RATE_45, RATE_100, RATE_300, RATE_500, RATE_1000,
           RATE_PER_KG, RATE_PER_BL, USE_YN, DEL_YN, CREATED_BY, CREATED_DTM)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'N', 'SYSTEM', NOW())`,
        [airline, origin, destination, chargeCode, cargoType, currency, weightUnit,
         rateMin, rateUnder45, rate45, rate100, rate300, rate500, rate1000, ratePerKg, ratePerBl]
      );
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Air tariff upload error:', error);
    return NextResponse.json({ error: 'Failed to upload air tariff file' }, { status: 500 });
  }
}
