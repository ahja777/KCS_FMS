import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// POST: 출발/도착공항 + 중량으로 운임 자동계산
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, weight, pieces } = body;

    if (!origin || !destination) {
      return NextResponse.json({ error: '출발공항과 도착공항은 필수입니다.' }, { status: 400 });
    }

    const chargeableWeight = Number(weight) || 0;

    // Tariff 조회: 해당 구간의 NORMAL 화물 기준
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM MST_AIR_TARIFF
       WHERE DEL_YN = 'N' AND USE_YN = 'Y'
         AND ORIGIN = ? AND DESTINATION = ?
         AND CARGO_TYPE = 'NORMAL'
       ORDER BY TARIFF_DATE DESC
       LIMIT 1`,
      [origin.toUpperCase(), destination.toUpperCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        found: false,
        message: `${origin} → ${destination} 구간의 Tariff가 없습니다.`,
        rateCharge: 0,
        appliedRate: 0,
        rateType: '',
      });
    }

    const tariff = rows[0];

    // 중량 구간별 단가 결정
    let appliedRate = 0;
    let rateType = '';

    if (chargeableWeight >= 1000 && tariff.RATE_1000 > 0) {
      appliedRate = tariff.RATE_1000;
      rateType = '1000kg+';
    } else if (chargeableWeight >= 500 && tariff.RATE_500 > 0) {
      appliedRate = tariff.RATE_500;
      rateType = '500kg+';
    } else if (chargeableWeight >= 300 && tariff.RATE_300 > 0) {
      appliedRate = tariff.RATE_300;
      rateType = '300kg+';
    } else if (chargeableWeight >= 100 && tariff.RATE_100 > 0) {
      appliedRate = tariff.RATE_100;
      rateType = '100kg+';
    } else if (chargeableWeight >= 45 && tariff.RATE_45 > 0) {
      appliedRate = tariff.RATE_45;
      rateType = '45kg+';
    } else if (tariff.RATE_UNDER45 > 0) {
      appliedRate = tariff.RATE_UNDER45;
      rateType = '-45kg';
    }

    // 운임 계산: 단가 × 중량, 단 최소운임 이상
    let rateCharge = appliedRate * chargeableWeight;
    const minCharge = Number(tariff.RATE_MIN) || 0;
    if (rateCharge < minCharge) {
      rateCharge = minCharge;
      rateType += ' (MIN)';
    }

    // BL당 요금 추가
    const ratePerBl = Number(tariff.RATE_PER_BL) || 0;
    if (ratePerBl > 0) {
      rateCharge += ratePerBl;
    }

    return NextResponse.json({
      found: true,
      tariffId: tariff.ID,
      origin: tariff.ORIGIN,
      destination: tariff.DESTINATION,
      currency: tariff.CURRENCY,
      chargeableWeight,
      pieces: Number(pieces) || 0,
      appliedRate,
      rateType,
      minCharge,
      ratePerBl,
      rateCharge: Math.round(rateCharge),
    });
  } catch (error) {
    console.error('Air tariff calculate error:', error);
    return NextResponse.json({ error: 'Failed to calculate rate charge' }, { status: 500 });
  }
}
