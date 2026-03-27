const mysql = require('mysql2/promise');

async function setupScheduleTables() {
  const conn = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('DB 연결 성공');

  // 선박 스케줄 테이블 생성
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS SCH_VESSEL_SCHEDULE (
      SCHEDULE_ID INT AUTO_INCREMENT PRIMARY KEY,
      CARRIER_ID INT NOT NULL,
      VESSEL_NM VARCHAR(100) NOT NULL,
      VOYAGE_NO VARCHAR(20) NOT NULL,
      SERVICE_LANE VARCHAR(50),
      POL_PORT_CD VARCHAR(10) NOT NULL,
      POD_PORT_CD VARCHAR(10) NOT NULL,
      POL_TERMINAL VARCHAR(100),
      POD_TERMINAL VARCHAR(100),
      ETD_DT DATE NOT NULL,
      ETA_DT DATE NOT NULL,
      ATD_DT DATE,
      ATA_DT DATE,
      DOC_CUTOFF_DT DATETIME,
      CARGO_CUTOFF_DT DATETIME,
      VGM_CUTOFF_DT DATETIME,
      TRANSIT_TIME INT,
      SPACE_20GP INT DEFAULT 0,
      SPACE_40GP INT DEFAULT 0,
      SPACE_40HC INT DEFAULT 0,
      SPACE_45HC INT DEFAULT 0,
      STATUS_CD VARCHAR(20) DEFAULT 'SCHEDULED',
      REMARK TEXT,
      DEL_YN CHAR(1) DEFAULT 'N',
      CREATED_BY VARCHAR(50),
      CREATED_DTM DATETIME DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY VARCHAR(50),
      UPDATED_DTM DATETIME,
      INDEX idx_sch_carrier (CARRIER_ID),
      INDEX idx_sch_pol (POL_PORT_CD),
      INDEX idx_sch_pod (POD_PORT_CD),
      INDEX idx_sch_etd (ETD_DT),
      INDEX idx_sch_status (STATUS_CD),
      INDEX idx_sch_vessel (VESSEL_NM, VOYAGE_NO)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('SCH_VESSEL_SCHEDULE 테이블 생성/확인 완료');

  // 기존 데이터 확인
  const [countResult] = await conn.execute('SELECT COUNT(*) as cnt FROM SCH_VESSEL_SCHEDULE');

  if (countResult[0].cnt > 0) {
    console.log(`스케줄 데이터가 이미 ${countResult[0].cnt}건 존재합니다.`);
    await conn.end();
    return;
  }

  console.log('샘플 스케줄 데이터 삽입 중...');

  // 샘플 스케줄 데이터 삽입
  const scheduleData = [
    // EVERGREEN - EVER GIVEN
    [1, 'EVER GIVEN', '001E', 'AEX1', 'KRPUS', 'USLAX', 'Busan New Port', 'APM Terminals', '2026-01-20', '2026-02-05', null, null, '2026-01-18 17:00:00', '2026-01-19 12:00:00', '2026-01-19 12:00:00', 16, 50, 30, 100, 20, 'SCHEDULED', 'Direct service'],
    [1, 'EVER GIVEN', '002E', 'AEX1', 'KRPUS', 'USLAX', 'Busan New Port', 'APM Terminals', '2026-01-27', '2026-02-12', null, null, '2026-01-25 17:00:00', '2026-01-26 12:00:00', '2026-01-26 12:00:00', 16, 45, 25, 90, 15, 'SCHEDULED', 'Direct service'],

    // MSC
    [2, 'MSC OSCAR', '025W', 'JADE', 'KRPUS', 'CNSHA', 'Busan New Port', 'Shanghai Yangshan', '2026-01-22', '2026-01-28', null, null, '2026-01-20 17:00:00', '2026-01-21 12:00:00', '2026-01-21 12:00:00', 6, 80, 50, 150, 30, 'SCHEDULED', 'Weekly service'],
    [2, 'MSC OSCAR', '026W', 'JADE', 'KRPUS', 'CNSHA', 'Busan New Port', 'Shanghai Yangshan', '2026-01-29', '2026-02-04', null, null, '2026-01-27 17:00:00', '2026-01-28 12:00:00', '2026-01-28 12:00:00', 6, 75, 45, 140, 25, 'SCHEDULED', 'Weekly service'],

    // HMM
    [3, 'HMM ALGECIRAS', '012E', 'AEU1', 'KRPUS', 'DEHAM', 'Busan New Port', 'Hamburg HHLA CTB', '2026-01-25', '2026-02-20', null, null, '2026-01-23 17:00:00', '2026-01-24 12:00:00', '2026-01-24 12:00:00', 26, 60, 40, 120, 25, 'SCHEDULED', 'Europe Express'],
    [3, 'HMM ALGECIRAS', '013E', 'AEU1', 'KRPUS', 'DEHAM', 'Busan New Port', 'Hamburg HHLA CTB', '2026-02-01', '2026-02-27', null, null, '2026-01-30 17:00:00', '2026-01-31 12:00:00', '2026-01-31 12:00:00', 26, 55, 35, 110, 20, 'SCHEDULED', 'Europe Express'],

    // MAERSK
    [1, 'MAERSK SENTOSA', '008W', 'TP9', 'KRPUS', 'SGSIN', 'Busan New Port', 'PSA Singapore', '2026-01-28', '2026-02-08', null, null, '2026-01-26 17:00:00', '2026-01-27 12:00:00', '2026-01-27 12:00:00', 11, 70, 45, 130, 25, 'SCHEDULED', 'Singapore Express'],
    [1, 'MAERSK SENTOSA', '009W', 'TP9', 'KRPUS', 'SGSIN', 'Busan New Port', 'PSA Singapore', '2026-02-04', '2026-02-15', null, null, '2026-02-02 17:00:00', '2026-02-03 12:00:00', '2026-02-03 12:00:00', 11, 65, 40, 125, 22, 'SCHEDULED', 'Singapore Express'],

    // CMA CGM
    [2, 'CMA CGM MARCO POLO', '033E', 'NJX', 'KRPUS', 'JPYOK', 'Busan New Port', 'Yokohama MC-3', '2026-02-01', '2026-02-05', null, null, '2026-01-30 17:00:00', '2026-01-31 12:00:00', '2026-01-31 12:00:00', 4, 90, 55, 160, 35, 'SCHEDULED', 'Japan Express'],
    [2, 'CMA CGM MARCO POLO', '034E', 'NJX', 'KRPUS', 'JPYOK', 'Busan New Port', 'Yokohama MC-3', '2026-02-08', '2026-02-12', null, null, '2026-02-06 17:00:00', '2026-02-07 12:00:00', '2026-02-07 12:00:00', 4, 85, 50, 155, 32, 'SCHEDULED', 'Japan Express'],

    // ONE
    [3, 'ONE STORK', '015W', 'PSW', 'KRPUS', 'VNHPH', 'Busan New Port', 'Haiphong HICT', '2026-01-23', '2026-01-30', null, null, '2026-01-21 17:00:00', '2026-01-22 12:00:00', '2026-01-22 12:00:00', 7, 55, 35, 95, 18, 'SCHEDULED', 'Vietnam Service'],
    [3, 'ONE STORK', '016W', 'PSW', 'KRPUS', 'VNHPH', 'Busan New Port', 'Haiphong HICT', '2026-01-30', '2026-02-06', null, null, '2026-01-28 17:00:00', '2026-01-29 12:00:00', '2026-01-29 12:00:00', 7, 50, 30, 90, 15, 'SCHEDULED', 'Vietnam Service'],

    // 출발한 스케줄들
    [1, 'EVER GIVEN', '000E', 'AEX1', 'KRPUS', 'USLAX', 'Busan New Port', 'APM Terminals', '2026-01-13', '2026-01-29', '2026-01-13', null, '2026-01-11 17:00:00', '2026-01-12 12:00:00', '2026-01-12 12:00:00', 16, 0, 0, 0, 0, 'DEPARTED', 'On voyage'],
    [2, 'MSC OSCAR', '024W', 'JADE', 'KRPUS', 'CNSHA', 'Busan New Port', 'Shanghai Yangshan', '2026-01-15', '2026-01-21', '2026-01-15', '2026-01-21', '2026-01-13 17:00:00', '2026-01-14 12:00:00', '2026-01-14 12:00:00', 6, 0, 0, 0, 0, 'ARRIVED', 'Arrived on time'],
  ];

  for (const sch of scheduleData) {
    await conn.execute(`
      INSERT INTO SCH_VESSEL_SCHEDULE (
        CARRIER_ID, VESSEL_NM, VOYAGE_NO, SERVICE_LANE,
        POL_PORT_CD, POD_PORT_CD, POL_TERMINAL, POD_TERMINAL,
        ETD_DT, ETA_DT, ATD_DT, ATA_DT,
        DOC_CUTOFF_DT, CARGO_CUTOFF_DT, VGM_CUTOFF_DT,
        TRANSIT_TIME, SPACE_20GP, SPACE_40GP, SPACE_40HC, SPACE_45HC,
        STATUS_CD, REMARK, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, sch);
  }

  console.log(`스케줄 ${scheduleData.length}건 생성 완료`);

  // 결과 확인
  const [schedules] = await conn.execute(`
    SELECT s.SCHEDULE_ID, s.VESSEL_NM, s.VOYAGE_NO, s.POL_PORT_CD, s.POD_PORT_CD,
           DATE_FORMAT(s.ETD_DT, '%Y-%m-%d') as ETD_DT, s.STATUS_CD
    FROM SCH_VESSEL_SCHEDULE s
    ORDER BY s.ETD_DT
    LIMIT 10
  `);

  console.log('\n생성된 스케줄 목록:');
  schedules.forEach(s => {
    console.log(`  ${s.VESSEL_NM} ${s.VOYAGE_NO} | ${s.POL_PORT_CD} -> ${s.POD_PORT_CD} | ETD: ${s.ETD_DT} | ${s.STATUS_CD}`);
  });

  await conn.end();
  console.log('\n=== 스케줄 테이블 설정 완료 ===');
}

setupScheduleTables().catch(console.error);
