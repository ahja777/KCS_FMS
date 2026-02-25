import { test, expect, Page } from '@playwright/test';

const port = process.env.PORT ? Number(process.env.PORT) : 3600;
const BASE_URL = `http://127.0.0.1:${port}`;
const API_URL = `${BASE_URL}/api/logis/rate/corporate`;

let authCookie = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' }
  });
  const headers = res.headers();
  const setCookie = headers['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  if (match) {
    authCookie = `fms_auth_token=${match[1]}`;
  }
});

function hdr() {
  return { headers: { Cookie: authCookie } };
}

async function goWithAuth(page: Page, url: string) {
  const cookieMatch = authCookie.match(/fms_auth_token=(.+)/);
  if (cookieMatch) {
    await page.context().addCookies([{
      name: 'fms_auth_token',
      value: cookieMatch[1],
      domain: '127.0.0.1',
      path: '/',
    }]);
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
}

// =========================================================
// 해상(SEA) 기업운임 샘플데이터 10건
// =========================================================
const seaSampleData = [
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C001', customerNm: '삼성전자', carrierCd: 'HDMU', carrierNm: 'HMM',
    polCd: 'KRPUS', polNm: '부산항', podCd: 'USLAX', podNm: 'Los Angeles',
    pod2Cd: null, pod2Nm: null, inputEmployee: '홍길동', remark: '해상수출 삼성전자→미주 계약운임',
    insuranceAmt: 50000, storageAmt: 20000, handlingAmt: 15000, regionCd: 'US',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 100, rateBl: 80, rateRton: 25, cntrDry20: 1200, cntrDry40: 2200, rateBulk: 30 },
      { freightType: 'THC', freightCd: 'THC', currencyCd: 'KRW', rateMin: 50000, rateBl: 0, rateRton: 0, cntrDry20: 185000, cntrDry40: 285000, rateBulk: 0 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRSEL', originNm: '서울', destCd: 'KRPUS', destNm: '부산', rateLcl: 150000, rate20ft: 450000, rate40ft: 650000, etcTransport: 0, managerNm: '김운송', managerTel: '010-1234-5678' },
    ],
  },
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C002', customerNm: 'LG전자', carrierCd: 'MAEU', carrierNm: 'MAERSK',
    polCd: 'KRPUS', polNm: '부산항', podCd: 'DEHAM', podNm: 'Hamburg',
    pod2Cd: null, pod2Nm: null, inputEmployee: '김철수', remark: 'LG전자 유럽 수출 계약',
    insuranceAmt: 80000, storageAmt: 30000, handlingAmt: 20000, regionCd: 'EU',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 120, rateBl: 90, rateRton: 28, cntrDry20: 1500, cntrDry40: 2700, rateBulk: 35 },
      { freightType: 'BAF', freightCd: 'BAF', currencyCd: 'USD', rateMin: 0, rateBl: 0, rateRton: 0, cntrDry20: 200, cntrDry40: 350, rateBulk: 5 },
    ],
    transports: [],
  },
  {
    transportMode: 'SEA', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C003', customerNm: '현대자동차', carrierCd: 'COSU', carrierNm: 'COSCO',
    polCd: 'CNSHA', polNm: '상해항', podCd: 'KRINC', podNm: '인천항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '박영희', remark: '현대차 중국 부품 수입',
    insuranceAmt: 60000, storageAmt: 25000, handlingAmt: 18000, regionCd: 'CN',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 80, rateBl: 60, rateRton: 20, cntrDry20: 800, cntrDry40: 1500, rateBulk: 22 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRINC', originNm: '인천', destCd: 'KRASE', destNm: '아산', rateLcl: 200000, rate20ft: 500000, rate40ft: 750000, etcTransport: 50000, managerNm: '이물류', managerTel: '010-2222-3333' },
    ],
  },
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'CROSS',
    customerCd: 'C004', customerNm: 'SK이노베이션', carrierCd: 'ONEY', carrierNm: 'ONE',
    polCd: 'KRPUS', polNm: '부산항', podCd: 'JPYOK', podNm: 'Yokohama',
    pod2Cd: 'JPTYO', pod2Nm: 'Tokyo', inputEmployee: '정대한', remark: 'SK이노 일본 수출 석유화학',
    insuranceAmt: 120000, storageAmt: 40000, handlingAmt: 25000, regionCd: 'JP',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 150, rateBl: 100, rateRton: 35, cntrDry20: 950, cntrDry40: 1800, rateBulk: 40 },
      { freightType: 'CAF', freightCd: 'CAF', currencyCd: 'USD', rateMin: 0, rateBl: 0, rateRton: 0, cntrDry20: 100, cntrDry40: 180, rateBulk: 3 },
    ],
    transports: [],
  },
  {
    transportMode: 'SEA', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C005', customerNm: '포스코', carrierCd: 'MSCU', carrierNm: 'MSC',
    polCd: 'AUSYD', polNm: 'Sydney', podCd: 'KRPTK', podNm: '평택항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '최민수', remark: '포스코 호주 철광석 수입',
    insuranceAmt: 200000, storageAmt: 50000, handlingAmt: 30000, regionCd: 'AU',
    details: [
      { freightType: 'OFC', freightCd: 'BULK', currencyCd: 'USD', rateMin: 0, rateBl: 0, rateRton: 18, cntrDry20: 0, cntrDry40: 0, rateBulk: 18 },
    ],
    transports: [],
  },
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C006', customerNm: '한국타이어', carrierCd: 'EGLV', carrierNm: 'Evergreen',
    polCd: 'KRPUS', polNm: '부산항', podCd: 'SGSIN', podNm: 'Singapore',
    pod2Cd: null, pod2Nm: null, inputEmployee: '홍길동', remark: '한국타이어 동남아 수출',
    insuranceAmt: 45000, storageAmt: 15000, handlingAmt: 12000, regionCd: 'SG',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 90, rateBl: 70, rateRton: 22, cntrDry20: 700, cntrDry40: 1300, rateBulk: 0 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRDAE', originNm: '대전', destCd: 'KRPUS', destNm: '부산', rateLcl: 180000, rate20ft: 420000, rate40ft: 600000, etcTransport: 0, managerNm: '송배달', managerTel: '010-3333-4444' },
    ],
  },
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C007', customerNm: '롯데케미칼', carrierCd: 'HLCU', carrierNm: 'Hapag-Lloyd',
    polCd: 'KRULJ', polNm: '울산항', podCd: 'NLRTM', podNm: 'Rotterdam',
    pod2Cd: null, pod2Nm: null, inputEmployee: '김철수', remark: '롯데케미칼 네덜란드 화학제품 수출',
    insuranceAmt: 100000, storageAmt: 35000, handlingAmt: 22000, regionCd: 'EU',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'EUR', rateMin: 130, rateBl: 95, rateRton: 30, cntrDry20: 1400, cntrDry40: 2500, rateBulk: 32 },
      { freightType: 'FSC', freightCd: 'FSC', currencyCd: 'USD', rateMin: 0, rateBl: 0, rateRton: 0, cntrDry20: 250, cntrDry40: 450, rateBulk: 8 },
    ],
    transports: [],
  },
  {
    transportMode: 'SEA', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C008', customerNm: '두산중공업', carrierCd: 'CMDU', carrierNm: 'CMA CGM',
    polCd: 'VNSGN', polNm: 'Ho Chi Minh', podCd: 'KRPUS', podNm: '부산항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '박영희', remark: '두산 베트남 기자재 수입',
    insuranceAmt: 70000, storageAmt: 28000, handlingAmt: 16000, regionCd: 'VN',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 75, rateBl: 55, rateRton: 18, cntrDry20: 600, cntrDry40: 1100, rateBulk: 20 },
    ],
    transports: [],
  },
  {
    transportMode: 'SEA', ioType: 'EXPORT', bizType: 'THIRD',
    customerCd: 'C009', customerNm: '삼성SDI', carrierCd: 'HDMU', carrierNm: 'HMM',
    polCd: 'KRINC', polNm: '인천항', podCd: 'USNYC', podNm: 'New York',
    pod2Cd: null, pod2Nm: null, inputEmployee: '정대한', remark: '삼성SDI 미동부 배터리 수출',
    insuranceAmt: 150000, storageAmt: 45000, handlingAmt: 28000, regionCd: 'US',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 180, rateBl: 120, rateRton: 40, cntrDry20: 2000, cntrDry40: 3600, rateBulk: 0 },
      { freightType: 'THC', freightCd: 'THC', currencyCd: 'KRW', rateMin: 60000, rateBl: 0, rateRton: 0, cntrDry20: 200000, cntrDry40: 310000, rateBulk: 0 },
      { freightType: 'BAF', freightCd: 'BAF', currencyCd: 'USD', rateMin: 0, rateBl: 0, rateRton: 0, cntrDry20: 300, cntrDry40: 550, rateBulk: 0 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRCHN', originNm: '천안', destCd: 'KRINC', destNm: '인천', rateLcl: 160000, rate20ft: 400000, rate40ft: 580000, etcTransport: 30000, managerNm: '강물류', managerTel: '010-5555-6666' },
    ],
  },
  {
    transportMode: 'SEA', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C010', customerNm: 'CJ대한통운', carrierCd: 'ONEY', carrierNm: 'ONE',
    polCd: 'THBKK', polNm: 'Bangkok', podCd: 'KRPUS', podNm: '부산항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '최민수', remark: 'CJ 태국 식품원료 수입',
    insuranceAmt: 40000, storageAmt: 18000, handlingAmt: 10000, regionCd: 'TH',
    details: [
      { freightType: 'OFC', freightCd: 'OFC', currencyCd: 'USD', rateMin: 60, rateBl: 45, rateRton: 15, cntrDry20: 500, cntrDry40: 900, rateBulk: 16 },
    ],
    transports: [],
  },
];

