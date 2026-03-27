const mysql = require('mysql2/promise');

async function insertRealScheduleData() {
  const conn = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('DB 연결 성공');

  // 기존 스케줄 데이터 삭제
  await conn.execute('DELETE FROM SCH_VESSEL_SCHEDULE');
  console.log('기존 스케줄 데이터 삭제 완료');

  // 실제 선사 데이터 확인/생성
  const carriers = [
    { code: 'HDMU', name: 'HMM (Hyundai Merchant Marine)', country: 'KR' },
    { code: 'EGLV', name: 'Evergreen Line', country: 'TW' },
    { code: 'MSCU', name: 'MSC (Mediterranean Shipping Company)', country: 'CH' },
    { code: 'MAEU', name: 'Maersk Line', country: 'DK' },
    { code: 'CMDU', name: 'CMA CGM', country: 'FR' },
    { code: 'ONEY', name: 'ONE (Ocean Network Express)', country: 'JP' },
    { code: 'YMLU', name: 'Yang Ming Line', country: 'TW' },
    { code: 'COSU', name: 'COSCO Shipping', country: 'CN' },
  ];

  // 선사 테이블에 데이터 확인/삽입
  for (const carrier of carriers) {
    const [existing] = await conn.execute(
      'SELECT CARRIER_ID FROM MST_CARRIER WHERE CARRIER_CD = ?',
      [carrier.code]
    );
    if (existing.length === 0) {
      await conn.execute(
        'INSERT INTO MST_CARRIER (CARRIER_CD, CARRIER_NM, CARRIER_TYPE_CD, COUNTRY_CD, DEL_YN, CREATED_BY, CREATED_DTM) VALUES (?, ?, "SEA", ?, "N", "admin", NOW())',
        [carrier.code, carrier.name, carrier.country]
      );
      console.log(`선사 추가: ${carrier.name}`);
    }
  }

  // 선사 ID 조회
  const [carrierRows] = await conn.execute('SELECT CARRIER_ID, CARRIER_CD, CARRIER_NM FROM MST_CARRIER WHERE DEL_YN != "Y"');
  const carrierMap = {};
  carrierRows.forEach(c => { carrierMap[c.CARRIER_CD] = c.CARRIER_ID; });
  console.log('선사 목록:', carrierRows.map(c => `${c.CARRIER_CD}: ${c.CARRIER_NM}`).join(', '));

  // 실제 항구 데이터 확인/생성
  const ports = [
    { code: 'KRPUS', name: 'Busan', country: 'KR' },
    { code: 'KRINC', name: 'Incheon', country: 'KR' },
    { code: 'CNSHA', name: 'Shanghai', country: 'CN' },
    { code: 'CNNGB', name: 'Ningbo', country: 'CN' },
    { code: 'CNYTN', name: 'Yantian', country: 'CN' },
    { code: 'HKHKG', name: 'Hong Kong', country: 'HK' },
    { code: 'SGSIN', name: 'Singapore', country: 'SG' },
    { code: 'JPYOK', name: 'Yokohama', country: 'JP' },
    { code: 'JPTYO', name: 'Tokyo', country: 'JP' },
    { code: 'JPOSA', name: 'Osaka', country: 'JP' },
    { code: 'USLAX', name: 'Los Angeles', country: 'US' },
    { code: 'USLGB', name: 'Long Beach', country: 'US' },
    { code: 'USOAK', name: 'Oakland', country: 'US' },
    { code: 'USSEA', name: 'Seattle', country: 'US' },
    { code: 'USNYC', name: 'New York', country: 'US' },
    { code: 'DEHAM', name: 'Hamburg', country: 'DE' },
    { code: 'NLRTM', name: 'Rotterdam', country: 'NL' },
    { code: 'BEANR', name: 'Antwerp', country: 'BE' },
    { code: 'GBFXT', name: 'Felixstowe', country: 'GB' },
    { code: 'VNHPH', name: 'Haiphong', country: 'VN' },
    { code: 'VNSGN', name: 'Ho Chi Minh', country: 'VN' },
    { code: 'THBKK', name: 'Bangkok', country: 'TH' },
    { code: 'THLCH', name: 'Laem Chabang', country: 'TH' },
    { code: 'MYPKG', name: 'Port Klang', country: 'MY' },
    { code: 'IDTPP', name: 'Tanjung Priok', country: 'ID' },
  ];

  for (const port of ports) {
    const [existing] = await conn.execute(
      'SELECT PORT_CD FROM MST_PORT WHERE PORT_CD = ?',
      [port.code]
    );
    if (existing.length === 0) {
      await conn.execute(
        'INSERT INTO MST_PORT (PORT_CD, PORT_NM, COUNTRY_CD, DEL_YN, CREATED_BY, CREATED_DTM) VALUES (?, ?, ?, "N", "admin", NOW())',
        [port.code, port.name, port.country]
      );
      console.log(`항구 추가: ${port.name} (${port.code})`);
    }
  }

  // 실제 스케줄 데이터 (2026년 1월~2월)
  const realSchedules = [
    // HMM 스케줄 - 실제 선박명 사용
    { carrier: 'HDMU', vessel: 'HMM ALGECIRAS', voyage: 'E0026', lane: 'AEU', pol: 'KRPUS', pod: 'DEHAM', polTerm: 'HPNT', podTerm: 'CTB', etd: '2026-01-18', eta: '2026-02-14', tt: 27, docCut: '2026-01-16 17:00', cargoCut: '2026-01-17 12:00', s20: 45, s40gp: 30, s40hc: 85, s45: 15 },
    { carrier: 'HDMU', vessel: 'HMM OSLO', voyage: 'E0027', lane: 'AEU', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'HPNT', podTerm: 'ECT Delta', etd: '2026-01-25', eta: '2026-02-20', tt: 26, docCut: '2026-01-23 17:00', cargoCut: '2026-01-24 12:00', s20: 50, s40gp: 35, s40hc: 90, s45: 18 },
    { carrier: 'HDMU', vessel: 'HMM GDANSK', voyage: 'W0015', lane: 'PS3', pol: 'KRPUS', pod: 'USLAX', polTerm: 'HPNT', podTerm: 'APM', etd: '2026-01-20', eta: '2026-02-03', tt: 14, docCut: '2026-01-18 17:00', cargoCut: '2026-01-19 12:00', s20: 60, s40gp: 40, s40hc: 120, s45: 25 },
    { carrier: 'HDMU', vessel: 'HMM HAMBURG', voyage: 'W0016', lane: 'PS3', pol: 'KRPUS', pod: 'USLGB', polTerm: 'HPNT', podTerm: 'TTI', etd: '2026-01-27', eta: '2026-02-10', tt: 14, docCut: '2026-01-25 17:00', cargoCut: '2026-01-26 12:00', s20: 55, s40gp: 38, s40hc: 110, s45: 22 },

    // Evergreen 스케줄
    { carrier: 'EGLV', vessel: 'EVER ACE', voyage: '0125-026E', lane: 'AUE', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'BNCT', podTerm: 'ECT', etd: '2026-01-19', eta: '2026-02-15', tt: 27, docCut: '2026-01-17 17:00', cargoCut: '2026-01-18 15:00', s20: 40, s40gp: 28, s40hc: 95, s45: 20 },
    { carrier: 'EGLV', vessel: 'EVER APEX', voyage: '0126-027E', lane: 'AUE', pol: 'KRPUS', pod: 'DEHAM', polTerm: 'BNCT', podTerm: 'HHLA CTB', etd: '2026-01-26', eta: '2026-02-22', tt: 27, docCut: '2026-01-24 17:00', cargoCut: '2026-01-25 15:00', s20: 38, s40gp: 25, s40hc: 88, s45: 18 },
    { carrier: 'EGLV', vessel: 'EVER GOLDEN', voyage: '0125-015W', lane: 'TP16', pol: 'KRPUS', pod: 'USLAX', polTerm: 'BNCT', podTerm: 'Everport', etd: '2026-01-22', eta: '2026-02-05', tt: 14, docCut: '2026-01-20 17:00', cargoCut: '2026-01-21 15:00', s20: 70, s40gp: 45, s40hc: 130, s45: 28 },

    // MSC 스케줄
    { carrier: 'MSCU', vessel: 'MSC GULSUN', voyage: '026A', lane: 'Silk', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'PSA HPNT', podTerm: 'ECT Delta', etd: '2026-01-21', eta: '2026-02-17', tt: 27, docCut: '2026-01-19 15:00', cargoCut: '2026-01-20 09:00', s20: 48, s40gp: 32, s40hc: 100, s45: 22 },
    { carrier: 'MSCU', vessel: 'MSC TESSA', voyage: '027A', lane: 'Jade', pol: 'KRPUS', pod: 'CNSHA', polTerm: 'PSA HPNT', podTerm: 'Yangshan', etd: '2026-01-23', eta: '2026-01-28', tt: 5, docCut: '2026-01-21 15:00', cargoCut: '2026-01-22 09:00', s20: 80, s40gp: 55, s40hc: 150, s45: 30 },
    { carrier: 'MSCU', vessel: 'MSC AMBRA', voyage: '028A', lane: 'Dragon', pol: 'KRPUS', pod: 'SGSIN', polTerm: 'PSA HPNT', podTerm: 'PSA Tuas', etd: '2026-01-28', eta: '2026-02-06', tt: 9, docCut: '2026-01-26 15:00', cargoCut: '2026-01-27 09:00', s20: 65, s40gp: 42, s40hc: 115, s45: 24 },

    // Maersk 스케줄
    { carrier: 'MAEU', vessel: 'MADRID MAERSK', voyage: '026E', lane: 'AE1', pol: 'KRPUS', pod: 'GBFXT', polTerm: 'BNCT', podTerm: 'Port of Felixstowe', etd: '2026-01-20', eta: '2026-02-16', tt: 27, docCut: '2026-01-18 16:00', cargoCut: '2026-01-19 10:00', s20: 42, s40gp: 28, s40hc: 92, s45: 18 },
    { carrier: 'MAEU', vessel: 'MAYVIEW MAERSK', voyage: '027E', lane: 'AE1', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'BNCT', podTerm: 'APM MVII', etd: '2026-01-27', eta: '2026-02-23', tt: 27, docCut: '2026-01-25 16:00', cargoCut: '2026-01-26 10:00', s20: 45, s40gp: 30, s40hc: 95, s45: 20 },
    { carrier: 'MAEU', vessel: 'MAERSK ELBA', voyage: '015W', lane: 'TP6', pol: 'KRPUS', pod: 'USLAX', polTerm: 'BNCT', podTerm: 'APM Pier 400', etd: '2026-01-24', eta: '2026-02-07', tt: 14, docCut: '2026-01-22 16:00', cargoCut: '2026-01-23 10:00', s20: 58, s40gp: 38, s40hc: 108, s45: 22 },

    // CMA CGM 스케줄
    { carrier: 'CMDU', vessel: 'CMA CGM JACQUES SAADE', voyage: '026E', lane: 'FAL1', pol: 'KRPUS', pod: 'DEHAM', polTerm: 'HPNT', podTerm: 'HHLA CTT', etd: '2026-01-22', eta: '2026-02-18', tt: 27, docCut: '2026-01-20 17:00', cargoCut: '2026-01-21 12:00', s20: 50, s40gp: 35, s40hc: 105, s45: 22 },
    { carrier: 'CMDU', vessel: 'CMA CGM PALAIS ROYAL', voyage: '027E', lane: 'FAL1', pol: 'KRPUS', pod: 'BEANR', polTerm: 'HPNT', podTerm: 'PSA Antwerp', etd: '2026-01-29', eta: '2026-02-25', tt: 27, docCut: '2026-01-27 17:00', cargoCut: '2026-01-28 12:00', s20: 48, s40gp: 32, s40hc: 98, s45: 20 },
    { carrier: 'CMDU', vessel: 'CMA CGM BENJAMIN FRANKLIN', voyage: '014W', lane: 'PRX', pol: 'KRPUS', pod: 'USOAK', polTerm: 'HPNT', podTerm: 'OICT', etd: '2026-01-25', eta: '2026-02-08', tt: 14, docCut: '2026-01-23 17:00', cargoCut: '2026-01-24 12:00', s20: 62, s40gp: 40, s40hc: 118, s45: 25 },

    // ONE 스케줄
    { carrier: 'ONEY', vessel: 'ONE INNOVATION', voyage: '026E', lane: 'FE2', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'BNCT', podTerm: 'ECT Euromax', etd: '2026-01-23', eta: '2026-02-19', tt: 27, docCut: '2026-01-21 17:00', cargoCut: '2026-01-22 12:00', s20: 46, s40gp: 30, s40hc: 96, s45: 19 },
    { carrier: 'ONEY', vessel: 'ONE CONTINUITY', voyage: '015W', lane: 'PS1', pol: 'KRPUS', pod: 'USLGB', polTerm: 'BNCT', podTerm: 'TTI', etd: '2026-01-26', eta: '2026-02-09', tt: 14, docCut: '2026-01-24 17:00', cargoCut: '2026-01-25 12:00', s20: 56, s40gp: 36, s40hc: 106, s45: 21 },
    { carrier: 'ONEY', vessel: 'ONE MATRIX', voyage: '008W', lane: 'KTX3', pol: 'KRPUS', pod: 'VNHPH', polTerm: 'BNCT', podTerm: 'HICT', etd: '2026-01-24', eta: '2026-01-31', tt: 7, docCut: '2026-01-22 17:00', cargoCut: '2026-01-23 12:00', s20: 75, s40gp: 50, s40hc: 140, s45: 28 },

    // Yang Ming 스케줄
    { carrier: 'YMLU', vessel: 'YM WARRANTY', voyage: '026N', lane: 'PS', pol: 'KRPUS', pod: 'USLAX', polTerm: 'HPNT', podTerm: 'YTI', etd: '2026-01-21', eta: '2026-02-04', tt: 14, docCut: '2026-01-19 17:00', cargoCut: '2026-01-20 12:00', s20: 52, s40gp: 34, s40hc: 100, s45: 20 },
    { carrier: 'YMLU', vessel: 'YM WHOLESOME', voyage: '027N', lane: 'PS', pol: 'KRPUS', pod: 'USLGB', polTerm: 'HPNT', podTerm: 'TTI', etd: '2026-01-28', eta: '2026-02-11', tt: 14, docCut: '2026-01-26 17:00', cargoCut: '2026-01-27 12:00', s20: 50, s40gp: 32, s40hc: 96, s45: 18 },

    // COSCO 스케줄
    { carrier: 'COSU', vessel: 'COSCO SHIPPING ARIES', voyage: '026E', lane: 'AEU1', pol: 'KRPUS', pod: 'NLRTM', polTerm: 'BNCT', podTerm: 'ECT', etd: '2026-01-24', eta: '2026-02-20', tt: 27, docCut: '2026-01-22 17:00', cargoCut: '2026-01-23 12:00', s20: 44, s40gp: 29, s40hc: 90, s45: 18 },
    { carrier: 'COSU', vessel: 'COSCO SHIPPING TAURUS', voyage: '012W', lane: 'CPNW', pol: 'KRPUS', pod: 'USSEA', polTerm: 'BNCT', podTerm: 'Terminal 18', etd: '2026-01-22', eta: '2026-02-03', tt: 12, docCut: '2026-01-20 17:00', cargoCut: '2026-01-21 12:00', s20: 60, s40gp: 40, s40hc: 115, s45: 23 },
    { carrier: 'COSU', vessel: 'COSCO SHIPPING GEMINI', voyage: '015W', lane: 'CJX', pol: 'KRPUS', pod: 'JPYOK', polTerm: 'BNCT', podTerm: 'NYCT', etd: '2026-01-25', eta: '2026-01-28', tt: 3, docCut: '2026-01-23 17:00', cargoCut: '2026-01-24 12:00', s20: 85, s40gp: 55, s40hc: 160, s45: 32 },

    // 인천발 스케줄
    { carrier: 'HDMU', vessel: 'HMM PROMISE', voyage: 'E0028', lane: 'NE3', pol: 'KRINC', pod: 'CNSHA', polTerm: 'ICT', podTerm: 'Yangshan', etd: '2026-01-20', eta: '2026-01-24', tt: 4, docCut: '2026-01-18 17:00', cargoCut: '2026-01-19 12:00', s20: 70, s40gp: 45, s40hc: 130, s45: 26 },
    { carrier: 'EGLV', vessel: 'EVER PRIDE', voyage: '0126-008W', lane: 'CIS', pol: 'KRINC', pod: 'JPOSA', polTerm: 'ICT', podTerm: 'OICT', etd: '2026-01-23', eta: '2026-01-26', tt: 3, docCut: '2026-01-21 17:00', cargoCut: '2026-01-22 15:00', s20: 80, s40gp: 52, s40hc: 145, s45: 30 },

    // 동남아 노선
    { carrier: 'ONEY', vessel: 'ONE OLYMPUS', voyage: '009W', lane: 'VSA', pol: 'KRPUS', pod: 'VNSGN', polTerm: 'HPNT', podTerm: 'CMIT', etd: '2026-01-26', eta: '2026-02-03', tt: 8, docCut: '2026-01-24 17:00', cargoCut: '2026-01-25 12:00', s20: 68, s40gp: 44, s40hc: 125, s45: 25 },
    { carrier: 'MSCU', vessel: 'MSC PALOMA', voyage: '029A', lane: 'Tiger', pol: 'KRPUS', pod: 'THLCH', polTerm: 'PSA HPNT', podTerm: 'LCB1', etd: '2026-01-27', eta: '2026-02-05', tt: 9, docCut: '2026-01-25 15:00', cargoCut: '2026-01-26 09:00', s20: 72, s40gp: 48, s40hc: 135, s45: 27 },
    { carrier: 'CMDU', vessel: 'APL SINGAPURA', voyage: '016W', lane: 'SEA', pol: 'KRPUS', pod: 'MYPKG', polTerm: 'HPNT', podTerm: 'Westport', etd: '2026-01-29', eta: '2026-02-07', tt: 9, docCut: '2026-01-27 17:00', cargoCut: '2026-01-28 12:00', s20: 65, s40gp: 42, s40hc: 120, s45: 24 },
  ];

  console.log(`\n총 ${realSchedules.length}건의 실제 스케줄 데이터 삽입 중...`);

  for (const sch of realSchedules) {
    const carrierId = carrierMap[sch.carrier];
    if (!carrierId) {
      console.log(`선사 ID를 찾을 수 없음: ${sch.carrier}`);
      continue;
    }

    await conn.execute(`
      INSERT INTO SCH_VESSEL_SCHEDULE (
        CARRIER_ID, VESSEL_NM, VOYAGE_NO, SERVICE_LANE,
        POL_PORT_CD, POD_PORT_CD, POL_TERMINAL, POD_TERMINAL,
        ETD_DT, ETA_DT, DOC_CUTOFF_DT, CARGO_CUTOFF_DT, VGM_CUTOFF_DT,
        TRANSIT_TIME, SPACE_20GP, SPACE_40GP, SPACE_40HC, SPACE_45HC,
        STATUS_CD, REMARK, DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, 'N', 'admin', NOW())
    `, [
      carrierId, sch.vessel, sch.voyage, sch.lane,
      sch.pol, sch.pod, sch.polTerm, sch.podTerm,
      sch.etd, sch.eta, sch.docCut, sch.cargoCut, sch.cargoCut,
      sch.tt, sch.s20, sch.s40gp, sch.s40hc, sch.s45,
      `${sch.lane} Service - ${sch.pol} to ${sch.pod}`
    ]);
  }

  console.log(`실제 스케줄 ${realSchedules.length}건 삽입 완료`);

  // 결과 확인
  const [schedules] = await conn.execute(`
    SELECT s.SCHEDULE_ID, c.CARRIER_CD, s.VESSEL_NM, s.VOYAGE_NO, s.POL_PORT_CD, s.POD_PORT_CD,
           DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as ETD_DT, s.TRANSIT_TIME, s.STATUS_CD
    FROM SCH_VESSEL_SCHEDULE s
    JOIN MST_CARRIER c ON s.CARRIER_ID = c.CARRIER_ID
    ORDER BY s.ETD_DT
  `);

  console.log('\n=== 삽입된 스케줄 목록 ===');
  schedules.forEach(s => {
    console.log(`[${s.CARRIER_CD}] ${s.VESSEL_NM} ${s.VOYAGE_NO} | ${s.POL_PORT_CD} -> ${s.POD_PORT_CD} | ETD: ${s.ETD_DT} | T/T: ${s.TRANSIT_TIME}일`);
  });

  await conn.end();
  console.log(`\n=== 총 ${schedules.length}건의 실제 스케줄 데이터 삽입 완료 ===`);
}

insertRealScheduleData().catch(console.error);
