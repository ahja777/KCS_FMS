const mysql = require('mysql2/promise');

async function insertSeaTestData() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic'
  });

  console.log('='.repeat(70));
  console.log('해상 수입/수출 테스트 데이터 입력');
  console.log('='.repeat(70));

  try {
    // =====================================================
    // 해상 수입 데이터 (CASE 1~4)
    // =====================================================
    console.log('\n[해상수입 데이터 입력]');
    console.log('-'.repeat(50));

    // CASE 1: SIMPLE (해상수입)
    const importCase1MBL = {
      MBL_NO: 'SMLMVAN2A0923400',
      CARRIER_ID: 1,
      VESSEL_NM: 'KOTA LUKIS',
      VOYAGE_NO: '2202W',
      POL_PORT_CD: 'CAVAN',
      POD_PORT_CD: 'KRBNP',
      PLACE_OF_RECEIPT: 'VANCOUVER, CANADA',
      PLACE_OF_DELIVERY: 'BUSAN NEW PORT, KOREA',
      FINAL_DEST: 'BUSAN NEW PORT',
      ETA_DT: '2022-07-31',
      SHIPPER_NM: 'CANADA SHIPPER CO.',
      CONSIGNEE_NM: 'KOREA IMPORTER INC.',
      NOTIFY_PARTY: 'SAME AS CONSIGNEE',
      TOTAL_PKG_QTY: 600,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 15000.000,
      VOLUME_CBM: 60.0000,
      COMMODITY_DESC: 'GENERAL CARGO',
      CNTR_COUNT: 6,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'SIMPLE',
      STATUS_CD: 'ARRIVED'
    };

    let result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETA_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      importCase1MBL.MBL_NO, importCase1MBL.CARRIER_ID, importCase1MBL.VESSEL_NM,
      importCase1MBL.VOYAGE_NO, importCase1MBL.POL_PORT_CD, importCase1MBL.POD_PORT_CD,
      importCase1MBL.PLACE_OF_RECEIPT, importCase1MBL.PLACE_OF_DELIVERY, importCase1MBL.FINAL_DEST,
      importCase1MBL.ETA_DT, importCase1MBL.SHIPPER_NM, importCase1MBL.CONSIGNEE_NM,
      importCase1MBL.NOTIFY_PARTY, importCase1MBL.TOTAL_PKG_QTY, importCase1MBL.PKG_TYPE_CD,
      importCase1MBL.GROSS_WEIGHT_KG, importCase1MBL.VOLUME_CBM, importCase1MBL.COMMODITY_DESC,
      importCase1MBL.CNTR_COUNT, importCase1MBL.FREIGHT_TERM_CD, importCase1MBL.BL_TYPE_CD,
      importCase1MBL.STATUS_CD
    ]);
    const case1MblId = result[0].insertId;
    console.log(`  CASE1 MBL 입력 완료: ${importCase1MBL.MBL_NO} (ID: ${case1MblId})`);

    // CASE1 컨테이너 입력
    const case1Containers = [
      { CNTR_NO: 'FCIU2624665', CNTR_TYPE_CD: '22GP', SEAL_NO: '103804' },
      { CNTR_NO: 'SDCU2368442', CNTR_TYPE_CD: '22GP', SEAL_NO: '103819' },
      { CNTR_NO: 'SMCU2003150', CNTR_TYPE_CD: '22GP', SEAL_NO: '103801' },
      { CNTR_NO: 'SMCU2019114', CNTR_TYPE_CD: '22GP', SEAL_NO: '103805' },
      { CNTR_NO: 'SMCU2030495', CNTR_TYPE_CD: '22GP', SEAL_NO: '103802' },
      { CNTR_NO: 'SMCU2035352', CNTR_TYPE_CD: '22GP', SEAL_NO: '103813' }
    ];

    for (const cntr of case1Containers) {
      await connection.query(`
        INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
        VALUES (?, ?, ?, ?, 'ACTIVE', 'N', 'test', NOW())
      `, [cntr.CNTR_NO, case1MblId, cntr.CNTR_TYPE_CD, cntr.SEAL_NO]);
    }
    console.log(`  CASE1 컨테이너 ${case1Containers.length}건 입력 완료`);

    // CASE 2: CONSOL FCL (해상수입)
    const importCase2MBL = {
      MBL_NO: 'HDMUCGPA64044900',
      CARRIER_ID: 2,
      VESSEL_NM: 'HYUNDAI HONGKONG',
      VOYAGE_NO: '0136E',
      POL_PORT_CD: 'BDCGP',
      POD_PORT_CD: 'KRBNP',
      PLACE_OF_RECEIPT: 'CHITTAGONG, BANGLADESH',
      PLACE_OF_DELIVERY: 'BUSAN NEW PORT, KOREA',
      FINAL_DEST: 'BUSAN',
      ETA_DT: '2022-07-14',
      SHIPPER_NM: 'BANGLADESH EXPORT CO.',
      CONSIGNEE_NM: 'KOREA TRADING CO.',
      NOTIFY_PARTY: 'MAXP LOGISTICS',
      TOTAL_PKG_QTY: 200,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 8000.000,
      VOLUME_CBM: 40.0000,
      COMMODITY_DESC: 'TEXTILE PRODUCTS',
      CNTR_COUNT: 1,
      FREIGHT_TERM_CD: 'COLLECT',
      BL_TYPE_CD: 'CONSOL',
      STATUS_CD: 'ARRIVED'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETA_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      importCase2MBL.MBL_NO, importCase2MBL.CARRIER_ID, importCase2MBL.VESSEL_NM,
      importCase2MBL.VOYAGE_NO, importCase2MBL.POL_PORT_CD, importCase2MBL.POD_PORT_CD,
      importCase2MBL.PLACE_OF_RECEIPT, importCase2MBL.PLACE_OF_DELIVERY, importCase2MBL.FINAL_DEST,
      importCase2MBL.ETA_DT, importCase2MBL.SHIPPER_NM, importCase2MBL.CONSIGNEE_NM,
      importCase2MBL.NOTIFY_PARTY, importCase2MBL.TOTAL_PKG_QTY, importCase2MBL.PKG_TYPE_CD,
      importCase2MBL.GROSS_WEIGHT_KG, importCase2MBL.VOLUME_CBM, importCase2MBL.COMMODITY_DESC,
      importCase2MBL.CNTR_COUNT, importCase2MBL.FREIGHT_TERM_CD, importCase2MBL.BL_TYPE_CD,
      importCase2MBL.STATUS_CD
    ]);
    const case2MblId = result[0].insertId;
    console.log(`  CASE2 MBL 입력 완료: ${importCase2MBL.MBL_NO} (ID: ${case2MblId})`);

    // CASE2 컨테이너
    await connection.query(`
      INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, CNTR_SIZE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
      VALUES ('DFSU6199824', ?, '45GP', '40', '210321726', 'ACTIVE', 'N', 'test', NOW())
    `, [case2MblId]);
    console.log(`  CASE2 컨테이너 입력 완료`);

    // CASE 3: CONSOL LCL (해상수입)
    const importCase3MBL = {
      MBL_NO: 'HASLS11220700423',
      CARRIER_ID: 3,
      VESSEL_NM: 'HYUNDAI SUPREME',
      VOYAGE_NO: '0124N',
      POL_PORT_CD: 'IDJKT',
      POD_PORT_CD: 'KRBNP',
      PLACE_OF_RECEIPT: 'JAKARTA, INDONESIA',
      PLACE_OF_DELIVERY: 'BUSAN NEW PORT, KOREA',
      FINAL_DEST: 'BUSAN',
      ETA_DT: '2022-08-02',
      SHIPPER_NM: 'INDONESIA EXPORTER',
      CONSIGNEE_NM: 'KOREA CONSOL AGENT',
      NOTIFY_PARTY: 'MAXP LOGISTICS',
      TOTAL_PKG_QTY: 150,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 5000.000,
      VOLUME_CBM: 25.0000,
      COMMODITY_DESC: 'CONSUMER GOODS',
      CNTR_COUNT: 1,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'CONSOL',
      STATUS_CD: 'ARRIVED'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETA_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      importCase3MBL.MBL_NO, importCase3MBL.CARRIER_ID, importCase3MBL.VESSEL_NM,
      importCase3MBL.VOYAGE_NO, importCase3MBL.POL_PORT_CD, importCase3MBL.POD_PORT_CD,
      importCase3MBL.PLACE_OF_RECEIPT, importCase3MBL.PLACE_OF_DELIVERY, importCase3MBL.FINAL_DEST,
      importCase3MBL.ETA_DT, importCase3MBL.SHIPPER_NM, importCase3MBL.CONSIGNEE_NM,
      importCase3MBL.NOTIFY_PARTY, importCase3MBL.TOTAL_PKG_QTY, importCase3MBL.PKG_TYPE_CD,
      importCase3MBL.GROSS_WEIGHT_KG, importCase3MBL.VOLUME_CBM, importCase3MBL.COMMODITY_DESC,
      importCase3MBL.CNTR_COUNT, importCase3MBL.FREIGHT_TERM_CD, importCase3MBL.BL_TYPE_CD,
      importCase3MBL.STATUS_CD
    ]);
    const case3MblId = result[0].insertId;
    console.log(`  CASE3 MBL 입력 완료: ${importCase3MBL.MBL_NO} (ID: ${case3MblId})`);

    // CASE3 HBL 입력
    const case3HBLs = [
      { HBL_NO: 'COIN22000627', SHIPPER_NM: 'INDONESIA SUPPLIER A', CONSIGNEE_NM: 'CJ KOREA EXPRESS' },
      { HBL_NO: 'CM122JKTDLC1573', SHIPPER_NM: 'INDONESIA SUPPLIER B', CONSIGNEE_NM: 'CJ KOREA EXPRESS' },
      { HBL_NO: 'CM122JKTBUN1575', SHIPPER_NM: 'INDONESIA SUPPLIER C', CONSIGNEE_NM: 'CJ KOREA EXPRESS' }
    ];

    for (const hbl of case3HBLs) {
      await connection.query(`
        INSERT INTO BL_HOUSE_BL (
          HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
          VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
          PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST,
          ETA_DT, SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
          TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
          COMMODITY_DESC, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
          DEL_YN, CREATED_BY, CREATED_DTM
        ) VALUES (?, 1, ?, 1, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SAME AS CONSIGNEE',
          50, 'CARTON', 1500, 8, 'CONSUMER GOODS', 'PREPAID', 'LCL', 'ARRIVED', 'N', 'test', NOW())
      `, [
        hbl.HBL_NO, case3MblId, importCase3MBL.VESSEL_NM, importCase3MBL.VOYAGE_NO,
        importCase3MBL.POL_PORT_CD, importCase3MBL.POD_PORT_CD,
        importCase3MBL.PLACE_OF_RECEIPT, importCase3MBL.PLACE_OF_DELIVERY, importCase3MBL.FINAL_DEST,
        importCase3MBL.ETA_DT, hbl.SHIPPER_NM, hbl.CONSIGNEE_NM
      ]);
    }
    console.log(`  CASE3 HBL ${case3HBLs.length}건 입력 완료`);

    // CASE3 컨테이너
    await connection.query(`
      INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
      VALUES ('SKLU0748458', ?, '22GP', 'HAS1340793', 'ACTIVE', 'N', 'test', NOW())
    `, [case3MblId]);
    console.log(`  CASE3 컨테이너 입력 완료`);

    // CASE 4: CONSOL LCL 환적 (해상수입)
    const importCase4MBL = {
      MBL_NO: 'ONEYRICCEE635400',
      CARRIER_ID: 4,
      VESSEL_NM: 'YM UPWARD',
      VOYAGE_NO: '076W',
      POL_PORT_CD: 'USTIW',
      POD_PORT_CD: 'KRBNP',
      PLACE_OF_RECEIPT: 'TACOMA, USA',
      PLACE_OF_DELIVERY: 'BUSAN NEW PORT, KOREA',
      FINAL_DEST: 'BUSAN',
      ETA_DT: '2022-08-02',
      SHIPPER_NM: 'US EXPORTER LLC',
      CONSIGNEE_NM: 'KOREA TRADING',
      NOTIFY_PARTY: 'MAXP LOGISTICS',
      TOTAL_PKG_QTY: 500,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 12000.000,
      VOLUME_CBM: 55.0000,
      COMMODITY_DESC: 'MIXED CARGO (T/S)',
      CNTR_COUNT: 1,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'CONSOL',
      STATUS_CD: 'IN_TRANSIT'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETA_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      importCase4MBL.MBL_NO, importCase4MBL.CARRIER_ID, importCase4MBL.VESSEL_NM,
      importCase4MBL.VOYAGE_NO, importCase4MBL.POL_PORT_CD, importCase4MBL.POD_PORT_CD,
      importCase4MBL.PLACE_OF_RECEIPT, importCase4MBL.PLACE_OF_DELIVERY, importCase4MBL.FINAL_DEST,
      importCase4MBL.ETA_DT, importCase4MBL.SHIPPER_NM, importCase4MBL.CONSIGNEE_NM,
      importCase4MBL.NOTIFY_PARTY, importCase4MBL.TOTAL_PKG_QTY, importCase4MBL.PKG_TYPE_CD,
      importCase4MBL.GROSS_WEIGHT_KG, importCase4MBL.VOLUME_CBM, importCase4MBL.COMMODITY_DESC,
      importCase4MBL.CNTR_COUNT, importCase4MBL.FREIGHT_TERM_CD, importCase4MBL.BL_TYPE_CD,
      importCase4MBL.STATUS_CD
    ]);
    const case4MblId = result[0].insertId;
    console.log(`  CASE4 MBL 입력 완료: ${importCase4MBL.MBL_NO} (ID: ${case4MblId})`);

    // CASE4 HBL 일부 입력
    const case4HBLs = ['LAXBUSC25032', 'AWE8626140', '340340681446', '340340681450'];
    for (const hblNo of case4HBLs) {
      await connection.query(`
        INSERT INTO BL_HOUSE_BL (
          HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
          VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
          SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
          TOTAL_PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM,
          COMMODITY_DESC, BL_TYPE_CD, STATUS_CD,
          DEL_YN, CREATED_BY, CREATED_DTM
        ) VALUES (?, 1, ?, 1, 4, ?, ?, ?, ?, 'US SHIPPER', 'KOREA BUYER', 'SAME AS CONSIGNEE',
          100, 2500, 12, 'MIXED CARGO', 'LCL', 'IN_TRANSIT', 'N', 'test', NOW())
      `, [hblNo, case4MblId, importCase4MBL.VESSEL_NM, importCase4MBL.VOYAGE_NO,
          importCase4MBL.POL_PORT_CD, importCase4MBL.POD_PORT_CD]);
    }
    console.log(`  CASE4 HBL ${case4HBLs.length}건 입력 완료`);

    // CASE4 컨테이너
    await connection.query(`
      INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, CNTR_SIZE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
      VALUES ('TCLU6333985', ?, '45GP', '40', '304866', 'ACTIVE', 'N', 'test', NOW())
    `, [case4MblId]);
    console.log(`  CASE4 컨테이너 입력 완료`);

    // =====================================================
    // 해상 수출 데이터 (CASE 1~4)
    // =====================================================
    console.log('\n[해상수출 데이터 입력]');
    console.log('-'.repeat(50));

    // CASE 1: SIMPLE (해상수출)
    const exportCase1MBL = {
      MBL_NO: 'SMLMSEL2J1252700',
      CARRIER_ID: 1,
      VESSEL_NM: 'SM TOKYO',
      VOYAGE_NO: '2213W',
      POL_PORT_CD: 'KRPUS',
      POD_PORT_CD: 'VNHPH',
      PLACE_OF_RECEIPT: 'BUSAN, KOREA',
      PLACE_OF_DELIVERY: 'HAIPHONG, VIETNAM',
      FINAL_DEST: 'HAIPHONG',
      ETD_DT: '2022-08-03',
      SHIPPER_NM: 'KOREA EXPORTER CO.',
      CONSIGNEE_NM: 'VIETNAM IMPORTER',
      NOTIFY_PARTY: 'SAME AS CONSIGNEE',
      TOTAL_PKG_QTY: 200,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 6000.000,
      VOLUME_CBM: 30.0000,
      COMMODITY_DESC: 'ELECTRONICS',
      CNTR_COUNT: 2,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'SIMPLE',
      STATUS_CD: 'DEPARTED'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETD_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      exportCase1MBL.MBL_NO, exportCase1MBL.CARRIER_ID, exportCase1MBL.VESSEL_NM,
      exportCase1MBL.VOYAGE_NO, exportCase1MBL.POL_PORT_CD, exportCase1MBL.POD_PORT_CD,
      exportCase1MBL.PLACE_OF_RECEIPT, exportCase1MBL.PLACE_OF_DELIVERY, exportCase1MBL.FINAL_DEST,
      exportCase1MBL.ETD_DT, exportCase1MBL.SHIPPER_NM, exportCase1MBL.CONSIGNEE_NM,
      exportCase1MBL.NOTIFY_PARTY, exportCase1MBL.TOTAL_PKG_QTY, exportCase1MBL.PKG_TYPE_CD,
      exportCase1MBL.GROSS_WEIGHT_KG, exportCase1MBL.VOLUME_CBM, exportCase1MBL.COMMODITY_DESC,
      exportCase1MBL.CNTR_COUNT, exportCase1MBL.FREIGHT_TERM_CD, exportCase1MBL.BL_TYPE_CD,
      exportCase1MBL.STATUS_CD
    ]);
    const expCase1MblId = result[0].insertId;
    console.log(`  CASE1 MBL 입력 완료: ${exportCase1MBL.MBL_NO} (ID: ${expCase1MblId})`);

    // 수출 CASE1 컨테이너
    const expCase1Containers = [
      { CNTR_NO: 'BMOU2745329', CNTR_TYPE_CD: '22GP', SEAL_NO: 'SM503583' },
      { CNTR_NO: 'CAIU6601490', CNTR_TYPE_CD: '22GP', SEAL_NO: 'SM516803' }
    ];
    for (const cntr of expCase1Containers) {
      await connection.query(`
        INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
        VALUES (?, ?, ?, ?, 'ACTIVE', 'N', 'test', NOW())
      `, [cntr.CNTR_NO, expCase1MblId, cntr.CNTR_TYPE_CD, cntr.SEAL_NO]);
    }
    console.log(`  CASE1 컨테이너 ${expCase1Containers.length}건 입력 완료`);

    // HBL (SIMPLE이므로 MBL과 동일)
    await connection.query(`
      INSERT INTO BL_HOUSE_BL (
        HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
        VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETD_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES ('SEL2J1252700', 1, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SAME AS CONSIGNEE',
        200, 'CARTON', 6000, 30, 'ELECTRONICS', 'PREPAID', 'SIMPLE', 'DEPARTED', 'N', 'test', NOW())
    `, [expCase1MblId, exportCase1MBL.VESSEL_NM, exportCase1MBL.VOYAGE_NO,
        exportCase1MBL.POL_PORT_CD, exportCase1MBL.POD_PORT_CD,
        exportCase1MBL.PLACE_OF_RECEIPT, exportCase1MBL.PLACE_OF_DELIVERY, exportCase1MBL.FINAL_DEST,
        exportCase1MBL.ETD_DT, exportCase1MBL.SHIPPER_NM, exportCase1MBL.CONSIGNEE_NM]);
    console.log(`  CASE1 HBL 입력 완료`);

    // CASE 2: CONSOL FCL (해상수출)
    const exportCase2MBL = {
      MBL_NO: 'ONEYSELCA1341900',
      CARRIER_ID: 4,
      VESSEL_NM: 'CONCERTO',
      VOYAGE_NO: '0023S',
      POL_PORT_CD: 'KRPUS',
      POD_PORT_CD: 'VNHPH',
      PLACE_OF_RECEIPT: 'BUSAN, KOREA',
      PLACE_OF_DELIVERY: 'HAIPHONG, VIETNAM',
      FINAL_DEST: 'HAIPHONG',
      ETD_DT: '2022-08-08',
      SHIPPER_NM: 'ANBG LOGISTICS',
      CONSIGNEE_NM: 'VIETNAM TRADING CO.',
      NOTIFY_PARTY: 'SAME AS CONSIGNEE',
      TOTAL_PKG_QTY: 600,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 18000.000,
      VOLUME_CBM: 80.0000,
      COMMODITY_DESC: 'INDUSTRIAL GOODS',
      CNTR_COUNT: 3,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'CONSOL',
      STATUS_CD: 'DEPARTED'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETD_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      exportCase2MBL.MBL_NO, exportCase2MBL.CARRIER_ID, exportCase2MBL.VESSEL_NM,
      exportCase2MBL.VOYAGE_NO, exportCase2MBL.POL_PORT_CD, exportCase2MBL.POD_PORT_CD,
      exportCase2MBL.PLACE_OF_RECEIPT, exportCase2MBL.PLACE_OF_DELIVERY, exportCase2MBL.FINAL_DEST,
      exportCase2MBL.ETD_DT, exportCase2MBL.SHIPPER_NM, exportCase2MBL.CONSIGNEE_NM,
      exportCase2MBL.NOTIFY_PARTY, exportCase2MBL.TOTAL_PKG_QTY, exportCase2MBL.PKG_TYPE_CD,
      exportCase2MBL.GROSS_WEIGHT_KG, exportCase2MBL.VOLUME_CBM, exportCase2MBL.COMMODITY_DESC,
      exportCase2MBL.CNTR_COUNT, exportCase2MBL.FREIGHT_TERM_CD, exportCase2MBL.BL_TYPE_CD,
      exportCase2MBL.STATUS_CD
    ]);
    const expCase2MblId = result[0].insertId;
    console.log(`  CASE2 MBL 입력 완료: ${exportCase2MBL.MBL_NO} (ID: ${expCase2MblId})`);

    // 수출 CASE2 컨테이너
    const expCase2Containers = [
      { CNTR_NO: 'TCKU3371860', CNTR_TYPE_CD: '22GP', SEAL_NO: 'KRAM07745' },
      { CNTR_NO: 'TCLU3425516', CNTR_TYPE_CD: '22GP', SEAL_NO: 'KRAM02375' },
      { CNTR_NO: 'TGBU3251999', CNTR_TYPE_CD: '22GP', SEAL_NO: 'KRAM02320' }
    ];
    for (const cntr of expCase2Containers) {
      await connection.query(`
        INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
        VALUES (?, ?, ?, ?, 'ACTIVE', 'N', 'test', NOW())
      `, [cntr.CNTR_NO, expCase2MblId, cntr.CNTR_TYPE_CD, cntr.SEAL_NO]);
    }
    console.log(`  CASE2 컨테이너 ${expCase2Containers.length}건 입력 완료`);

    // HBL
    await connection.query(`
      INSERT INTO BL_HOUSE_BL (
        HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
        VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        SHIPPER_NM, CONSIGNEE_NM,
        TOTAL_PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES ('ANBHPH22080051', 1, ?, 1, 4, ?, ?, ?, ?,
        'KOREA MANUFACTURER', 'VIETNAM DISTRIBUTOR',
        600, 18000, 80, 'INDUSTRIAL GOODS', 'FCL', 'DEPARTED', 'N', 'test', NOW())
    `, [expCase2MblId, exportCase2MBL.VESSEL_NM, exportCase2MBL.VOYAGE_NO,
        exportCase2MBL.POL_PORT_CD, exportCase2MBL.POD_PORT_CD]);
    console.log(`  CASE2 HBL 입력 완료`);

    // CASE 3: CONSOL LCL (해상수출)
    const exportCase3MBL = {
      MBL_NO: 'ONEYSELCA3460600',
      CARRIER_ID: 4,
      VESSEL_NM: 'LUDWIGSHAFEN EXPR',
      VOYAGE_NO: '039W',
      POL_PORT_CD: 'KRPUS',
      POD_PORT_CD: 'TRIST',
      PLACE_OF_RECEIPT: 'BUSAN, KOREA',
      PLACE_OF_DELIVERY: 'ISTANBUL, TURKEY',
      FINAL_DEST: 'ISTANBUL',
      ETD_DT: '2022-08-06',
      SHIPPER_NM: 'MAXP LOGISTICS',
      CONSIGNEE_NM: 'TURKEY IMPORTER',
      NOTIFY_PARTY: 'SAME AS CONSIGNEE',
      TOTAL_PKG_QTY: 400,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 10000.000,
      VOLUME_CBM: 45.0000,
      COMMODITY_DESC: 'MIXED CARGO',
      CNTR_COUNT: 1,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'CONSOL',
      STATUS_CD: 'IN_TRANSIT'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETD_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      exportCase3MBL.MBL_NO, exportCase3MBL.CARRIER_ID, exportCase3MBL.VESSEL_NM,
      exportCase3MBL.VOYAGE_NO, exportCase3MBL.POL_PORT_CD, exportCase3MBL.POD_PORT_CD,
      exportCase3MBL.PLACE_OF_RECEIPT, exportCase3MBL.PLACE_OF_DELIVERY, exportCase3MBL.FINAL_DEST,
      exportCase3MBL.ETD_DT, exportCase3MBL.SHIPPER_NM, exportCase3MBL.CONSIGNEE_NM,
      exportCase3MBL.NOTIFY_PARTY, exportCase3MBL.TOTAL_PKG_QTY, exportCase3MBL.PKG_TYPE_CD,
      exportCase3MBL.GROSS_WEIGHT_KG, exportCase3MBL.VOLUME_CBM, exportCase3MBL.COMMODITY_DESC,
      exportCase3MBL.CNTR_COUNT, exportCase3MBL.FREIGHT_TERM_CD, exportCase3MBL.BL_TYPE_CD,
      exportCase3MBL.STATUS_CD
    ]);
    const expCase3MblId = result[0].insertId;
    console.log(`  CASE3 MBL 입력 완료: ${exportCase3MBL.MBL_NO} (ID: ${expCase3MblId})`);

    // 수출 CASE3 HBL
    const expCase3HBLs = ['2208MT00301', '2208MT00302', '2208MT00303', '2208MT00304', '2208MT00305', '2208MT00306'];
    for (const hblNo of expCase3HBLs) {
      await connection.query(`
        INSERT INTO BL_HOUSE_BL (
          HBL_NO, SHIPMENT_ID, MBL_ID, CUSTOMER_ID, CARRIER_ID,
          VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
          SHIPPER_NM, CONSIGNEE_NM,
          TOTAL_PKG_QTY, GROSS_WEIGHT_KG, VOLUME_CBM,
          COMMODITY_DESC, BL_TYPE_CD, STATUS_CD,
          DEL_YN, CREATED_BY, CREATED_DTM
        ) VALUES (?, 1, ?, 1, 4, ?, ?, ?, ?,
          'KOREA SHIPPER', 'TURKEY BUYER',
          60, 1500, 7, 'MIXED CARGO', 'LCL', 'IN_TRANSIT', 'N', 'test', NOW())
      `, [hblNo, expCase3MblId, exportCase3MBL.VESSEL_NM, exportCase3MBL.VOYAGE_NO,
          exportCase3MBL.POL_PORT_CD, exportCase3MBL.POD_PORT_CD]);
    }
    console.log(`  CASE3 HBL ${expCase3HBLs.length}건 입력 완료`);

    // 수출 CASE3 컨테이너
    await connection.query(`
      INSERT INTO BL_CONTAINER (CNTR_NO, MBL_ID, CNTR_TYPE_CD, CNTR_SIZE_CD, SEAL_NO, STATUS_CD, DEL_YN, CREATED_BY, CREATED_DTM)
      VALUES ('NYKU0830100', ?, '45GP', '40', 'KRAK31719', 'ACTIVE', 'N', 'test', NOW())
    `, [expCase3MblId]);
    console.log(`  CASE3 컨테이너 입력 완료`);

    // CASE 4: SIMPLE 환적 (해상수출)
    const exportCase4MBL = {
      MBL_NO: 'ONEYPUSC06215501',
      CARRIER_ID: 4,
      VESSEL_NM: 'EVER GIVEN',
      VOYAGE_NO: '055E',
      POL_PORT_CD: 'KRPUS',
      POD_PORT_CD: 'TWKHH',
      PLACE_OF_RECEIPT: 'BUSAN, KOREA',
      PLACE_OF_DELIVERY: 'KAOHSIUNG, TAIWAN',
      FINAL_DEST: 'USA',
      ETD_DT: '2022-08-10',
      SHIPPER_NM: 'KOREA EXPORT',
      CONSIGNEE_NM: 'TAIWAN AGENT',
      NOTIFY_PARTY: 'US FINAL BUYER',
      TOTAL_PKG_QTY: 300,
      PKG_TYPE_CD: 'CARTON',
      GROSS_WEIGHT_KG: 9000.000,
      VOLUME_CBM: 40.0000,
      COMMODITY_DESC: 'TRANSSHIPMENT CARGO',
      CNTR_COUNT: 2,
      FREIGHT_TERM_CD: 'PREPAID',
      BL_TYPE_CD: 'SIMPLE',
      STATUS_CD: 'BOOKED'
    };

    result = await connection.query(`
      INSERT INTO BL_MASTER_BL (
        MBL_NO, CARRIER_ID, VESSEL_NM, VOYAGE_NO, POL_PORT_CD, POD_PORT_CD,
        PLACE_OF_RECEIPT, PLACE_OF_DELIVERY, FINAL_DEST, ETD_DT,
        SHIPPER_NM, CONSIGNEE_NM, NOTIFY_PARTY,
        TOTAL_PKG_QTY, PKG_TYPE_CD, GROSS_WEIGHT_KG, VOLUME_CBM,
        COMMODITY_DESC, CNTR_COUNT, FREIGHT_TERM_CD, BL_TYPE_CD, STATUS_CD,
        DEL_YN, CREATED_BY, CREATED_DTM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N', 'test', NOW())
    `, [
      exportCase4MBL.MBL_NO, exportCase4MBL.CARRIER_ID, exportCase4MBL.VESSEL_NM,
      exportCase4MBL.VOYAGE_NO, exportCase4MBL.POL_PORT_CD, exportCase4MBL.POD_PORT_CD,
      exportCase4MBL.PLACE_OF_RECEIPT, exportCase4MBL.PLACE_OF_DELIVERY, exportCase4MBL.FINAL_DEST,
      exportCase4MBL.ETD_DT, exportCase4MBL.SHIPPER_NM, exportCase4MBL.CONSIGNEE_NM,
      exportCase4MBL.NOTIFY_PARTY, exportCase4MBL.TOTAL_PKG_QTY, exportCase4MBL.PKG_TYPE_CD,
      exportCase4MBL.GROSS_WEIGHT_KG, exportCase4MBL.VOLUME_CBM, exportCase4MBL.COMMODITY_DESC,
      exportCase4MBL.CNTR_COUNT, exportCase4MBL.FREIGHT_TERM_CD, exportCase4MBL.BL_TYPE_CD,
      exportCase4MBL.STATUS_CD
    ]);
    const expCase4MblId = result[0].insertId;
    console.log(`  CASE4 MBL 입력 완료: ${exportCase4MBL.MBL_NO} (ID: ${expCase4MblId})`);

    console.log('\n' + '='.repeat(70));
    console.log('해상 수입/수출 테스트 데이터 입력 완료!');
    console.log('='.repeat(70));

    // 최종 현황 출력
    console.log('\n[최종 데이터 현황]');
    const [mblCount] = await connection.query('SELECT COUNT(*) as cnt FROM BL_MASTER_BL WHERE DEL_YN = "N"');
    const [hblCount] = await connection.query('SELECT COUNT(*) as cnt FROM BL_HOUSE_BL WHERE DEL_YN = "N"');
    const [cntrCount] = await connection.query('SELECT COUNT(*) as cnt FROM BL_CONTAINER WHERE DEL_YN = "N"');

    console.log(`  - Master BL: ${mblCount[0].cnt}건`);
    console.log(`  - House BL: ${hblCount[0].cnt}건`);
    console.log(`  - Container: ${cntrCount[0].cnt}건`);

  } catch (error) {
    console.error('데이터 입력 오류:', error);
  } finally {
    await connection.end();
  }
}

insertSeaTestData();