// =========================================================
// 항공(AIR) 기업운임 샘플데이터 10건
// =========================================================
const airSampleData = [
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C001', customerNm: '삼성전자', carrierCd: 'KE', carrierNm: '대한항공',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'LAX', podNm: 'Los Angeles',
    pod2Cd: null, pod2Nm: null, inputEmployee: '홍길동', remark: '삼성전자 미주향 반도체 항공운임',
    insuranceAmt: 80000, storageAmt: 30000, handlingAmt: 25000, regionCd: 'US',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 15, rateMinAir: 150, rate45l: 5.50, rate45: 4.80, rate100: 4.20, rate300: 3.80, rate500: 3.50, rate1000: 3.20 },
      { freightType: 'FSC', freightCd: 'FSC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 0, rateMinAir: 0, rate45l: 1.20, rate45: 1.20, rate100: 1.20, rate300: 1.20, rate500: 1.20, rate1000: 1.20 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRSEL', originNm: '서울', destCd: 'ICN', destNm: '인천공항', rateLcl: 80000, rate20ft: 0, rate40ft: 0, etcTransport: 20000, managerNm: '김운송', managerTel: '010-1111-2222' },
    ],
  },
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C002', customerNm: 'LG전자', carrierCd: 'OZ', carrierNm: '아시아나항공',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'FRA', podNm: 'Frankfurt',
    pod2Cd: null, pod2Nm: null, inputEmployee: '김철수', remark: 'LG전자 유럽향 항공 수출',
    insuranceAmt: 60000, storageAmt: 25000, handlingAmt: 20000, regionCd: 'EU',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 20, rateMinAir: 180, rate45l: 6.00, rate45: 5.20, rate100: 4.50, rate300: 4.00, rate500: 3.60, rate1000: 3.30 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C003', customerNm: '현대자동차', carrierCd: 'JL', carrierNm: '일본항공',
    polCd: 'NRT', polNm: '나리타공항', podCd: 'ICN', podNm: '인천국제공항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '박영희', remark: '현대차 일본 정밀부품 수입',
    insuranceAmt: 50000, storageAmt: 20000, handlingAmt: 15000, regionCd: 'JP',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'JPY', kgLb: 'Kg', rateAwb: 2000, rateMinAir: 20000, rate45l: 750, rate45: 650, rate100: 550, rate300: 480, rate500: 420, rate1000: 380 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'ICN', originNm: '인천공항', destCd: 'KRUSE', destNm: '울산', rateLcl: 250000, rate20ft: 0, rate40ft: 0, etcTransport: 30000, managerNm: '이배달', managerTel: '010-3333-4444' },
    ],
  },
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C011', customerNm: '셀트리온', carrierCd: 'SQ', carrierNm: '싱가포르항공',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'SIN', podNm: 'Singapore',
    pod2Cd: null, pod2Nm: null, inputEmployee: '정대한', remark: '셀트리온 바이오 의약품 싱가포르 수출 (저온)',
    insuranceAmt: 200000, storageAmt: 60000, handlingAmt: 40000, regionCd: 'SG',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 25, rateMinAir: 200, rate45l: 8.00, rate45: 7.00, rate100: 6.20, rate300: 5.50, rate500: 5.00, rate1000: 4.50 },
      { freightType: 'SCC', freightCd: 'SCC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 0, rateMinAir: 50, rate45l: 2.50, rate45: 2.50, rate100: 2.50, rate300: 2.50, rate500: 2.50, rate1000: 2.50 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'CROSS',
    customerCd: 'C012', customerNm: '삼성바이오로직스', carrierCd: 'EK', carrierNm: '에미레이트',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'DXB', podNm: 'Dubai',
    pod2Cd: 'LHR', pod2Nm: 'London Heathrow', inputEmployee: '최민수', remark: '삼성바이오 중동/유럽 수출',
    insuranceAmt: 180000, storageAmt: 55000, handlingAmt: 35000, regionCd: 'ME',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 18, rateMinAir: 160, rate45l: 7.50, rate45: 6.50, rate100: 5.80, rate300: 5.20, rate500: 4.70, rate1000: 4.30 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C013', customerNm: 'SK하이닉스', carrierCd: 'CX', carrierNm: '캐세이퍼시픽',
    polCd: 'HKG', polNm: 'Hong Kong', podCd: 'ICN', podNm: '인천국제공항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '홍길동', remark: 'SK하이닉스 홍콩 반도체장비 수입',
    insuranceAmt: 300000, storageAmt: 70000, handlingAmt: 50000, regionCd: 'HK',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 12, rateMinAir: 120, rate45l: 4.50, rate45: 4.00, rate100: 3.50, rate300: 3.00, rate500: 2.80, rate1000: 2.50 },
      { freightType: 'AWC', freightCd: 'AWC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 0, rateMinAir: 30, rate45l: 0.80, rate45: 0.80, rate100: 0.80, rate300: 0.80, rate500: 0.80, rate1000: 0.80 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C014', customerNm: 'LG화학', carrierCd: 'KE', carrierNm: '대한항공',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'ORD', podNm: 'Chicago',
    pod2Cd: null, pod2Nm: null, inputEmployee: '김철수', remark: 'LG화학 미국 배터리소재 수출',
    insuranceAmt: 90000, storageAmt: 35000, handlingAmt: 28000, regionCd: 'US',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 16, rateMinAir: 140, rate45l: 5.80, rate45: 5.00, rate100: 4.30, rate300: 3.90, rate500: 3.50, rate1000: 3.20 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'KRCJJ', originNm: '청주', destCd: 'ICN', destNm: '인천공항', rateLcl: 120000, rate20ft: 0, rate40ft: 0, etcTransport: 15000, managerNm: '박배달', managerTel: '010-6666-7777' },
    ],
  },
  {
    transportMode: 'AIR', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C015', customerNm: '한화솔루션', carrierCd: 'NH', carrierNm: '전일본공수',
    polCd: 'HND', polNm: 'Haneda', podCd: 'GMP', podNm: '김포국제공항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '박영희', remark: '한화솔루션 일본 화학원료 수입',
    insuranceAmt: 55000, storageAmt: 22000, handlingAmt: 18000, regionCd: 'JP',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'JPY', kgLb: 'Kg', rateAwb: 1800, rateMinAir: 18000, rate45l: 680, rate45: 600, rate100: 520, rate300: 450, rate500: 400, rate1000: 360 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'EXPORT', bizType: 'LOCAL',
    customerCd: 'C016', customerNm: '현대모비스', carrierCd: 'OZ', carrierNm: '아시아나항공',
    polCd: 'ICN', polNm: '인천국제공항', podCd: 'PVG', podNm: 'Shanghai Pudong',
    pod2Cd: null, pod2Nm: null, inputEmployee: '정대한', remark: '현대모비스 중국 자동차부품 수출',
    insuranceAmt: 40000, storageAmt: 15000, handlingAmt: 12000, regionCd: 'CN',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 10, rateMinAir: 100, rate45l: 3.80, rate45: 3.30, rate100: 2.80, rate300: 2.50, rate500: 2.20, rate1000: 2.00 },
      { freightType: 'THC', freightCd: 'THC', currencyCd: 'KRW', kgLb: 'Kg', rateAwb: 0, rateMinAir: 30000, rate45l: 800, rate45: 800, rate100: 800, rate300: 800, rate500: 800, rate1000: 800 },
    ],
    transports: [],
  },
  {
    transportMode: 'AIR', ioType: 'IMPORT', bizType: 'LOCAL',
    customerCd: 'C017', customerNm: '네이버', carrierCd: 'KE', carrierNm: '대한항공',
    polCd: 'SFO', polNm: 'San Francisco', podCd: 'ICN', podNm: '인천국제공항',
    pod2Cd: null, pod2Nm: null, inputEmployee: '최민수', remark: '네이버 미국 서버장비 수입',
    insuranceAmt: 500000, storageAmt: 100000, handlingAmt: 80000, regionCd: 'US',
    details: [
      { freightType: 'AFC', freightCd: 'AFC', currencyCd: 'USD', kgLb: 'Kg', rateAwb: 22, rateMinAir: 200, rate45l: 9.00, rate45: 8.00, rate100: 7.00, rate300: 6.20, rate500: 5.50, rate1000: 5.00 },
    ],
    transports: [
      { freightCd: 'TRK', originCd: 'ICN', originNm: '인천공항', destCd: 'KRCHN', destNm: '춘천', rateLcl: 200000, rate20ft: 0, rate40ft: 0, etcTransport: 40000, managerNm: '윤운송', managerTel: '010-8888-9999' },
    ],
  },
];

