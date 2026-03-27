import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 한국수출입은행 환율 API 응답 타입
interface KoreaEximRate {
  result: number;
  cur_unit: string;
  cur_nm: string;
  ttb: string;
  tts: string;
  deal_bas_r: string;
  bkpr: string;
  yy_efee_r: string;
  ten_dd_efee_r: string;
  kftc_deal_bas_r: string;
  kftc_bkpr: string;
}

// 변환된 환율 타입
interface ExchangeRate {
  rateId?: number;
  currencyCode: string;
  currencyName: string;
  ttb: number;
  tts: number;
  dealBasR: number;
  bkpr: number;
  kftcDealBasR: number;
  rateDate?: string;
}

// 주요 통화 순서
const MAJOR_CURRENCIES = ['USD', 'EUR', 'JPY(100)', 'CNY', 'GBP', 'HKD', 'SGD', 'AUD', 'CAD', 'CHF'];

// 데모 데이터 (API 키가 없을 때 사용)
const DEMO_DATA: ExchangeRate[] = [
  { currencyCode: 'USD', currencyName: '미국 달러', ttb: 1430.50, tts: 1459.50, dealBasR: 1445.00, bkpr: 1445, kftcDealBasR: 1445.00 },
  { currencyCode: 'EUR', currencyName: '유로', ttb: 1504.80, tts: 1535.20, dealBasR: 1520.00, bkpr: 1520, kftcDealBasR: 1520.00 },
  { currencyCode: 'JPY(100)', currencyName: '일본 엔', ttb: 940.50, tts: 959.50, dealBasR: 950.00, bkpr: 950, kftcDealBasR: 950.00 },
  { currencyCode: 'CNY', currencyName: '중국 위안', ttb: 196.00, tts: 200.00, dealBasR: 198.00, bkpr: 198, kftcDealBasR: 198.00 },
  { currencyCode: 'GBP', currencyName: '영국 파운드', ttb: 1780.50, tts: 1815.50, dealBasR: 1798.00, bkpr: 1798, kftcDealBasR: 1798.00 },
  { currencyCode: 'HKD', currencyName: '홍콩 달러', ttb: 183.50, tts: 187.50, dealBasR: 185.50, bkpr: 185, kftcDealBasR: 185.50 },
  { currencyCode: 'SGD', currencyName: '싱가포르 달러', ttb: 1055.50, tts: 1076.50, dealBasR: 1066.00, bkpr: 1066, kftcDealBasR: 1066.00 },
  { currencyCode: 'AUD', currencyName: '호주 달러', ttb: 898.50, tts: 916.50, dealBasR: 907.50, bkpr: 907, kftcDealBasR: 907.50 },
  { currencyCode: 'CAD', currencyName: '캐나다 달러', ttb: 1008.50, tts: 1028.50, dealBasR: 1018.50, bkpr: 1018, kftcDealBasR: 1018.50 },
  { currencyCode: 'CHF', currencyName: '스위스 프랑', ttb: 1598.50, tts: 1631.50, dealBasR: 1615.00, bkpr: 1615, kftcDealBasR: 1615.00 },
  { currencyCode: 'THB', currencyName: '태국 바트', ttb: 41.80, tts: 43.80, dealBasR: 42.80, bkpr: 42, kftcDealBasR: 42.80 },
  { currencyCode: 'NZD', currencyName: '뉴질랜드 달러', ttb: 815.50, tts: 831.50, dealBasR: 823.50, bkpr: 823, kftcDealBasR: 823.50 },
  { currencyCode: 'MYR', currencyName: '말레이시아 링깃', ttb: 320.50, tts: 330.50, dealBasR: 325.50, bkpr: 325, kftcDealBasR: 325.50 },
  { currencyCode: 'IDR(100)', currencyName: '인도네시아 루피아', ttb: 8.75, tts: 9.25, dealBasR: 9.00, bkpr: 9, kftcDealBasR: 9.00 },
  { currencyCode: 'VND(100)', currencyName: '베트남 동', ttb: 5.60, tts: 5.90, dealBasR: 5.75, bkpr: 5, kftcDealBasR: 5.75 },
  { currencyCode: 'PHP', currencyName: '필리핀 페소', ttb: 24.50, tts: 25.50, dealBasR: 25.00, bkpr: 25, kftcDealBasR: 25.00 },
  { currencyCode: 'INR', currencyName: '인도 루피', ttb: 16.80, tts: 17.40, dealBasR: 17.10, bkpr: 17, kftcDealBasR: 17.10 },
  { currencyCode: 'TWD', currencyName: '대만 달러', ttb: 43.50, tts: 45.50, dealBasR: 44.50, bkpr: 44, kftcDealBasR: 44.50 },
];

