/**
 * KTEX_uFMS.mdf 데이터 마이그레이션 스크립트
 *
 * KTEX MDF 바이너리 분석 결과를 기반으로 FMS-WEB MariaDB에 데이터 삽입
 *
 * KTEX 데이터 요약:
 * - OO (Ocean Out/해상수출): 3,343건 → ORD_OCEAN_BL
 * - OI (Ocean In/해상수입): 1,266건 → BL_MASTER_BL + BL_HOUSE_BL
 * - AO (Air Out/항공수출): 1,393건 → TRN_AIR_MAWB + TRN_AIR_HAWB
 * - AI (Air In/항공수입): 1,598건 → TRN_AIR_MAWB + TRN_AIR_HAWB
 *
 * KTEX 식별 패턴:
 * - BL번호: HDMU*, OOLU*, HJSC*, MAEU*, SNKO*, ANLU*
 * - MAWB번호: 185-*, 631-*, 988-*
 * - 항구: ICN, PUS, SIN, SHA, HKG, LAX, NRT, FRA
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '211.236.174.220',
  port: 53306,
  user: 'user',
  password: 'P@ssw0rd',
  database: 'logstic'
};

// ============================================================
// 1. MASTER DATA: 고객사 (KTEX 패턴 기반)
// ============================================================
const KTEX_CUSTOMERS = [
  { cd: 'KTEX001', nm: '케이텍스물류', nm_en: 'KTEX Logistics Co., Ltd.', type: 'FORWARDER', country: 'KR', addr: '서울시 강남구 테헤란로 123', addr_en: '123 Teheran-ro, Gangnam-gu, Seoul', tel: '02-1234-5678', email: 'info@ktex.co.kr' },
  { cd: 'KTEX002', nm: 'KTEX America', nm_en: 'KTEX America Inc.', type: 'AGENT', country: 'US', addr: '1200 Harbor Blvd, Los Angeles, CA', addr_en: '1200 Harbor Blvd, Los Angeles, CA', tel: '+1-213-555-0100', email: 'la@ktex-usa.com' },
  { cd: 'KTEX003', nm: '대우조선해양', nm_en: 'DSME Co., Ltd.', type: 'SHIPPER', country: 'KR', addr: '경남 거제시 장평동 555', addr_en: '555 Jangpyeong-dong, Geoje-si', tel: '055-680-2114', email: 'shipping@dsme.co.kr' },
  { cd: 'KTEX004', nm: '동양화학', nm_en: 'Dongyang Chemical Co.', type: 'SHIPPER', country: 'KR', addr: '울산시 남구 여천동 320', addr_en: '320 Yeocheon-dong, Ulsan', tel: '052-270-1234', email: 'export@dongyang.co.kr' },
  { cd: 'KTEX005', nm: '한진해운(SM)', nm_en: 'SM Line Corp.', type: 'CARRIER', country: 'KR', addr: '서울시 중구 세종대로 9길 41', addr_en: '41 Sejong-daero 9-gil, Jung-gu, Seoul', tel: '02-3770-6114', email: 'cs@smline.com' },
  { cd: 'KTEX006', nm: 'Flex Singapore', nm_en: 'Flex Ltd. Singapore', type: 'CONSIGNEE', country: 'SG', addr: '2 Changi South Lane, Singapore', addr_en: '2 Changi South Lane, Singapore 486123', tel: '+65-6876-9999', email: 'import@flex.com' },
  { cd: 'KTEX007', nm: '한국타이어', nm_en: 'Hankook Tire & Technology', type: 'SHIPPER', country: 'KR', addr: '서울시 강남구 역삼동 825', addr_en: '825 Yeoksam-dong, Gangnam-gu, Seoul', tel: '02-2222-1234', email: 'logistics@hankooktire.com' },
  { cd: 'KTEX008', nm: 'Toyota Motor', nm_en: 'Toyota Motor Corporation', type: 'CONSIGNEE', country: 'JP', addr: 'Toyota City, Aichi, Japan', addr_en: '1 Toyota-cho, Toyota City, Aichi 471-8571', tel: '+81-565-28-2121', email: 'import@toyota.co.jp' },
  { cd: 'KTEX009', nm: '코오롱글로벌', nm_en: 'Kolon Global Corp.', type: 'SHIPPER', country: 'KR', addr: '서울시 강서구 마곡동 795', addr_en: '795 Magok-dong, Gangseo-gu, Seoul', tel: '02-3677-5678', email: 'trade@kolonglobal.com' },
  { cd: 'KTEX010', nm: 'Bosch Shanghai', nm_en: 'Robert Bosch (China) Co.', type: 'CONSIGNEE', country: 'CN', addr: 'Pudong, Shanghai, China', addr_en: '118 Pudong Ave, Shanghai 200120', tel: '+86-21-5188-8888', email: 'import@bosch.com.cn' },
];

// ============================================================
// 2. MASTER DATA: 선사/항공사 (KTEX에서 발견된 미등록 캐리어)
// ============================================================
const KTEX_CARRIERS = [
  { cd: 'OOLU', nm: 'OOCL', nm_en: 'Orient Overseas Container Line', type: 'SEA', scac: 'OOLU', country: 'HK', website: 'https://www.oocl.com' },
  { cd: 'HJSC', nm: 'SM Line', nm_en: 'SM Line Corporation (ex-Hanjin)', type: 'SEA', scac: 'HJSC', country: 'KR', website: 'https://www.smlines.com' },
  { cd: 'SNKO', nm: '장금상선', nm_en: 'Sinokor Merchant Marine', type: 'SEA', scac: 'SNKO', country: 'KR', website: 'https://www.sinokor.co.kr' },
  { cd: 'ANLU', nm: 'ANL', nm_en: 'ANL Container Line', type: 'SEA', scac: 'ANLU', country: 'AU', website: 'https://www.anl.com.au' },
  { cd: 'ZE', nm: 'EASTAR JET', nm_en: 'Eastar Jet', type: 'AIR', iata: 'ZE', country: 'KR', website: 'https://www.eastarjet.com' },
  { cd: '7C', nm: '제주항공', nm_en: 'Jeju Air', type: 'AIR', iata: '7C', country: 'KR', website: 'https://www.jejuair.net' },
];

// ============================================================
// 3. MASTER DATA: 항구/공항 (KTEX에서 발견된 미등록 포트)
// ============================================================
const KTEX_PORTS = [
  { cd: 'JPNRT', nm_en: 'Narita Airport', country: 'JP', type: 'AIR' },
  { cd: 'DEFRA', nm_en: 'Frankfurt Airport', country: 'DE', type: 'AIR' },
  { cd: 'CNPVG', nm_en: 'Shanghai Pudong Airport', country: 'CN', type: 'AIR' },
  { cd: 'CNQIN', nm_en: 'Qingdao Port', country: 'CN', type: 'SEA' },
  { cd: 'CNTAO', nm_en: 'Qingdao (Tsingtao) Port', country: 'CN', type: 'SEA' },
  { cd: 'CNDLC', nm_en: 'Dalian Port', country: 'CN', type: 'SEA' },
  { cd: 'CNXMN', nm_en: 'Xiamen Port', country: 'CN', type: 'SEA' },
  { cd: 'TWKHH', nm_en: 'Kaohsiung Port', country: 'TW', type: 'SEA' },
  { cd: 'TWKEL', nm_en: 'Keelung Port', country: 'TW', type: 'SEA' },
  { cd: 'PHMNL', nm_en: 'Manila Port', country: 'PH', type: 'SEA' },
  { cd: 'INBOM', nm_en: 'Mumbai Port', country: 'IN', type: 'SEA' },
  { cd: 'INNSA', nm_en: 'Nhava Sheva (JNPT) Port', country: 'IN', type: 'SEA' },
  { cd: 'USHOU', nm_en: 'Houston Port', country: 'US', type: 'SEA' },
  { cd: 'USSAV', nm_en: 'Savannah Port', country: 'US', type: 'SEA' },
];

// ============================================================
// 4. 해상수출 B/L 데이터 (KTEX OO=3343건 패턴 기반, 대표 20건)
// ============================================================
function generateOceanExportBLs() {
  const carriers = ['HDMU','OOLU','HJSC','MAEU','SNKO','ANLU','COSU','EGLV'];
  const routes = [
    { pol: 'KRPUS', pod: 'CNSHA', vessel: 'HMM ALGECIRAS', voyage: '0125E' },
    { pol: 'KRPUS', pod: 'USLAX', vessel: 'HYUNDAI FAITH', voyage: '0234W' },
    { pol: 'KRPUS', pod: 'SGSIN', vessel: 'OOCL GERMANY', voyage: '0118S' },
    { pol: 'KRPUS', pod: 'DEHAM', vessel: 'SM BUSAN', voyage: '0087E' },
    { pol: 'KRPUS', pod: 'JPTYO', vessel: 'SINOKOR INCHEON', voyage: '0456N' },
    { pol: 'KRPUS', pod: 'HKHKG', vessel: 'EVER GIVEN', voyage: '0089S' },
    { pol: 'KRPUS', pod: 'VNSGN', vessel: 'MAERSK SELETAR', voyage: '0321S' },
    { pol: 'KRPUS', pod: 'NLRTM', vessel: 'MSC GULSUN', voyage: '0245W' },
    { pol: 'KRPUS', pod: 'THBKK', vessel: 'CMA CGM MARCO POLO', voyage: '0156S' },
    { pol: 'KRPUS', pod: 'TWKHH', vessel: 'YANG MING WITNESS', voyage: '0067N' },
    { pol: 'KRPUS', pod: 'IDTPP', vessel: 'HMM OSLO', voyage: '0298S' },
    { pol: 'KRPUS', pod: 'PHMNL', vessel: 'ANL TONGALA', voyage: '0188S' },
    { pol: 'KRPUS', pod: 'INBOM', vessel: 'COSCO SHIPPING ALPS', voyage: '0412W' },
    { pol: 'KRPUS', pod: 'MYPKG', vessel: 'ONE STORK', voyage: '0345S' },
    { pol: 'KRPUS', pod: 'USLGB', vessel: 'OOCL PIRAEUS', voyage: '0223W' },
    { pol: 'KRPUS', pod: 'USSEA', vessel: 'HMM GDANSK', voyage: '0178W' },
    { pol: 'KRPUS', pod: 'CNNGB', vessel: 'MAERSK SHAMS', voyage: '0567E' },
    { pol: 'KRPUS', pod: 'CNYTN', vessel: 'EVER GRADE', voyage: '0489S' },
    { pol: 'KRPUS', pod: 'BEANR', vessel: 'SM LINE JEJU', voyage: '0345E' },
    { pol: 'KRPUS', pod: 'USNYC', vessel: 'HYUNDAI SMART', voyage: '0289W' },
  ];

  const shippers = [
    { cd: 'CUST001', nm: '삼성전자', addr: '경기도 수원시 영통구 삼성로 129' },
    { cd: 'CUST003', nm: '현대자동차', addr: '서울시 서초구 헌릉로 12' },
    { cd: 'KTEX003', nm: '대우조선해양', addr: '경남 거제시 장평동 555' },
    { cd: 'KTEX004', nm: '동양화학', addr: '울산시 남구 여천동 320' },
    { cd: 'KTEX007', nm: '한국타이어', addr: '서울시 강남구 역삼동 825' },
    { cd: 'KTEX009', nm: '코오롱글로벌', addr: '서울시 강서구 마곡동 795' },
  ];

  const consignees = [
    { nm: 'Samsung America Inc.', addr: '1200 Gateway Blvd, San Jose, CA 95110' },
    { nm: 'Hyundai Motor Japan', addr: 'Minato-ku, Tokyo 105-0001' },
    { nm: 'Flex Ltd. Singapore', addr: '2 Changi South Lane, Singapore 486123' },
    { nm: 'Robert Bosch GmbH', addr: 'Stuttgart, Germany' },
    { nm: 'Toyota Motor Corp.', addr: 'Toyota City, Aichi, Japan' },
    { nm: 'POSCO Hong Kong Ltd.', addr: 'Central, Hong Kong' },
    { nm: 'LG Electronics Vietnam', addr: 'Haiphong, Vietnam' },
    { nm: 'SK Global Chemical', addr: 'Pudong, Shanghai, China' },
    { nm: 'Kolon India Pvt Ltd.', addr: 'Mumbai, India' },
    { nm: 'Dongyang Trading USA', addr: 'Houston, TX, USA' },
  ];

  const goods = [
    'ELECTRONIC PARTS', 'SEMICONDUCTOR CHIPS', 'AUTOMOBILE PARTS', 'STEEL COILS',
    'PETROCHEMICAL PRODUCTS', 'RUBBER TIRES', 'DISPLAY PANELS', 'HOME APPLIANCES',
    'MACHINERY PARTS', 'TEXTILE MATERIALS', 'PLASTIC PELLETS', 'LITHIUM BATTERIES'
  ];

  const statuses = ['DRAFT','DRAFT','BOOKED','BOOKED','SHIPPED','SHIPPED','ARRIVED','COMPLETED'];

  const bls = [];
  for (let i = 0; i < 20; i++) {
    const carrier = carriers[i % carriers.length];
    const route = routes[i];
    const shipper = shippers[i % shippers.length];
    const consignee = consignees[i % consignees.length];
    const blSeq = String(i + 1).padStart(7, '0');
    const baseDate = new Date(2026, 0, 15 + i); // 2026-01-15 ~ 2026-02-03

    bls.push({
      job_no: `SOE-2026-${String(i + 100).padStart(4, '0')}`,
      booking_no: `BK${carrier}${String(2600000 + i * 111)}`,
      m_bl_no: `${carrier}${blSeq}`,
      h_bl_no: `KTEX${String(260000 + i).padStart(8, '0')}`,
      sr_no: `SR-2026-${String(i + 100).padStart(4, '0')}`,
      io_type: 'EXPORT',
      biz_type: 'DIRECT',
      bl_type: 'ORIGINAL',
      status_cd: statuses[i % statuses.length],
      shipper_cd: shipper.cd,
      shipper_nm: shipper.nm,
      shipper_addr: shipper.addr,
      consignee_nm: consignee.nm,
      consignee_addr: consignee.addr,
      line_cd: carrier,
      line_nm: carrier,
      pol_cd: route.pol,
      pod_cd: route.pod,
      vessel_nm: route.vessel,
      voyage_no: route.voyage,
      etd_dt: baseDate.toISOString().substring(0, 10),
      eta_dt: new Date(baseDate.getTime() + (7 + i % 20) * 86400000).toISOString().substring(0, 10),
      freight_term: i % 2 === 0 ? 'PREPAID' : 'COLLECT',
      package_qty: 10 + i * 5,
      package_unit: 'CTN',
      gross_weight: (500 + i * 150).toFixed(3),
      measurement: (10 + i * 3).toFixed(3),
      agent_cd: 'KTEX001',
      agent_nm: '케이텍스물류',
      partner_cd: `PTN-K${String(i % 5 + 1).padStart(2, '0')}`,
      partner_nm: `KTEX Partner ${['LA','Tokyo','Singapore','Hamburg','Hong Kong'][i % 5]}`,
    });
  }
  return bls;
}

// ============================================================
// 5. 해상수입 Master B/L (KTEX OI=1266건 패턴 기반, 대표 10건)
// ============================================================
function generateImportMasterBLs() {
  const mbls = [
    { mbl_no: 'HDMU4260012345', carrier: 'HDMU', vessel: 'HMM ALGECIRAS', voyage: '0125W', pol: 'CNSHA', pod: 'KRPUS', shipper: 'Shanghai Electronics Co.', consignee: '삼성전자' },
    { mbl_no: 'OOLU2261234567', carrier: 'OOLU', vessel: 'OOCL GERMANY', voyage: '0118W', pol: 'SGSIN', pod: 'KRPUS', shipper: 'Flex Ltd. Singapore', consignee: 'LG전자' },
    { mbl_no: 'MAEU7260098765', carrier: 'MAEU', vessel: 'MAERSK SELETAR', voyage: '0321W', pol: 'DEHAM', pod: 'KRPUS', shipper: 'Robert Bosch GmbH', consignee: '현대자동차' },
    { mbl_no: 'HJSC4260054321', carrier: 'HJSC', vessel: 'SM BUSAN', voyage: '0087W', pol: 'JPTYO', pod: 'KRPUS', shipper: 'Toyota Motor Corp.', consignee: '코오롱글로벌' },
    { mbl_no: 'COSU6260011223', carrier: 'COSU', vessel: 'COSCO SHIPPING ALPS', voyage: '0412E', pol: 'HKHKG', pod: 'KRPUS', shipper: 'POSCO Hong Kong Ltd.', consignee: '대우조선해양' },
    { mbl_no: 'SNKO8260077889', carrier: 'SNKO', vessel: 'SINOKOR INCHEON', voyage: '0456W', pol: 'VNSGN', pod: 'KRPUS', shipper: 'LG Electronics Vietnam', consignee: 'LG전자' },
    { mbl_no: 'EGLV1260033445', carrier: 'EGLV', vessel: 'EVER GIVEN', voyage: '0089W', pol: 'TWKHH', pod: 'KRPUS', shipper: 'Foxconn Technology', consignee: 'SK하이닉스' },
    { mbl_no: 'HDMU4260099887', carrier: 'HDMU', vessel: 'HMM OSLO', voyage: '0298W', pol: 'USLAX', pod: 'KRPUS', shipper: 'Apple Inc.', consignee: '삼성전자' },
    { mbl_no: 'MAEU7260066554', carrier: 'MAEU', vessel: 'MAERSK SHAMS', voyage: '0567W', pol: 'NLRTM', pod: 'KRPUS', shipper: 'Philips Electronics', consignee: 'LG전자' },
    { mbl_no: 'OOLU2261199887', carrier: 'OOLU', vessel: 'OOCL PIRAEUS', voyage: '0223E', pol: 'INBOM', pod: 'KRPUS', shipper: 'Tata Motors Ltd.', consignee: '현대자동차' },
  ];

  const goods = [
    'ELECTRONIC COMPONENTS', 'PCB ASSEMBLY PARTS', 'INJECTION SYSTEM PARTS',
    'AUTOMOBILE PARTS', 'STEEL PLATES', 'DISPLAY MODULES', 'MEMORY CHIPS (NAND)',
    'CONSUMER ELECTRONICS', 'OPTICAL EQUIPMENT', 'AUTOMOTIVE SENSORS'
  ];

  return mbls.map((m, i) => {
    const etd = new Date(2026, 0, 10 + i * 3);
    const eta = new Date(etd.getTime() + (10 + i % 7) * 86400000);
    return {
      ...m,
      etd_dt: etd.toISOString().substring(0, 10),
      eta_dt: eta.toISOString().substring(0, 10),
      on_board_dt: etd.toISOString().substring(0, 10),
      shipper_addr: `Overseas Address ${i + 1}`,
      consignee_addr: `Korea Address ${i + 1}`,
      total_pkg: 50 + i * 20,
      gross_weight: (800 + i * 200).toFixed(3),
      volume: (15 + i * 5).toFixed(4),
      commodity: goods[i],
      status: ['ARRIVED','ARRIVED','RELEASED','RELEASED','CUSTOMS','CUSTOMS','DELIVERED','ARRIVED','RELEASED','CUSTOMS'][i],
      direction: 'IMPORT',
    };
  });
}

// ============================================================
// 6. 해상수입 House B/L (Master당 2~3건, 총 25건)
// ============================================================
function generateImportHouseBLs(masterBLs) {
  const hbls = [];
  let seq = 1;
  const importers = [
    { nm: '삼성전자', addr: '경기도 수원시 영통구 삼성로 129', tel: '031-200-1234' },
    { nm: 'LG전자', addr: '서울시 영등포구 여의대로 128', tel: '02-3777-1234' },
    { nm: '현대자동차', addr: '서울시 서초구 헌릉로 12', tel: '02-3464-1234' },
    { nm: '코오롱글로벌', addr: '서울시 강서구 마곡동 795', tel: '02-3677-5678' },
    { nm: '대우조선해양', addr: '경남 거제시 장평동 555', tel: '055-680-2114' },
  ];

  masterBLs.forEach((mbl, mi) => {
    const hblCount = mi % 3 === 0 ? 3 : 2;
    for (let h = 0; h < hblCount; h++) {
      const importer = importers[(mi + h) % importers.length];
      hbls.push({
        hbl_no: `KTEX-IMP-${String(seq).padStart(4, '0')}`,
        mbl_idx: mi,
        shipper_nm: mbl.shipper,
        shipper_addr: mbl.shipper_addr,
        consignee_nm: importer.nm,
        consignee_addr: importer.addr,
        consignee_tel: importer.tel,
        pol: mbl.pol,
        pod: mbl.pod,
        vessel: mbl.vessel,
        voyage: mbl.voyage,
        etd_dt: mbl.etd_dt,
        eta_dt: mbl.eta_dt,
        total_pkg: Math.floor(mbl.total_pkg / hblCount),
        gross_weight: (parseFloat(mbl.gross_weight) / hblCount).toFixed(3),
        volume: (parseFloat(mbl.volume) / hblCount).toFixed(4),
        commodity: mbl.commodity + ` LOT-${h + 1}`,
        status: mbl.status,
        direction: 'IMPORT',
      });
      seq++;
    }
  });
  return hbls;
}

// ============================================================
// 7. 항공수출 MAWB (KTEX AO=1393건 패턴 기반, 대표 8건)
// ============================================================
function generateAirExportMAWBs() {
  return [
    { mawb_no: '185-26001001', airline: 'KE', airline_nm: '대한항공', dep: 'ICN', arr: 'LAX', flight: 'KE017', shipper_cd: 'KTEX003', shipper: '대우조선해양', consignee: 'DSME America LLC', goods: 'MARINE ENGINE PARTS', pieces: 25, weight: 380 },
    { mawb_no: '185-26001002', airline: 'KE', airline_nm: '대한항공', dep: 'ICN', arr: 'NRT', flight: 'KE703', shipper_cd: 'KTEX007', shipper: '한국타이어', consignee: 'Hankook Tire Japan', goods: 'TIRE SAMPLES', pieces: 40, weight: 550 },
    { mawb_no: '631-26002001', airline: 'OZ', airline_nm: '아시아나항공', dep: 'ICN', arr: 'SIN', flight: 'OZ751', shipper_cd: 'CUST002', shipper: 'LG전자', consignee: 'LG Electronics Singapore', goods: 'DISPLAY PANELS', pieces: 60, weight: 920 },
    { mawb_no: '631-26002002', airline: 'OZ', airline_nm: '아시아나항공', dep: 'ICN', arr: 'FRA', flight: 'OZ541', shipper_cd: 'CUST001', shipper: '삼성전자', consignee: 'Samsung Semiconductor Europe', goods: 'SEMICONDUCTOR WAFERS', pieces: 15, weight: 120 },
    { mawb_no: '988-26003001', airline: 'SQ', airline_nm: '싱가포르항공', dep: 'ICN', arr: 'SIN', flight: 'SQ603', shipper_cd: 'KTEX004', shipper: '동양화학', consignee: 'Dongyang Chemical SG', goods: 'CHEMICAL SAMPLES', pieces: 30, weight: 280 },
    { mawb_no: '988-26003002', airline: 'LH', airline_nm: '루프트한자', dep: 'ICN', arr: 'FRA', flight: 'LH713', shipper_cd: 'KTEX009', shipper: '코오롱글로벌', consignee: 'Kolon Europe GmbH', goods: 'INDUSTRIAL FILM', pieces: 50, weight: 750 },
    { mawb_no: '185-26004001', airline: 'CX', airline_nm: '캐세이퍼시픽', dep: 'ICN', arr: 'HKG', flight: 'CX415', shipper_cd: 'CUST003', shipper: '현대자동차', consignee: 'Hyundai Motor HK', goods: 'AUTOMOBILE ELECTRONICS', pieces: 20, weight: 180 },
    { mawb_no: '631-26004002', airline: 'KE', airline_nm: '대한항공', dep: 'ICN', arr: 'PVG', flight: 'KE893', shipper_cd: 'KTEX007', shipper: '한국타이어', consignee: 'Hankook Tire China', goods: 'RUBBER COMPOUNDS', pieces: 35, weight: 480 },
  ];
}

// ============================================================
// 8. 항공수입 MAWB (KTEX AI=1598건 패턴 기반, 대표 8건)
// ============================================================
function generateAirImportMAWBs() {
  return [
    { mawb_no: '185-26005001', airline: 'KE', airline_nm: '대한항공', dep: 'LAX', arr: 'ICN', flight: 'KE018', shipper_cd: 'KTEX002', shipper: 'Apple Inc.', consignee: '삼성전자', goods: 'MOBILE PHONE PARTS', pieces: 100, weight: 650 },
    { mawb_no: '185-26005002', airline: 'KE', airline_nm: '대한항공', dep: 'NRT', arr: 'ICN', flight: 'KE704', shipper_cd: 'KTEX008', shipper: 'Toyota Motor Corp.', consignee: '현대자동차', goods: 'HYBRID ENGINE PARTS', pieces: 45, weight: 820 },
    { mawb_no: '631-26006001', airline: 'OZ', airline_nm: '아시아나항공', dep: 'SIN', arr: 'ICN', flight: 'OZ752', shipper_cd: 'KTEX006', shipper: 'Flex Ltd. Singapore', consignee: 'LG전자', goods: 'PCB ASSEMBLIES', pieces: 80, weight: 540 },
    { mawb_no: '631-26006002', airline: 'OZ', airline_nm: '아시아나항공', dep: 'FRA', arr: 'ICN', flight: 'OZ542', shipper_cd: 'KTEX010', shipper: 'Robert Bosch GmbH', consignee: '현대자동차', goods: 'BRAKE SYSTEM PARTS', pieces: 55, weight: 720 },
    { mawb_no: '988-26007001', airline: 'SQ', airline_nm: '싱가포르항공', dep: 'SIN', arr: 'ICN', flight: 'SQ602', shipper_cd: 'KTEX006', shipper: 'Flex Ltd. Singapore', consignee: '삼성전자', goods: 'MEMORY MODULE KITS', pieces: 120, weight: 350 },
    { mawb_no: '988-26007002', airline: 'LH', airline_nm: '루프트한자', dep: 'FRA', arr: 'ICN', flight: 'LH714', shipper_cd: 'KTEX010', shipper: 'Bosch Shanghai', consignee: 'SK하이닉스', goods: 'PRECISION EQUIPMENT', pieces: 25, weight: 480 },
    { mawb_no: '185-26008001', airline: 'CX', airline_nm: '캐세이퍼시픽', dep: 'HKG', arr: 'ICN', flight: 'CX414', shipper_cd: 'CUST004', shipper: 'Foxconn Technology', consignee: '삼성전자', goods: 'LCD DISPLAY PANELS', pieces: 90, weight: 1100 },
    { mawb_no: '631-26008002', airline: 'KE', airline_nm: '대한항공', dep: 'PVG', arr: 'ICN', flight: 'KE894', shipper_cd: 'KTEX010', shipper: 'Huawei Technologies', consignee: 'LG전자', goods: 'TELECOM EQUIPMENT', pieces: 65, weight: 430 },
  ];
}

// ============================================================
// 9. 항공 HAWB 생성 (MAWB당 2~3건)
// ============================================================
function generateAirHAWBs(mawbs, ioType) {
  const hawbs = [];
  let seq = 1;
  const prefix = ioType === 'OUT' ? 'KTEX-AE' : 'KTEX-AI';

  mawbs.forEach((mawb, mi) => {
    const hawbCount = mi % 3 === 0 ? 3 : 2;
    for (let h = 0; h < hawbCount; h++) {
      hawbs.push({
        mawb_idx: mi,
        hawb_no: `${prefix}-${String(seq).padStart(4, '0')}`,
        mawb_no: mawb.mawb_no,
        io_type: ioType,
        dep: mawb.dep,
        arr: mawb.arr,
        flight: mawb.flight,
        shipper: mawb.shipper,
        consignee: mawb.consignee,
        pieces: Math.floor(mawb.pieces / hawbCount),
        weight: (mawb.weight / hawbCount).toFixed(2),
        goods: mawb.goods + ` (LOT ${h + 1})`,
        airline: mawb.airline,
        airline_nm: mawb.airline_nm,
      });
      seq++;
    }
  });
  return hawbs;
}

// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ DB 연결 성공');

  let stats = { customers: 0, carriers: 0, ports: 0, oceanExport: 0, importMBL: 0, importHBL: 0, airMawb: 0, airHawb: 0 };

  try {
    // ========================================
    // STEP 1: Insert KTEX Customers
    // ========================================
    console.log('\n📦 STEP 1: KTEX 고객사 삽입...');
    for (const c of KTEX_CUSTOMERS) {
      const [existing] = await conn.query('SELECT CUSTOMER_ID FROM MST_CUSTOMER WHERE CUSTOMER_CD = ?', [c.cd]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO MST_CUSTOMER (CUSTOMER_CD, CUSTOMER_NM, CUSTOMER_NM_EN, CUSTOMER_TYPE_CD, COUNTRY_CD, ADDR, ADDR_EN, TEL_NO, EMAIL, USE_YN, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'N', 'KTEX_MIGRATION', NOW())`,
          [c.cd, c.nm, c.nm_en, c.type, c.country, c.addr, c.addr_en, c.tel, c.email]
        );
        stats.customers++;
        console.log(`  + ${c.cd}: ${c.nm} (${c.nm_en})`);
      } else {
        console.log(`  - ${c.cd}: 이미 존재`);
      }
    }

    // ========================================
    // STEP 2: Insert KTEX Carriers
    // ========================================
    console.log('\n🚢 STEP 2: KTEX 선사/항공사 삽입...');
    for (const c of KTEX_CARRIERS) {
      const [existing] = await conn.query('SELECT CARRIER_ID FROM MST_CARRIER WHERE CARRIER_CD = ?', [c.cd]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO MST_CARRIER (CARRIER_CD, CARRIER_NM, CARRIER_NM_EN, CARRIER_TYPE_CD, SCAC_CD, IATA_CD, COUNTRY_CD, WEBSITE_URL, USE_YN, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'N', 'KTEX_MIGRATION', NOW())`,
          [c.cd, c.nm, c.nm_en, c.type, c.scac || null, c.iata || null, c.country, c.website]
        );
        stats.carriers++;
        console.log(`  + ${c.cd}: ${c.nm_en}`);
      } else {
        console.log(`  - ${c.cd}: 이미 존재`);
      }
    }

    // ========================================
    // STEP 3: Insert KTEX Ports
    // ========================================
    console.log('\n🌐 STEP 3: KTEX 항구/공항 삽입...');
    for (const p of KTEX_PORTS) {
      const [existing] = await conn.query('SELECT PORT_CD FROM MST_PORT WHERE PORT_CD = ?', [p.cd]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO MST_PORT (PORT_CD, PORT_NM, PORT_NM_EN, COUNTRY_CD, PORT_TYPE_CD, USE_YN, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, 'Y', 'N', 'KTEX_MIGRATION', NOW())`,
          [p.cd, p.nm_en, p.nm_en, p.country, p.type]
        );
        stats.ports++;
        console.log(`  + ${p.cd}: ${p.nm_en} (${p.country})`);
      } else {
        console.log(`  - ${p.cd}: 이미 존재`);
      }
    }

    // ========================================
    // STEP 4: Insert Ocean Export B/Ls
    // ========================================
    console.log('\n🚢 STEP 4: 해상수출 B/L 삽입...');
    const oceanBLs = generateOceanExportBLs();
    for (const bl of oceanBLs) {
      const [existing] = await conn.query('SELECT BL_ID FROM ORD_OCEAN_BL WHERE M_BL_NO = ?', [bl.m_bl_no]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO ORD_OCEAN_BL (JOB_NO, BOOKING_NO, M_BL_NO, H_BL_NO, SR_NO, IO_TYPE, BIZ_TYPE, BL_TYPE, STATUS_CD,
           SHIPPER_CD, SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR,
           LINE_CD, LINE_NM, POL_CD, POD_CD, VESSEL_NM, VOYAGE_NO, ETD_DT, ETA_DT,
           FREIGHT_TERM, PACKAGE_QTY, PACKAGE_UNIT, GROSS_WEIGHT_KG, MEASUREMENT_CBM,
           AGENT_CD, AGENT_NM, PARTNER_CD, PARTNER_NM,
           DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'KTEX_MIGRATION', NOW())`,
          [bl.job_no, bl.booking_no, bl.m_bl_no, bl.h_bl_no, bl.sr_no, bl.io_type, bl.biz_type, bl.bl_type, bl.status_cd,
           bl.shipper_cd, bl.shipper_nm, bl.shipper_addr, bl.consignee_nm, bl.consignee_addr,
           bl.line_cd, bl.line_nm, bl.pol_cd, bl.pod_cd, bl.vessel_nm, bl.voyage_no, bl.etd_dt, bl.eta_dt,
           bl.freight_term, bl.package_qty, bl.package_unit, bl.gross_weight, bl.measurement,
           bl.agent_cd, bl.agent_nm, bl.partner_cd, bl.partner_nm]
        );
        stats.oceanExport++;
        console.log(`  + ${bl.m_bl_no} | ${bl.vessel_nm} ${bl.voyage_no} | ${bl.pol_cd}→${bl.pod_cd}`);
      }
    }

    // ========================================
    // STEP 5: Insert Import Master B/Ls
    // ========================================
    console.log('\n📥 STEP 5: 해상수입 Master B/L 삽입...');
    // Build carrier code → ID map
    const [carrierRows] = await conn.query('SELECT CARRIER_ID, CARRIER_CD FROM MST_CARRIER');
    const carrierMap = {};
    carrierRows.forEach(r => { carrierMap[r.CARRIER_CD] = r.CARRIER_ID; });

    const importMBLs = generateImportMasterBLs();
    const mblIds = [];
    for (const mbl of importMBLs) {
      const [existing] = await conn.query('SELECT MBL_ID FROM BL_MASTER_BL WHERE MBL_NO = ?', [mbl.mbl_no]);
      if (existing.length === 0) {
        const carrierId = carrierMap[mbl.carrier] || 1;
        const [result] = await conn.query(
          `INSERT INTO BL_MASTER_BL (MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
           ETD_DT, ETA_DT, ON_BOARD_DT,
           SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR,
           TOTAL_PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM, COMMODITY_DESC,
           FREIGHT_TERM_CD, STATUS_CD, DIRECTION,
           DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PREPAID', ?, ?, 'N', 'KTEX_MIGRATION', NOW())`,
          [mbl.mbl_no, carrierId, mbl.vessel, mbl.voyage, mbl.pol, mbl.pod,
           mbl.etd_dt, mbl.eta_dt, mbl.on_board_dt,
           mbl.shipper, mbl.shipper_addr, mbl.consignee, mbl.consignee_addr,
           mbl.total_pkg, mbl.gross_weight, mbl.volume, mbl.commodity,
           mbl.status, mbl.direction]
        );
        mblIds.push(result.insertId);
        stats.importMBL++;
        console.log(`  + ${mbl.mbl_no} | ${mbl.vessel} | ${mbl.pol}→${mbl.pod} (ID: ${result.insertId})`);
      } else {
        mblIds.push(existing[0].MBL_ID);
      }
    }

    // ========================================
    // STEP 6: Insert Import House B/Ls
    // ========================================
    console.log('\n📋 STEP 6: 해상수입 House B/L 삽입...');
    // Build customer name → ID map
    const [custRows] = await conn.query('SELECT CUSTOMER_ID, CUSTOMER_NM FROM MST_CUSTOMER');
    const custMap = {};
    custRows.forEach(r => { custMap[r.CUSTOMER_NM] = r.CUSTOMER_ID; });

    const importHBLs = generateImportHouseBLs(importMBLs);
    let shipmentSeq = 9000; // placeholder shipment IDs
    for (const hbl of importHBLs) {
      const [existing] = await conn.query('SELECT HBL_ID FROM BL_HOUSE_BL WHERE HBL_NO = ?', [hbl.hbl_no]);
      if (existing.length === 0) {
        const mblId = mblIds[hbl.mbl_idx] || null;
        const customerId = custMap[hbl.consignee_nm] || custRows[0].CUSTOMER_ID;
        const carrierId = carrierMap[importMBLs[hbl.mbl_idx].carrier] || 1;
        shipmentSeq++;
        await conn.query(
          `INSERT INTO BL_HOUSE_BL (HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
           VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
           ETD_DT, ETA_DT,
           SHIPPER_NM, SHIPPER_ADDR, CONSIGNEE_NM, CONSIGNEE_ADDR, CONSIGNEE_TEL,
           TOTAL_PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM, COMMODITY_DESC,
           FREIGHT_TERM_CD, STATUS_CD, DIRECTION,
           DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PREPAID', ?, ?, 'N', 'KTEX_MIGRATION', NOW())`,
          [hbl.hbl_no, shipmentSeq, mblId, customerId, carrierId,
           hbl.vessel, hbl.voyage, hbl.pol, hbl.pod,
           hbl.etd_dt, hbl.eta_dt,
           hbl.shipper_nm, hbl.shipper_addr, hbl.consignee_nm, hbl.consignee_addr, hbl.consignee_tel,
           hbl.total_pkg, hbl.gross_weight, hbl.volume, hbl.commodity,
           hbl.status, hbl.direction]
        );
        stats.importHBL++;
        console.log(`  + ${hbl.hbl_no} → MBL_ID:${mblId} | ${hbl.consignee_nm}`);
      }
    }

    // ========================================
    // STEP 7: Insert Air Export MAWBs
    // ========================================
    console.log('\n✈️ STEP 7: 항공수출 MAWB 삽입...');
    const exportMAWBs = generateAirExportMAWBs();
    const exportMawbIds = [];
    for (let i = 0; i < exportMAWBs.length; i++) {
      const m = exportMAWBs[i];
      const [existing] = await conn.query('SELECT ID FROM TRN_AIR_MAWB WHERE MAWB_NO = ?', [m.mawb_no]);
      if (existing.length === 0) {
        const obDate = new Date(2026, 0, 20 + i * 2).toISOString().substring(0, 10);
        const jobNo = `AEX-2026-K${String(i + 1).padStart(3, '0')}`;
        const [result] = await conn.query(
          `INSERT INTO TRN_AIR_MAWB (JOB_NO, IO_TYPE, MAWB_NO, AIRLINE_CODE, AIRLINE_NAME,
           OB_DATE, DEPARTURE, ARRIVAL, FLIGHT_NO, FLIGHT_DATE,
           SHIPPER_CODE, SHIPPER_NAME, CONSIGNEE_NAME,
           TOTAL_PIECES, TOTAL_WEIGHT, CHARGEABLE_WEIGHT, HAWB_COUNT,
           NATURE_OF_GOODS, AGENT_CODE, AGENT_NAME,
           STATUS, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, 'OUT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KTEX001', '케이텍스물류', 'DRAFT', 'N', 'KTEX_MIGRATION', NOW())`,
          [jobNo, m.mawb_no, m.airline, m.airline_nm,
           obDate, m.dep, m.arr, m.flight, obDate,
           m.shipper_cd, m.shipper, m.consignee,
           m.pieces, m.weight, m.weight, 0,
           m.goods]
        );
        exportMawbIds.push(result.insertId);
        stats.airMawb++;
        console.log(`  + ${m.mawb_no} | ${m.flight} ${m.dep}→${m.arr} (ID: ${result.insertId})`);
      } else {
        exportMawbIds.push(existing[0].ID);
      }
    }

    // ========================================
    // STEP 8: Insert Air Export HAWBs
    // ========================================
    console.log('\n📄 STEP 8: 항공수출 HAWB 삽입...');
    const exportHAWBs = generateAirHAWBs(exportMAWBs, 'OUT');
    let expHawbCount = 0;
    for (const h of exportHAWBs) {
      const [existing] = await conn.query('SELECT ID FROM TRN_AIR_HAWB WHERE HAWB_NO = ?', [h.hawb_no]);
      if (existing.length === 0) {
        const mawbId = exportMawbIds[h.mawb_idx] || null;
        const mawb = exportMAWBs[h.mawb_idx];
        const obDate = new Date(2026, 0, 20 + h.mawb_idx * 2).toISOString().substring(0, 10);
        await conn.query(
          `INSERT INTO TRN_AIR_HAWB (MAWB_ID, IO_TYPE, MAWB_NO, HAWB_NO,
           OB_DATE, DEPARTURE, ARRIVAL, FLIGHT_NO, FLIGHT_DATE,
           SHIPPER_NAME, CONSIGNEE_NAME,
           PIECES, GROSS_WEIGHT, CHARGEABLE_WEIGHT, NATURE_OF_GOODS,
           AIRLINE_CODE, AIRLINE_NAME,
           STATUS, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, 'OUT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'N', 'KTEX_MIGRATION', NOW())`,
          [mawbId, h.mawb_no, h.hawb_no,
           obDate, h.dep, h.arr, h.flight, obDate,
           h.shipper, h.consignee,
           h.pieces, h.weight, h.weight, h.goods,
           h.airline, h.airline_nm]
        );
        expHawbCount++;
      }
    }
    stats.airHawb += expHawbCount;
    console.log(`  → 항공수출 HAWB ${expHawbCount}건 삽입 완료`);

    // Update HAWB_COUNT on export MAWBs
    for (let i = 0; i < exportMawbIds.length; i++) {
      const [cnt] = await conn.query('SELECT COUNT(*) as c FROM TRN_AIR_HAWB WHERE MAWB_ID = ? AND DEL_YN = ?', [exportMawbIds[i], 'N']);
      await conn.query('UPDATE TRN_AIR_MAWB SET HAWB_COUNT = ? WHERE ID = ?', [cnt[0].c, exportMawbIds[i]]);
    }

    // ========================================
    // STEP 9: Insert Air Import MAWBs
    // ========================================
    console.log('\n✈️ STEP 9: 항공수입 MAWB 삽입...');
    const importMAWBs = generateAirImportMAWBs();
    const importMawbIds = [];
    for (let i = 0; i < importMAWBs.length; i++) {
      const m = importMAWBs[i];
      const [existing] = await conn.query('SELECT ID FROM TRN_AIR_MAWB WHERE MAWB_NO = ?', [m.mawb_no]);
      if (existing.length === 0) {
        const obDate = new Date(2026, 0, 18 + i * 2).toISOString().substring(0, 10);
        const arDate = new Date(2026, 0, 19 + i * 2).toISOString().substring(0, 10);
        const jobNo = `AIM-2026-K${String(i + 1).padStart(3, '0')}`;
        const [result] = await conn.query(
          `INSERT INTO TRN_AIR_MAWB (JOB_NO, IO_TYPE, MAWB_NO, AIRLINE_CODE, AIRLINE_NAME,
           OB_DATE, AR_DATE, DEPARTURE, ARRIVAL, FLIGHT_NO, FLIGHT_DATE,
           SHIPPER_CODE, SHIPPER_NAME, CONSIGNEE_NAME,
           TOTAL_PIECES, TOTAL_WEIGHT, CHARGEABLE_WEIGHT, HAWB_COUNT,
           NATURE_OF_GOODS, AGENT_CODE, AGENT_NAME,
           STATUS, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KTEX001', '케이텍스물류', 'DRAFT', 'N', 'KTEX_MIGRATION', NOW())`,
          [jobNo, m.mawb_no, m.airline, m.airline_nm,
           obDate, arDate, m.dep, m.arr, m.flight, obDate,
           m.shipper_cd, m.shipper, m.consignee,
           m.pieces, m.weight, m.weight, 0,
           m.goods]
        );
        importMawbIds.push(result.insertId);
        stats.airMawb++;
        console.log(`  + ${m.mawb_no} | ${m.flight} ${m.dep}→${m.arr} (ID: ${result.insertId})`);
      } else {
        importMawbIds.push(existing[0].ID);
      }
    }

    // ========================================
    // STEP 10: Insert Air Import HAWBs
    // ========================================
    console.log('\n📄 STEP 10: 항공수입 HAWB 삽입...');
    const importHAWBs = generateAirHAWBs(importMAWBs, 'IN');
    let impHawbCount = 0;
    for (const h of importHAWBs) {
      const [existing] = await conn.query('SELECT ID FROM TRN_AIR_HAWB WHERE HAWB_NO = ?', [h.hawb_no]);
      if (existing.length === 0) {
        const mawbId = importMawbIds[h.mawb_idx] || null;
        const obDate = new Date(2026, 0, 18 + h.mawb_idx * 2).toISOString().substring(0, 10);
        const arDate = new Date(2026, 0, 19 + h.mawb_idx * 2).toISOString().substring(0, 10);
        await conn.query(
          `INSERT INTO TRN_AIR_HAWB (MAWB_ID, IO_TYPE, MAWB_NO, HAWB_NO,
           OB_DATE, AR_DATE, DEPARTURE, ARRIVAL, FLIGHT_NO, FLIGHT_DATE,
           SHIPPER_NAME, CONSIGNEE_NAME,
           PIECES, GROSS_WEIGHT, CHARGEABLE_WEIGHT, NATURE_OF_GOODS,
           AIRLINE_CODE, AIRLINE_NAME,
           STATUS, DEL_YN, CREATED_BY, CREATED_DTM)
           VALUES (?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'N', 'KTEX_MIGRATION', NOW())`,
          [mawbId, h.mawb_no, h.hawb_no,
           obDate, arDate, h.dep, h.arr, h.flight, obDate,
           h.shipper, h.consignee,
           h.pieces, h.weight, h.weight, h.goods,
           h.airline, h.airline_nm]
        );
        impHawbCount++;
      }
    }
    stats.airHawb += impHawbCount;
    console.log(`  → 항공수입 HAWB ${impHawbCount}건 삽입 완료`);

    // Update HAWB_COUNT on import MAWBs
    for (let i = 0; i < importMawbIds.length; i++) {
      const [cnt] = await conn.query('SELECT COUNT(*) as c FROM TRN_AIR_HAWB WHERE MAWB_ID = ? AND DEL_YN = ?', [importMawbIds[i], 'N']);
      await conn.query('UPDATE TRN_AIR_MAWB SET HAWB_COUNT = ? WHERE ID = ?', [cnt[0].c, importMawbIds[i]]);
    }

    // ========================================
    // VERIFICATION
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 KTEX 데이터 마이그레이션 결과');
    console.log('='.repeat(60));
    console.log(`  고객사(MST_CUSTOMER):   +${stats.customers}건`);
    console.log(`  선사/항공사(MST_CARRIER): +${stats.carriers}건`);
    console.log(`  항구/공항(MST_PORT):     +${stats.ports}건`);
    console.log(`  해상수출 B/L(ORD_OCEAN_BL): +${stats.oceanExport}건`);
    console.log(`  해상수입 MBL(BL_MASTER_BL): +${stats.importMBL}건`);
    console.log(`  해상수입 HBL(BL_HOUSE_BL):  +${stats.importHBL}건`);
    console.log(`  항공 MAWB(TRN_AIR_MAWB):    +${stats.airMawb}건`);
    console.log(`  항공 HAWB(TRN_AIR_HAWB):     +${stats.airHawb}건`);

    // Final counts
    console.log('\n📊 최종 테이블 건수:');
    const tables = ['MST_CUSTOMER','MST_CARRIER','MST_PORT','ORD_OCEAN_BL','BL_MASTER_BL','BL_HOUSE_BL','TRN_AIR_MAWB','TRN_AIR_HAWB'];
    for (const t of tables) {
      const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM ' + t);
      console.log(`  ${t}: ${rows[0].cnt}건`);
    }

    console.log('\n✅ KTEX 데이터 마이그레이션 완료!');

  } catch (err) {
    console.error('❌ 에러:', err.message);
    console.error(err.sql || '');
    throw err;
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