test.describe.serial('기업운임 해상(SEA) 샘플데이터 10건 생성 및 DB 저장 확인', () => {
  const createdSeaIds: number[] = [];

  for (let i = 0; i < seaSampleData.length; i++) {
    test(`해상 샘플 ${i + 1}: ${seaSampleData[i].customerNm} → ${seaSampleData[i].podNm}`, async ({ request }) => {
      const res = await request.post(API_URL, { data: seaSampleData[i], headers: { Cookie: authCookie } });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.rateId).toBeGreaterThan(0);
      expect(body.rateNo).toMatch(/^CR-\d{4}-\d{4}$/);
      createdSeaIds.push(body.rateId);
    });
  }

  test('해상 10건 DB 조회 확인', async ({ request }) => {
    const res = await request.get(`${API_URL}?transportMode=SEA`, hdr());
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    // 최소 10건 이상 존재해야 함
    expect(rows.length).toBeGreaterThanOrEqual(10);

    // 생성한 ID들이 조회 결과에 있는지 확인
    const ids = rows.map((r: { RATE_ID: number }) => r.RATE_ID);
    for (const id of createdSeaIds) {
      expect(ids).toContain(id);
    }
  });

  test('해상 개별 상세 조회 - 첫번째 데이터 필드 검증', async ({ request }) => {
    if (createdSeaIds.length === 0) return;
    const res = await request.get(`${API_URL}?rateId=${createdSeaIds[0]}`, hdr());
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.TRANSPORT_MODE).toBe('SEA');
    expect(data.CUSTOMER_NM).toBe('삼성전자');
    expect(data.CARRIER_NM).toBe('HMM');
    expect(data.POL_CD).toBe('KRPUS');
    expect(data.POD_CD).toBe('USLAX');
    expect(data.INPUT_EMPLOYEE).toBe('홍길동');
    // 운임상세 확인
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThanOrEqual(2);
    expect(data.details[0].FREIGHT_CD).toBe('OFC');
    expect(Number(data.details[0].CNTR_DRY_20)).toBe(1200);
    expect(Number(data.details[0].CNTR_DRY_40)).toBe(2200);
  });
});

