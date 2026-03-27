import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// 환율 테이블 생성 API
export async function POST() {
  try {
    // 환율 마스터 테이블 (일별 환율 저장)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exchange_rate (
        rate_id INT AUTO_INCREMENT PRIMARY KEY,
        rate_date DATE NOT NULL COMMENT '환율 기준일',
        currency_code VARCHAR(20) NOT NULL COMMENT '통화코드 (USD, EUR, JPY 등)',
        currency_name VARCHAR(100) COMMENT '통화명',
        deal_bas_r DECIMAL(15,4) NOT NULL COMMENT '매매기준율',
        ttb DECIMAL(15,4) COMMENT '송금받으실때 (전신환매입율)',
        tts DECIMAL(15,4) COMMENT '송금보내실때 (전신환매도율)',
        cash_buying DECIMAL(15,4) COMMENT '현찰매입율',
        cash_selling DECIMAL(15,4) COMMENT '현찰매도율',
        bkpr DECIMAL(15,4) COMMENT '장부가격',
        kftc_deal_bas_r DECIMAL(15,4) COMMENT '서울외국환중개 기준율',
        yy_efee_r DECIMAL(10,4) COMMENT '년환가료율',
        ten_dd_efee_r DECIMAL(10,4) COMMENT '10일환가료율',
        data_source VARCHAR(50) DEFAULT 'KOREAEXIM' COMMENT '데이터 출처',
        created_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_dt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(50) DEFAULT 'system',
        UNIQUE KEY uk_rate_date_currency (rate_date, currency_code),
        INDEX idx_currency_code (currency_code),
        INDEX idx_rate_date (rate_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      COMMENT='환율 정보 테이블'
    `);

    // 환율 조회 이력 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exchange_rate_log (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        rate_date DATE NOT NULL COMMENT '조회 기준일',
        fetch_dt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '조회 일시',
        fetch_count INT DEFAULT 0 COMMENT '조회된 통화 수',
        data_source VARCHAR(50) COMMENT '데이터 출처',
        status VARCHAR(20) DEFAULT 'SUCCESS' COMMENT '조회 상태',
        error_msg TEXT COMMENT '에러 메시지',
        created_by VARCHAR(50) DEFAULT 'system'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      COMMENT='환율 조회 이력 테이블'
    `);

    // 기본 주요 통화 데이터 삽입 (오늘 날짜)
    const today = new Date().toISOString().split('T')[0];

    const defaultRates = [
      { code: 'USD', name: '미국 달러', rate: 1445.00, ttb: 1430.50, tts: 1459.50 },
      { code: 'EUR', name: '유로', rate: 1520.00, ttb: 1504.80, tts: 1535.20 },
      { code: 'JPY(100)', name: '일본 엔', rate: 950.00, ttb: 940.50, tts: 959.50 },
      { code: 'CNY', name: '중국 위안', rate: 198.00, ttb: 196.00, tts: 200.00 },
      { code: 'GBP', name: '영국 파운드', rate: 1798.00, ttb: 1780.50, tts: 1815.50 },
      { code: 'HKD', name: '홍콩 달러', rate: 185.50, ttb: 183.50, tts: 187.50 },
      { code: 'SGD', name: '싱가포르 달러', rate: 1066.00, ttb: 1055.50, tts: 1076.50 },
      { code: 'AUD', name: '호주 달러', rate: 907.50, ttb: 898.50, tts: 916.50 },
      { code: 'CAD', name: '캐나다 달러', rate: 1018.50, ttb: 1008.50, tts: 1028.50 },
      { code: 'CHF', name: '스위스 프랑', rate: 1615.00, ttb: 1598.50, tts: 1631.50 },
      { code: 'THB', name: '태국 바트', rate: 42.80, ttb: 41.80, tts: 43.80 },
      { code: 'NZD', name: '뉴질랜드 달러', rate: 823.50, ttb: 815.50, tts: 831.50 },
      { code: 'MYR', name: '말레이시아 링깃', rate: 325.50, ttb: 320.50, tts: 330.50 },
      { code: 'IDR(100)', name: '인도네시아 루피아', rate: 9.00, ttb: 8.75, tts: 9.25 },
      { code: 'VND(100)', name: '베트남 동', rate: 5.75, ttb: 5.60, tts: 5.90 },
      { code: 'PHP', name: '필리핀 페소', rate: 25.00, ttb: 24.50, tts: 25.50 },
      { code: 'INR', name: '인도 루피', rate: 17.10, ttb: 16.80, tts: 17.40 },
      { code: 'TWD', name: '대만 달러', rate: 44.50, ttb: 43.50, tts: 45.50 },
    ];

    for (const rate of defaultRates) {
      await pool.query(`
        INSERT INTO exchange_rate (rate_date, currency_code, currency_name, deal_bas_r, ttb, tts, bkpr, kftc_deal_bas_r)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          currency_name = VALUES(currency_name),
          deal_bas_r = VALUES(deal_bas_r),
          ttb = VALUES(ttb),
          tts = VALUES(tts),
          updated_dt = CURRENT_TIMESTAMP
      `, [today, rate.code, rate.name, rate.rate, rate.ttb, rate.tts, rate.rate, rate.rate]);
    }

    // 조회 이력 기록
    await pool.query(`
      INSERT INTO exchange_rate_log (rate_date, fetch_count, data_source, status)
      VALUES (?, ?, 'INITIAL_SETUP', 'SUCCESS')
    `, [today, defaultRates.length]);

    return NextResponse.json({
      success: true,
      message: '환율 테이블이 생성되고 기본 데이터가 입력되었습니다.',
      tables: ['exchange_rate', 'exchange_rate_log'],
      initialDataCount: defaultRates.length
    });

  } catch (error) {
    console.error('Exchange rate setup error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// 테이블 정보 조회
export async function GET() {
  try {
    const [rateCount] = await pool.query('SELECT COUNT(*) as count FROM exchange_rate') as any;
    const [logCount] = await pool.query('SELECT COUNT(*) as count FROM exchange_rate_log') as any;
    const [latestDate] = await pool.query('SELECT MAX(rate_date) as latest FROM exchange_rate') as any;

    return NextResponse.json({
      success: true,
      data: {
        exchangeRateCount: rateCount[0]?.count || 0,
        logCount: logCount[0]?.count || 0,
        latestRateDate: latestDate[0]?.latest || null
      }
    });
  } catch (error) {
    // 테이블이 없는 경우
    return NextResponse.json({
      success: true,
      data: {
        exchangeRateCount: 0,
        logCount: 0,
        latestRateDate: null,
        message: '테이블이 없습니다. POST 요청으로 테이블을 생성하세요.'
      }
    });
  }
}