// 숫자 문자열을 숫자로 변환 (콤마 제거)
function parseNumber(str: string): number {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

// 통화 정렬 (주요 통화 우선)
function sortCurrencies(rates: ExchangeRate[]): ExchangeRate[] {
  return rates.sort((a, b) => {
    const indexA = MAJOR_CURRENCIES.indexOf(a.currencyCode);
    const indexB = MAJOR_CURRENCIES.indexOf(b.currencyCode);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.currencyCode.localeCompare(b.currencyCode);
  });
}

// 날짜 문자열 변환 (YYYYMMDD -> YYYY-MM-DD)
function formatDateForDB(dateStr: string): string {
  if (dateStr.includes('-')) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// DB에서 환율 조회
async function getExchangeRatesFromDB(date: string): Promise<ExchangeRate[] | null> {
  try {
    const formattedDate = formatDateForDB(date);
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT rate_id, rate_date, currency_code, currency_name,
             deal_bas_r, ttb, tts, bkpr, kftc_deal_bas_r
      FROM exchange_rate
      WHERE rate_date = ?
      ORDER BY rate_id
    `, [formattedDate]);

    if (rows.length === 0) return null;

    return rows.map(row => ({
      rateId: row.rate_id,
      currencyCode: row.currency_code,
      currencyName: row.currency_name,
      dealBasR: parseFloat(row.deal_bas_r) || 0,
      ttb: parseFloat(row.ttb) || 0,
      tts: parseFloat(row.tts) || 0,
      bkpr: parseFloat(row.bkpr) || 0,
      kftcDealBasR: parseFloat(row.kftc_deal_bas_r) || 0,
      rateDate: row.rate_date,
    }));
  } catch (error) {
    console.error('DB query error:', error);
    return null;
  }
}

// DB에 환율 저장
async function saveExchangeRatesToDB(date: string, rates: ExchangeRate[]): Promise<boolean> {
  try {
    const formattedDate = formatDateForDB(date);

    for (const rate of rates) {
      await pool.query(`
        INSERT INTO exchange_rate (rate_date, currency_code, currency_name, deal_bas_r, ttb, tts, bkpr, kftc_deal_bas_r)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          currency_name = VALUES(currency_name),
          deal_bas_r = VALUES(deal_bas_r),
          ttb = VALUES(ttb),
          tts = VALUES(tts),
          bkpr = VALUES(bkpr),
          kftc_deal_bas_r = VALUES(kftc_deal_bas_r),
          updated_dt = CURRENT_TIMESTAMP
      `, [formattedDate, rate.currencyCode, rate.currencyName, rate.dealBasR, rate.ttb, rate.tts, rate.bkpr, rate.kftcDealBasR]);
    }

    // 조회 이력 기록
    await pool.query(`
      INSERT INTO exchange_rate_log (rate_date, fetch_count, data_source, status)
      VALUES (?, ?, 'API_FETCH', 'SUCCESS')
    `, [formattedDate, rates.length]);

    return true;
  } catch (error) {
    console.error('DB save error:', error);
    return false;
  }
}

// 환율 조회 API (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');
  const source = searchParams.get('source'); // 'db' or 'api'

  // 조회일자 설정 (기본: 오늘)
  const searchDate = dateParam || new Date().toISOString().split('T')[0].replace(/-/g, '');

  // DB에서 먼저 조회 시도
  if (source !== 'api') {
    const dbRates = await getExchangeRatesFromDB(searchDate);
    if (dbRates && dbRates.length > 0) {
      return NextResponse.json({
        success: true,
        data: sortCurrencies(dbRates),
        searchDate: searchDate,
        updateTime: new Date().toISOString(),
        source: 'database',
        isDemo: false
      });
    }
  }

  // API 키 확인
  const apiKey = process.env.KOREAEXIM_API_KEY;

  if (!apiKey) {
    // API 키가 없으면 데모 데이터 반환 및 DB 저장 시도
    const demoDataWithDate = DEMO_DATA.map(r => ({ ...r, rateDate: formatDateForDB(searchDate) }));
    await saveExchangeRatesToDB(searchDate, demoDataWithDate);

    return NextResponse.json({
      success: true,
      data: sortCurrencies(DEMO_DATA),
      searchDate: searchDate,
      updateTime: new Date().toISOString(),
      source: 'demo',
      isDemo: true,
      message: '데모 데이터입니다. 실제 환율 조회를 위해 API 키를 설정하세요.'
    });
  }

  try {
    // 한국수출입은행 API 호출
    const apiUrl = `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${apiKey}&searchdate=${searchDate}&data=AP01`;

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const rawData: KoreaEximRate[] = await response.json();

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: sortCurrencies(DEMO_DATA),
        searchDate: searchDate,
        updateTime: new Date().toISOString(),
        source: 'demo',
        isDemo: true,
        message: '해당 일자의 환율 정보가 없습니다. 영업일을 확인해주세요.'
      });
    }

    // 데이터 변환
    const exchangeRates: ExchangeRate[] = rawData
      .filter(item => item.result === 1)
      .map(item => ({
        currencyCode: item.cur_unit,
        currencyName: item.cur_nm,
        ttb: parseNumber(item.ttb),
        tts: parseNumber(item.tts),
        dealBasR: parseNumber(item.deal_bas_r),
        bkpr: parseNumber(item.bkpr),
        kftcDealBasR: parseNumber(item.kftc_deal_bas_r),
      }));

    // DB에 저장
    await saveExchangeRatesToDB(searchDate, exchangeRates);

    return NextResponse.json({
      success: true,
      data: sortCurrencies(exchangeRates),
      searchDate: searchDate,
      updateTime: new Date().toISOString(),
      source: 'api',
      isDemo: false
    });

  } catch (error) {
    console.error('Exchange rate API error:', error);

    return NextResponse.json({
      success: true,
      data: sortCurrencies(DEMO_DATA),
      searchDate: searchDate,
      updateTime: new Date().toISOString(),
      source: 'demo',
      isDemo: true,
      message: 'API 호출 중 오류가 발생하여 데모 데이터를 표시합니다.'
    });
  }
}

// 환율 수동 저장 API (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, rates } = body;

    if (!date || !rates || !Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, error: '날짜와 환율 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const formattedDate = formatDateForDB(date);

    for (const rate of rates) {
      await pool.query(`
        INSERT INTO exchange_rate (rate_date, currency_code, currency_name, deal_bas_r, ttb, tts, bkpr, kftc_deal_bas_r, data_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL')
        ON DUPLICATE KEY UPDATE
          currency_name = VALUES(currency_name),
          deal_bas_r = VALUES(deal_bas_r),
          ttb = VALUES(ttb),
          tts = VALUES(tts),
          bkpr = VALUES(bkpr),
          kftc_deal_bas_r = VALUES(kftc_deal_bas_r),
          data_source = 'MANUAL',
          updated_dt = CURRENT_TIMESTAMP
      `, [formattedDate, rate.currencyCode, rate.currencyName, rate.dealBasR, rate.ttb, rate.tts, rate.bkpr || rate.dealBasR, rate.kftcDealBasR || rate.dealBasR]);
    }

    // 조회 이력 기록
    await pool.query(`
      INSERT INTO exchange_rate_log (rate_date, fetch_count, data_source, status)
      VALUES (?, ?, 'MANUAL_UPLOAD', 'SUCCESS')
    `, [formattedDate, rates.length]);

    return NextResponse.json({
      success: true,
      message: `${rates.length}개 환율 데이터가 저장되었습니다.`,
      savedCount: rates.length
    });

  } catch (error) {
    console.error('Exchange rate save error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// 환율 삭제 API (DELETE)
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const currencyCode = searchParams.get('currency');

  try {
    if (date && currencyCode) {
      // 특정 통화 삭제
      await pool.query('DELETE FROM exchange_rate WHERE rate_date = ? AND currency_code = ?', [formatDateForDB(date), currencyCode]);
    } else if (date) {
      // 특정 날짜 전체 삭제
      await pool.query('DELETE FROM exchange_rate WHERE rate_date = ?', [formatDateForDB(date)]);
    } else {
      return NextResponse.json(
        { success: false, error: '삭제할 날짜를 지정해주세요.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '환율 데이터가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Exchange rate delete error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