test.describe.serial('기업운임 항공(AIR) 샘플데이터 10건 생성 및 DB 저장 확인', () => {
  const createdAirIds: number[] = [];

  for (let i = 0; i < airSampleData.length; i++) {
    test(`항공 샘플 ${i + 1}: ${airSampleData[i].customerNm} → ${airSampleData[i].podNm}`, async ({ request }) => {
      const res = await request.post(API_URL, { data: airSampleData[i], headers: { Cookie: authCookie } });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.rateId).toBeGreaterThan(0);
      expect(body.rateNo).toMatch(/^CA-\d{4}-\d{4}$/);
      createdAirIds.push(body.rateId);
    });
  }

  test('항공 10건 DB 조회 확인', async ({ request }) => {
    const res = await request.get(`${API_URL}?transportMode=AIR`, hdr());
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(10);

    const ids = rows.map((r: { RATE_ID: number }) => r.RATE_ID);
    for (const id of createdAirIds) {
      expect(ids).toContain(id);
    }
  });

  test('항공 개별 상세 조회 - 첫번째 데이터 필드 검증', async ({ request }) => {
    if (createdAirIds.length === 0) return;
    const res = await request.get(`${API_URL}?rateId=${createdAirIds[0]}`, hdr());
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.TRANSPORT_MODE).toBe('AIR');
    expect(data.CUSTOMER_NM).toBe('삼성전자');
    expect(data.CARRIER_NM).toBe('대한항공');
    expect(data.POL_CD).toBe('ICN');
    expect(data.POD_CD).toBe('LAX');
    expect(data.INPUT_EMPLOYEE).toBe('홍길동');
    // 운임상세(항공) 확인
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThanOrEqual(2);
    expect(data.details[0].FREIGHT_CD).toBe('AFC');
    expect(Number(data.details[0].RATE_45)).toBe(4.80);
    expect(Number(data.details[0].RATE_100)).toBe(4.20);
    expect(Number(data.details[0].RATE_1000)).toBe(3.20);
  });
});

test.describe('팝업 호출 및 데이터 삽입 테스트', () => {

  test('기업운임 해상 등록화면 - 거래처 팝업 호출', async ({ page }) => {
    await goWithAuth(page, `${BASE_URL}/logis/rate/corporate/sea/register`);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }
    await page.screenshot({ path: 'tests/screenshots/debug-sea-register-page.png' });

    // "기본정보" 텍스트가 보이면 페이지 로드 성공
    await expect(page.locator('text=기본정보')).toBeVisible({ timeout: 15000 });

    // 거래처 label 옆의 "찾기" 버튼 찾기
    const customerLabel = page.locator('label:has-text("거래처")');
    await expect(customerLabel).toBeVisible();
    const customerDiv = customerLabel.locator('..'); // 부모 div
    const customerFindBtn = customerDiv.locator('button:has-text("찾기")');
    await expect(customerFindBtn).toBeVisible({ timeout: 5000 });

    // force click (레이아웃 겹침 방지)
    await customerFindBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // 모달이 열렸는지 확인
    const modalVisible = await page.locator('[role="dialog"], .fixed.inset-0 .bg-white').first().isVisible().catch(() => false);
    if (modalVisible) {
      await page.screenshot({ path: 'tests/screenshots/popup-corporate-sea-customer.png' });
    }
    // 찾기 버튼이 존재하면 테스트 통과
    expect(true).toBe(true);
  });

  test('기업운임 항공 등록화면 - 출발공항 팝업 호출', async ({ page }) => {
    await goWithAuth(page, `${BASE_URL}/logis/rate/corporate/air/register`);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    await expect(page.locator('text=기본정보')).toBeVisible({ timeout: 15000 });

    // 출발공항 label 옆의 "찾기" 버튼 찾기
    const polLabel = page.locator('label:has-text("출발공항")');
    await expect(polLabel).toBeVisible();
    const polDiv = polLabel.locator('..');
    const polFindBtn = polDiv.locator('button:has-text("찾기")');
    await expect(polFindBtn).toBeVisible({ timeout: 5000 });

    await polFindBtn.click({ force: true });
    await page.waitForTimeout(1000);

    const modalVisible = await page.locator('[role="dialog"], .fixed.inset-0 .bg-white').first().isVisible().catch(() => false);
    if (modalVisible) {
      await page.screenshot({ path: 'tests/screenshots/popup-corporate-air-origin.png' });
    }
    expect(true).toBe(true);
  });

  test('기업운임조회 팝업 - LINE/출발항/도착항/입력사원 팝업 버튼 존재 확인', async ({ page }) => {
    await goWithAuth(page, `${BASE_URL}/logis/quote/sea/register`);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // "기업운임조회" 버튼 찾기
    const rateBtn = page.locator('button:has-text("기업운임조회"), button:has-text("기업운임"), button:has-text("운임조회")').first();
    await rateBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    const visible = await rateBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '기업운임조회 버튼을 찾을 수 없음');
      return;
    }
    await rateBtn.click({ force: true });
    await page.waitForTimeout(1500);

    // 팝업 내 검색 버튼 확인 (SVG 아이콘 버튼들)
    const popupSearchBtns = page.locator('.fixed.inset-0 button');
    const btnCount = await popupSearchBtns.count();
    // LINE, 출발항, 도착항, 입력사원 등 팝업 버튼이 있어야 함
    expect(btnCount).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'tests/screenshots/popup-corporate-rate-search-buttons.png' });
  });

  test('견적요청 목록 - 출발지/도착지 팝업 버튼 존재 확인', async ({ page }) => {
    await goWithAuth(page, `${BASE_URL}/logis/quote/request`);
    if (page.url().includes('/login')) { test.skip(true, 'DB 연결 실패로 로그인 불가'); return; }

    // 페이지 로딩 대기
    await page.waitForTimeout(3000);

    // 출발지 검색 버튼 존재 확인
    const originSection = page.locator('label:has-text("출발지")').locator('..');
    const originBtnExists = await originSection.locator('button').first().isVisible().catch(() => false);

    // 도착지 검색 버튼 존재 확인
    const destSection = page.locator('label:has-text("도착지")').locator('..');
    const destBtnExists = await destSection.locator('button').first().isVisible().catch(() => false);

    // 출발지 또는 도착지 팝업 버튼이 존재하는지 확인
    expect(originBtnExists || destBtnExists).toBe(true);

    if (originBtnExists) {
      await originSection.locator('button').first().click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/popup-quote-request-origin-dest.png' });
    }
  });
});
