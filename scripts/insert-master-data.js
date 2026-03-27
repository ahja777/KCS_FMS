const mysql = require('mysql2/promise');

async function insertMasterData() {
  const connection = await mysql.createConnection({
    host: '211.236.174.220',
    port: 53306,
    user: 'user',
    password: 'P@ssw0rd',
    database: 'logstic',
    multipleStatements: true
  });

  try {
    console.log('Connected to database');

    // 먼저 테이블 구조 확인
    console.log('\n=== Checking table structures ===');
    const [codeGroupCols] = await connection.query("SHOW COLUMNS FROM MST_COMMON_CODE_GROUP");
    console.log('MST_COMMON_CODE_GROUP columns:', codeGroupCols.map(c => c.Field).join(', '));

    const [codeCols] = await connection.query("SHOW COLUMNS FROM MST_COMMON_CODE");
    console.log('MST_COMMON_CODE columns:', codeCols.map(c => c.Field).join(', '));

    const [brokerCols] = await connection.query("SHOW COLUMNS FROM MST_CUSTOMS_BROKER");
    console.log('MST_CUSTOMS_BROKER columns:', brokerCols.map(c => c.Field).join(', '));

    const [declCols] = await connection.query("SHOW COLUMNS FROM CUS_DECLARATION");
    console.log('CUS_DECLARATION columns:', declCols.map(c => c.Field).join(', '));

    const [amsCols] = await connection.query("SHOW COLUMNS FROM CUS_AMS_MANIFEST");
    console.log('CUS_AMS_MANIFEST columns:', amsCols.map(c => c.Field).join(', '));

    // 동적으로 INSERT문 생성
    console.log('\n=== Inserting data ===');

    // 1. 코드 그룹 삽입
    const codeGroupFields = codeGroupCols.map(c => c.Field);
    console.log('Inserting code groups...');

    const codeGroups = [
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_GROUP_NM: '컨테이너 타입', DESCRIPTION: '컨테이너 종류 코드', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_GROUP_NM: '통화', DESCRIPTION: '통화 코드', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_GROUP_NM: '특수화물', DESCRIPTION: '특수화물 유형', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_GROUP_NM: '품목', DESCRIPTION: '화물 품목 코드', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_GROUP_NM: '운임기준', DESCRIPTION: '운임 산정 기준', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_GROUP_NM: '포장단위', DESCRIPTION: '포장 단위 코드', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_GROUP_NM: '인코텀즈', DESCRIPTION: '무역 조건', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FILING_TYPE', CODE_GROUP_NM: '신고유형', DESCRIPTION: '세관 신고 유형', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'DECLARATION_TYPE', CODE_GROUP_NM: '신고종류', DESCRIPTION: '통관 신고 종류', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'WEIGHT_UNIT', CODE_GROUP_NM: '중량단위', DESCRIPTION: '중량 단위', USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_GROUP_NM: '국가', DESCRIPTION: '국가 코드', USE_YN: 'Y' }
    ];

    for (const group of codeGroups) {
      try {
        await connection.query(
          `INSERT INTO MST_COMMON_CODE_GROUP (CODE_GROUP_ID, CODE_GROUP_NM, DESCRIPTION, USE_YN) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE CODE_GROUP_NM = VALUES(CODE_GROUP_NM)`,
          [group.CODE_GROUP_ID, group.CODE_GROUP_NM, group.DESCRIPTION, group.USE_YN]
        );
      } catch (e) {
        console.log(`  Warning: ${group.CODE_GROUP_ID} - ${e.message}`);
      }
    }
    console.log('Code groups done');

    // 2. 공통 코드 삽입
    console.log('Inserting common codes...');
    const commonCodes = [
      // 컨테이너 타입
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '20GP', CODE_NM: '20피트 일반', CODE_NM_EN: '20ft General Purpose', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '40GP', CODE_NM: '40피트 일반', CODE_NM_EN: '40ft General Purpose', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '40HC', CODE_NM: '40피트 하이큐브', CODE_NM_EN: '40ft High Cube', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '20RF', CODE_NM: '20피트 냉동', CODE_NM_EN: '20ft Reefer', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '40RF', CODE_NM: '40피트 냉동', CODE_NM_EN: '40ft Reefer', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '20OT', CODE_NM: '20피트 오픈탑', CODE_NM_EN: '20ft Open Top', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '40OT', CODE_NM: '40피트 오픈탑', CODE_NM_EN: '40ft Open Top', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '20FR', CODE_NM: '20피트 플랫랙', CODE_NM_EN: '20ft Flat Rack', SORT_ORDER: 8, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '40FR', CODE_NM: '40피트 플랫랙', CODE_NM_EN: '40ft Flat Rack', SORT_ORDER: 9, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CONTAINER_TYPE', CODE_CD: '20TK', CODE_NM: '20피트 탱크', CODE_NM_EN: '20ft Tank', SORT_ORDER: 10, USE_YN: 'Y' },
      // 통화
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'KRW', CODE_NM: '한국 원', CODE_NM_EN: 'Korean Won', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'USD', CODE_NM: '미국 달러', CODE_NM_EN: 'US Dollar', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'EUR', CODE_NM: '유로', CODE_NM_EN: 'Euro', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'JPY', CODE_NM: '일본 엔', CODE_NM_EN: 'Japanese Yen', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'CNY', CODE_NM: '중국 위안', CODE_NM_EN: 'Chinese Yuan', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'GBP', CODE_NM: '영국 파운드', CODE_NM_EN: 'British Pound', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'SGD', CODE_NM: '싱가포르 달러', CODE_NM_EN: 'Singapore Dollar', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'CURRENCY', CODE_CD: 'HKD', CODE_NM: '홍콩 달러', CODE_NM_EN: 'Hong Kong Dollar', SORT_ORDER: 8, USE_YN: 'Y' },
      // 특수화물
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'DG', CODE_NM: '위험물', CODE_NM_EN: 'Dangerous Goods', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'RF', CODE_NM: '냉동화물', CODE_NM_EN: 'Refrigerated', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'OOG', CODE_NM: '규격외화물', CODE_NM_EN: 'Out of Gauge', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'BB', CODE_NM: '브레이크벌크', CODE_NM_EN: 'Break Bulk', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'AW', CODE_NM: '동물', CODE_NM_EN: 'Live Animal', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'PER', CODE_NM: '부패성화물', CODE_NM_EN: 'Perishable', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'VAL', CODE_NM: '귀중품', CODE_NM_EN: 'Valuable', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'SPECIAL_CARGO', CODE_CD: 'HUM', CODE_NM: '유해', CODE_NM_EN: 'Human Remains', SORT_ORDER: 8, USE_YN: 'Y' },
      // 품목
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'ELEC', CODE_NM: '전자제품', CODE_NM_EN: 'Electronics', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'TEXT', CODE_NM: '섬유/의류', CODE_NM_EN: 'Textiles/Apparel', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'MACH', CODE_NM: '기계류', CODE_NM_EN: 'Machinery', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'CHEM', CODE_NM: '화학제품', CODE_NM_EN: 'Chemicals', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'FOOD', CODE_NM: '식품', CODE_NM_EN: 'Food Products', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'AUTO', CODE_NM: '자동차부품', CODE_NM_EN: 'Auto Parts', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'PLAS', CODE_NM: '플라스틱제품', CODE_NM_EN: 'Plastic Products', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'STEEL', CODE_NM: '철강/금속', CODE_NM_EN: 'Steel/Metal', SORT_ORDER: 8, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'FURN', CODE_NM: '가구', CODE_NM_EN: 'Furniture', SORT_ORDER: 9, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COMMODITY', CODE_CD: 'COSM', CODE_NM: '화장품', CODE_NM_EN: 'Cosmetics', SORT_ORDER: 10, USE_YN: 'Y' },
      // 운임기준
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'CBM', CODE_NM: '입방미터', CODE_NM_EN: 'Cubic Meter', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'RT', CODE_NM: '레버뉴톤', CODE_NM_EN: 'Revenue Ton', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'KG', CODE_NM: '킬로그램', CODE_NM_EN: 'Kilogram', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'CNTR', CODE_NM: '컨테이너', CODE_NM_EN: 'Container', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'BL', CODE_NM: '선하증권', CODE_NM_EN: 'Bill of Lading', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FREIGHT_BASE', CODE_CD: 'SHIPMENT', CODE_NM: '건별', CODE_NM_EN: 'Per Shipment', SORT_ORDER: 6, USE_YN: 'Y' },
      // 포장단위
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'CT', CODE_NM: '카톤', CODE_NM_EN: 'Carton', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'PLT', CODE_NM: '팔레트', CODE_NM_EN: 'Pallet', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'BOX', CODE_NM: '박스', CODE_NM_EN: 'Box', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'BAG', CODE_NM: '백', CODE_NM_EN: 'Bag', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'DRM', CODE_NM: '드럼', CODE_NM_EN: 'Drum', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'PCS', CODE_NM: '피스', CODE_NM_EN: 'Pieces', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'PKG', CODE_NM: '패키지', CODE_NM_EN: 'Package', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'PKG_TYPE', CODE_CD: 'CRT', CODE_NM: '크레이트', CODE_NM_EN: 'Crate', SORT_ORDER: 8, USE_YN: 'Y' },
      // 인코텀즈
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'FOB', CODE_NM: '본선인도', CODE_NM_EN: 'Free On Board', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'CIF', CODE_NM: '운임보험료포함', CODE_NM_EN: 'Cost Insurance Freight', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'CFR', CODE_NM: '운임포함', CODE_NM_EN: 'Cost and Freight', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'EXW', CODE_NM: '공장인도', CODE_NM_EN: 'Ex Works', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'FCA', CODE_NM: '운송인인도', CODE_NM_EN: 'Free Carrier', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'CPT', CODE_NM: '운송비지급', CODE_NM_EN: 'Carriage Paid To', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'CIP', CODE_NM: '운송비보험료지급', CODE_NM_EN: 'Carriage Insurance Paid', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'DAP', CODE_NM: '도착장소인도', CODE_NM_EN: 'Delivered At Place', SORT_ORDER: 8, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'INCOTERMS', CODE_CD: 'DDP', CODE_NM: '관세지급인도', CODE_NM_EN: 'Delivered Duty Paid', SORT_ORDER: 9, USE_YN: 'Y' },
      // 신고유형
      { CODE_GROUP_ID: 'FILING_TYPE', CODE_CD: 'ORIGINAL', CODE_NM: '최초신고', CODE_NM_EN: 'Original Filing', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FILING_TYPE', CODE_CD: 'AMENDMENT', CODE_NM: '정정신고', CODE_NM_EN: 'Amendment', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'FILING_TYPE', CODE_CD: 'CANCELLATION', CODE_NM: '취소신고', CODE_NM_EN: 'Cancellation', SORT_ORDER: 3, USE_YN: 'Y' },
      // 신고종류
      { CODE_GROUP_ID: 'DECLARATION_TYPE', CODE_CD: 'EXPORT', CODE_NM: '수출신고', CODE_NM_EN: 'Export Declaration', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'DECLARATION_TYPE', CODE_CD: 'IMPORT', CODE_NM: '수입신고', CODE_NM_EN: 'Import Declaration', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'DECLARATION_TYPE', CODE_CD: 'TRANSIT', CODE_NM: '환적신고', CODE_NM_EN: 'Transit Declaration', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'DECLARATION_TYPE', CODE_CD: 'BONDED', CODE_NM: '보세신고', CODE_NM_EN: 'Bonded Declaration', SORT_ORDER: 4, USE_YN: 'Y' },
      // 중량단위
      { CODE_GROUP_ID: 'WEIGHT_UNIT', CODE_CD: 'KG', CODE_NM: '킬로그램', CODE_NM_EN: 'Kilogram', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'WEIGHT_UNIT', CODE_CD: 'LB', CODE_NM: '파운드', CODE_NM_EN: 'Pound', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'WEIGHT_UNIT', CODE_CD: 'MT', CODE_NM: '메트릭톤', CODE_NM_EN: 'Metric Ton', SORT_ORDER: 3, USE_YN: 'Y' },
      // 국가
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'KR', CODE_NM: '대한민국', CODE_NM_EN: 'Korea', SORT_ORDER: 1, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'US', CODE_NM: '미국', CODE_NM_EN: 'United States', SORT_ORDER: 2, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'CN', CODE_NM: '중국', CODE_NM_EN: 'China', SORT_ORDER: 3, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'JP', CODE_NM: '일본', CODE_NM_EN: 'Japan', SORT_ORDER: 4, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'VN', CODE_NM: '베트남', CODE_NM_EN: 'Vietnam', SORT_ORDER: 5, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'TH', CODE_NM: '태국', CODE_NM_EN: 'Thailand', SORT_ORDER: 6, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'SG', CODE_NM: '싱가포르', CODE_NM_EN: 'Singapore', SORT_ORDER: 7, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'DE', CODE_NM: '독일', CODE_NM_EN: 'Germany', SORT_ORDER: 8, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'GB', CODE_NM: '영국', CODE_NM_EN: 'United Kingdom', SORT_ORDER: 9, USE_YN: 'Y' },
      { CODE_GROUP_ID: 'COUNTRY', CODE_CD: 'NL', CODE_NM: '네덜란드', CODE_NM_EN: 'Netherlands', SORT_ORDER: 10, USE_YN: 'Y' }
    ];

    for (const code of commonCodes) {
      try {
        await connection.query(
          `INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM)`,
          [code.CODE_GROUP_ID, code.CODE_CD, code.CODE_NM, code.CODE_NM_EN, code.SORT_ORDER, code.USE_YN]
        );
      } catch (e) {
        console.log(`  Warning: ${code.CODE_GROUP_ID}/${code.CODE_CD} - ${e.message}`);
      }
    }
    console.log('Common codes done');

    // 3. 관세사 데이터 삽입
    console.log('Inserting customs brokers...');
    const brokers = [
      { BROKER_ID: 'BRK001', BROKER_CD: 'KB001', BROKER_NM: '한국관세사', BROKER_NM_EN: 'Korea Customs Broker', LICENSE_NO: '2024-001', REPRESENTATIVE: '김관세', TEL: '02-1234-5678', FAX: '02-1234-5679', EMAIL: 'korea@customs.com', ADDRESS: '서울시 강남구 테헤란로 123', USE_YN: 'Y' },
      { BROKER_ID: 'BRK002', BROKER_CD: 'KB002', BROKER_NM: '대한통관', BROKER_NM_EN: 'Daehan Customs', LICENSE_NO: '2024-002', REPRESENTATIVE: '이통관', TEL: '02-2345-6789', FAX: '02-2345-6790', EMAIL: 'daehan@customs.com', ADDRESS: '서울시 중구 을지로 456', USE_YN: 'Y' },
      { BROKER_ID: 'BRK003', BROKER_CD: 'KB003', BROKER_NM: '글로벌관세법인', BROKER_NM_EN: 'Global Customs Corp', LICENSE_NO: '2024-003', REPRESENTATIVE: '박글로벌', TEL: '032-123-4567', FAX: '032-123-4568', EMAIL: 'global@customs.com', ADDRESS: '인천시 중구 공항로 789', USE_YN: 'Y' },
      { BROKER_ID: 'BRK004', BROKER_CD: 'KB004', BROKER_NM: '인천관세사', BROKER_NM_EN: 'Incheon Customs', LICENSE_NO: '2024-004', REPRESENTATIVE: '최인천', TEL: '032-234-5678', FAX: '032-234-5679', EMAIL: 'incheon@customs.com', ADDRESS: '인천시 연수구 송도동 111', USE_YN: 'Y' },
      { BROKER_ID: 'BRK005', BROKER_CD: 'KB005', BROKER_NM: '부산통관법인', BROKER_NM_EN: 'Busan Customs Corp', LICENSE_NO: '2024-005', REPRESENTATIVE: '정부산', TEL: '051-345-6789', FAX: '051-345-6790', EMAIL: 'busan@customs.com', ADDRESS: '부산시 중구 중앙대로 222', USE_YN: 'Y' }
    ];

    for (const broker of brokers) {
      try {
        await connection.query(
          `INSERT INTO MST_CUSTOMS_BROKER (BROKER_ID, BROKER_CD, BROKER_NM, BROKER_NM_EN, LICENSE_NO, REPRESENTATIVE, TEL, FAX, EMAIL, ADDRESS, USE_YN)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE BROKER_NM = VALUES(BROKER_NM)`,
          [broker.BROKER_ID, broker.BROKER_CD, broker.BROKER_NM, broker.BROKER_NM_EN, broker.LICENSE_NO, broker.REPRESENTATIVE, broker.TEL, broker.FAX, broker.EMAIL, broker.ADDRESS, broker.USE_YN]
        );
      } catch (e) {
        console.log(`  Warning: ${broker.BROKER_ID} - ${e.message}`);
      }
    }
    console.log('Customs brokers done');

    // 4. 통관 테스트 데이터 삽입
    console.log('Inserting customs declarations...');
    const declarations = [
      { DECLARATION_ID: 'DEC001', DECLARATION_NO: 'ED2024-001234', DECLARATION_TYPE: 'EXPORT', SHIPMENT_ID: 'SHP001', MBL_NO: 'KRPUS12345678', HBL_NO: 'HBLEXP001', CUSTOMS_BROKER_ID: 'BRK001', DECLARATION_DATE: '2024-01-15', SHIPPER_NAME: '삼성전자', SHIPPER_ADDR: '서울시 서초구 삼성로 123', CONSIGNEE_NAME: 'ABC Trading', CONSIGNEE_ADDR: '123 Main St, Los Angeles, CA 90001', HS_CODE: '8528.72', GOODS_DESC: '텔레비전 LCD 50인치', ORIGIN_COUNTRY: 'KR', QUANTITY: 100, QUANTITY_UNIT: 'SET', GROSS_WEIGHT: 5000, NET_WEIGHT: 4800, WEIGHT_UNIT: 'KG', DECLARED_VALUE: 150000, CURRENCY: 'USD', DUTY_AMOUNT: 0, TAX_AMOUNT: 0, STATUS: 'ACCEPTED' },
      { DECLARATION_ID: 'DEC002', DECLARATION_NO: 'ED2024-001235', DECLARATION_TYPE: 'EXPORT', SHIPMENT_ID: 'SHP002', MBL_NO: 'KRPUS12345679', HBL_NO: 'HBLEXP002', CUSTOMS_BROKER_ID: 'BRK002', DECLARATION_DATE: '2024-01-16', SHIPPER_NAME: 'LG전자', SHIPPER_ADDR: '서울시 영등포구 여의대로 456', CONSIGNEE_NAME: 'XYZ Corp', CONSIGNEE_ADDR: '456 Commerce Blvd, Seattle, WA 98101', HS_CODE: '8418.10', GOODS_DESC: '냉장고 프렌치도어', ORIGIN_COUNTRY: 'KR', QUANTITY: 50, QUANTITY_UNIT: 'SET', GROSS_WEIGHT: 8000, NET_WEIGHT: 7500, WEIGHT_UNIT: 'KG', DECLARED_VALUE: 75000, CURRENCY: 'USD', DUTY_AMOUNT: 0, TAX_AMOUNT: 0, STATUS: 'SUBMITTED' },
      { DECLARATION_ID: 'DEC003', DECLARATION_NO: 'ID2024-002345', DECLARATION_TYPE: 'IMPORT', SHIPMENT_ID: 'SHP003', MBL_NO: 'CNKRB23456789', HBL_NO: 'HBLIMP001', CUSTOMS_BROKER_ID: 'BRK003', DECLARATION_DATE: '2024-01-17', SHIPPER_NAME: 'Shanghai Electronics', SHIPPER_ADDR: '200 Pudong Ave, Shanghai, China', CONSIGNEE_NAME: '현대상사', CONSIGNEE_ADDR: '서울시 강남구 역삼동 789', HS_CODE: '8471.30', GOODS_DESC: '노트북 컴퓨터', ORIGIN_COUNTRY: 'CN', QUANTITY: 200, QUANTITY_UNIT: 'SET', GROSS_WEIGHT: 1000, NET_WEIGHT: 950, WEIGHT_UNIT: 'KG', DECLARED_VALUE: 200000, CURRENCY: 'USD', DUTY_AMOUNT: 16000, TAX_AMOUNT: 20000, STATUS: 'CLEARED' },
      { DECLARATION_ID: 'DEC004', DECLARATION_NO: 'ID2024-002346', DECLARATION_TYPE: 'IMPORT', SHIPMENT_ID: 'SHP004', MBL_NO: 'VNKRB34567890', HBL_NO: 'HBLIMP002', CUSTOMS_BROKER_ID: 'BRK004', DECLARATION_DATE: '2024-01-18', SHIPPER_NAME: 'Vietnam Textile Co.', SHIPPER_ADDR: '100 Hanoi Road, Hanoi, Vietnam', CONSIGNEE_NAME: '동대문무역', CONSIGNEE_ADDR: '서울시 중구 동대문로 111', HS_CODE: '6204.62', GOODS_DESC: '여성의류 면제품', ORIGIN_COUNTRY: 'VN', QUANTITY: 5000, QUANTITY_UNIT: 'PCS', GROSS_WEIGHT: 2500, NET_WEIGHT: 2400, WEIGHT_UNIT: 'KG', DECLARED_VALUE: 50000, CURRENCY: 'USD', DUTY_AMOUNT: 6500, TAX_AMOUNT: 5000, STATUS: 'SUBMITTED' },
      { DECLARATION_ID: 'DEC005', DECLARATION_NO: 'ED2024-001236', DECLARATION_TYPE: 'EXPORT', SHIPMENT_ID: 'SHP005', MBL_NO: 'KRSHA45678901', HBL_NO: 'HBLEXP003', CUSTOMS_BROKER_ID: 'BRK005', DECLARATION_DATE: '2024-01-19', SHIPPER_NAME: '포스코', SHIPPER_ADDR: '경북 포항시 남구 포스코대로 1', CONSIGNEE_NAME: 'China Steel Corp', CONSIGNEE_ADDR: '500 Industrial Zone, Guangzhou, China', HS_CODE: '7208.51', GOODS_DESC: '열연강판 코일', ORIGIN_COUNTRY: 'KR', QUANTITY: 10, QUANTITY_UNIT: 'COIL', GROSS_WEIGHT: 250000, NET_WEIGHT: 250000, WEIGHT_UNIT: 'KG', DECLARED_VALUE: 175000, CURRENCY: 'USD', DUTY_AMOUNT: 0, TAX_AMOUNT: 0, STATUS: 'DRAFT' }
    ];

    for (const decl of declarations) {
      try {
        await connection.query(
          `INSERT INTO CUS_DECLARATION (DECLARATION_ID, DECLARATION_NO, DECLARATION_TYPE, SHIPMENT_ID, MBL_NO, HBL_NO, CUSTOMS_BROKER_ID, DECLARATION_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, HS_CODE, GOODS_DESC, ORIGIN_COUNTRY, QUANTITY, QUANTITY_UNIT, GROSS_WEIGHT, NET_WEIGHT, WEIGHT_UNIT, DECLARED_VALUE, CURRENCY, DUTY_AMOUNT, TAX_AMOUNT, STATUS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE DECLARATION_NO = VALUES(DECLARATION_NO)`,
          [decl.DECLARATION_ID, decl.DECLARATION_NO, decl.DECLARATION_TYPE, decl.SHIPMENT_ID, decl.MBL_NO, decl.HBL_NO, decl.CUSTOMS_BROKER_ID, decl.DECLARATION_DATE, decl.SHIPPER_NAME, decl.SHIPPER_ADDR, decl.CONSIGNEE_NAME, decl.CONSIGNEE_ADDR, decl.HS_CODE, decl.GOODS_DESC, decl.ORIGIN_COUNTRY, decl.QUANTITY, decl.QUANTITY_UNIT, decl.GROSS_WEIGHT, decl.NET_WEIGHT, decl.WEIGHT_UNIT, decl.DECLARED_VALUE, decl.CURRENCY, decl.DUTY_AMOUNT, decl.TAX_AMOUNT, decl.STATUS]
        );
      } catch (e) {
        console.log(`  Warning: ${decl.DECLARATION_ID} - ${e.message}`);
      }
    }
    console.log('Customs declarations done');

    // 5. AMS 테스트 데이터 삽입
    console.log('Inserting AMS data...');
    const amsData = [
      { AMS_ID: 'AMS001', SHIPMENT_ID: 'SHP001', MBL_NO: 'KRPUS12345678', HBL_NO: 'HBLEXP001', AMS_TYPE: 'AMS', FILING_TYPE: 'ORIGINAL', FILING_NO: 'AMS2024001234', FILING_DATE: '2024-01-14', SHIPPER_NAME: '삼성전자', SHIPPER_ADDR: '서울시 서초구 삼성로 123', CONSIGNEE_NAME: 'ABC Trading', CONSIGNEE_ADDR: '123 Main St, Los Angeles, CA 90001', NOTIFY_NAME: 'Same as Consignee', NOTIFY_ADDR: '123 Main St, Los Angeles, CA 90001', GOODS_DESC: 'TELEVISION LCD 50 INCH', CONTAINER_NO: 'MSKU1234567', SEAL_NO: 'SL12345', WEIGHT: 5000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '1A', RESPONSE_MSG: 'ACCEPTED', STATUS: 'ACCEPTED' },
      { AMS_ID: 'AMS002', SHIPMENT_ID: 'SHP002', MBL_NO: 'KRPUS12345679', HBL_NO: 'HBLEXP002', AMS_TYPE: 'AMS', FILING_TYPE: 'ORIGINAL', FILING_NO: 'AMS2024001235', FILING_DATE: '2024-01-15', SHIPPER_NAME: 'LG전자', SHIPPER_ADDR: '서울시 영등포구 여의대로 456', CONSIGNEE_NAME: 'XYZ Corp', CONSIGNEE_ADDR: '456 Commerce Blvd, Seattle, WA 98101', NOTIFY_NAME: 'XYZ Corp', NOTIFY_ADDR: '456 Commerce Blvd, Seattle, WA 98101', GOODS_DESC: 'REFRIGERATOR FRENCH DOOR TYPE', CONTAINER_NO: 'TCNU2345678', SEAL_NO: 'SL23456', WEIGHT: 8000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '1A', RESPONSE_MSG: 'ACCEPTED', STATUS: 'ACCEPTED' },
      { AMS_ID: 'AMS003', SHIPMENT_ID: 'SHP006', MBL_NO: 'KRLAX56789012', HBL_NO: 'HBLEXP004', AMS_TYPE: 'AMS', FILING_TYPE: 'ORIGINAL', FILING_NO: 'AMS2024001236', FILING_DATE: '2024-01-16', SHIPPER_NAME: '현대자동차', SHIPPER_ADDR: '서울시 서초구 현대로 789', CONSIGNEE_NAME: 'US Auto Parts', CONSIGNEE_ADDR: '789 Motor Ave, Detroit, MI 48201', NOTIFY_NAME: 'US Auto Parts', NOTIFY_ADDR: '789 Motor Ave, Detroit, MI 48201', GOODS_DESC: 'AUTOMOBILE PARTS BRAKE SYSTEM', CONTAINER_NO: 'OOLU3456789', SEAL_NO: 'SL34567', WEIGHT: 12000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: 'P1', RESPONSE_MSG: 'PENDING', STATUS: 'SUBMITTED' },
      { AMS_ID: 'AMS004', SHIPMENT_ID: 'SHP007', MBL_NO: 'KRLAX67890123', HBL_NO: 'HBLEXP005', AMS_TYPE: 'AMS', FILING_TYPE: 'AMENDMENT', FILING_NO: 'AMS2024001237', FILING_DATE: '2024-01-17', SHIPPER_NAME: 'SK하이닉스', SHIPPER_ADDR: '경기도 이천시 하이닉스로 1', CONSIGNEE_NAME: 'Tech Solutions Inc', CONSIGNEE_ADDR: '100 Tech Park, San Jose, CA 95101', NOTIFY_NAME: 'Tech Solutions Inc', NOTIFY_ADDR: '100 Tech Park, San Jose, CA 95101', GOODS_DESC: 'SEMICONDUCTOR MEMORY CHIP', CONTAINER_NO: 'CMAU4567890', SEAL_NO: 'SL45678', WEIGHT: 500, WEIGHT_UNIT: 'KG', RESPONSE_CODE: 'A1', RESPONSE_MSG: 'AMENDMENT ACCEPTED', STATUS: 'ACCEPTED' },
      { AMS_ID: 'AMS005', SHIPMENT_ID: 'SHP008', MBL_NO: 'KRNYC78901234', HBL_NO: 'HBLEXP006', AMS_TYPE: 'AMS', FILING_TYPE: 'ORIGINAL', FILING_NO: 'AMS2024001238', FILING_DATE: '2024-01-18', SHIPPER_NAME: '한화솔루션', SHIPPER_ADDR: '서울시 중구 한화빌딩 1', CONSIGNEE_NAME: 'Green Energy Corp', CONSIGNEE_ADDR: '200 Green Blvd, Houston, TX 77001', NOTIFY_NAME: 'Green Energy Corp', NOTIFY_ADDR: '200 Green Blvd, Houston, TX 77001', GOODS_DESC: 'SOLAR PANEL MODULE', CONTAINER_NO: 'EISU5678901', SEAL_NO: 'SL56789', WEIGHT: 15000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '', RESPONSE_MSG: '', STATUS: 'DRAFT' }
    ];

    for (const ams of amsData) {
      try {
        await connection.query(
          `INSERT INTO CUS_AMS_MANIFEST (AMS_ID, SHIPMENT_ID, MBL_NO, HBL_NO, AMS_TYPE, FILING_TYPE, FILING_NO, FILING_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, NOTIFY_NAME, NOTIFY_ADDR, GOODS_DESC, CONTAINER_NO, SEAL_NO, WEIGHT, WEIGHT_UNIT, RESPONSE_CODE, RESPONSE_MSG, STATUS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE FILING_NO = VALUES(FILING_NO)`,
          [ams.AMS_ID, ams.SHIPMENT_ID, ams.MBL_NO, ams.HBL_NO, ams.AMS_TYPE, ams.FILING_TYPE, ams.FILING_NO, ams.FILING_DATE, ams.SHIPPER_NAME, ams.SHIPPER_ADDR, ams.CONSIGNEE_NAME, ams.CONSIGNEE_ADDR, ams.NOTIFY_NAME, ams.NOTIFY_ADDR, ams.GOODS_DESC, ams.CONTAINER_NO, ams.SEAL_NO, ams.WEIGHT, ams.WEIGHT_UNIT, ams.RESPONSE_CODE, ams.RESPONSE_MSG, ams.STATUS]
        );
      } catch (e) {
        console.log(`  Warning: ${ams.AMS_ID} - ${e.message}`);
      }
    }
    console.log('AMS data done');

    // 6. 적하목록 테스트 데이터 삽입
    console.log('Inserting Manifest data...');
    const manifestData = [
      { AMS_ID: 'MF001', SHIPMENT_ID: 'SHP003', MBL_NO: 'CNKRB23456789', HBL_NO: 'HBLIMP001', AMS_TYPE: 'MANIFEST', FILING_TYPE: 'ORIGINAL', FILING_NO: 'MF2024001001', FILING_DATE: '2024-01-17', SHIPPER_NAME: 'Shanghai Electronics', SHIPPER_ADDR: '200 Pudong Ave, Shanghai, China', CONSIGNEE_NAME: '현대상사', CONSIGNEE_ADDR: '서울시 강남구 역삼동 789', NOTIFY_NAME: '현대상사', NOTIFY_ADDR: '서울시 강남구 역삼동 789', GOODS_DESC: 'NOTEBOOK COMPUTER LAPTOP', CONTAINER_NO: 'CSLU6789012', SEAL_NO: 'SM12345', WEIGHT: 1000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '10', RESPONSE_MSG: 'ACCEPTED', STATUS: 'ACCEPTED' },
      { AMS_ID: 'MF002', SHIPMENT_ID: 'SHP004', MBL_NO: 'VNKRB34567890', HBL_NO: 'HBLIMP002', AMS_TYPE: 'MANIFEST', FILING_TYPE: 'ORIGINAL', FILING_NO: 'MF2024001002', FILING_DATE: '2024-01-18', SHIPPER_NAME: 'Vietnam Textile Co.', SHIPPER_ADDR: '100 Hanoi Road, Hanoi, Vietnam', CONSIGNEE_NAME: '동대문무역', CONSIGNEE_ADDR: '서울시 중구 동대문로 111', NOTIFY_NAME: '동대문무역', NOTIFY_ADDR: '서울시 중구 동대문로 111', GOODS_DESC: 'COTTON APPAREL WOMENS CLOTHING', CONTAINER_NO: 'HDMU7890123', SEAL_NO: 'SM23456', WEIGHT: 2500, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '10', RESPONSE_MSG: 'ACCEPTED', STATUS: 'ACCEPTED' },
      { AMS_ID: 'MF003', SHIPMENT_ID: 'SHP009', MBL_NO: 'JPKRB45678901', HBL_NO: 'HBLIMP003', AMS_TYPE: 'MANIFEST', FILING_TYPE: 'ORIGINAL', FILING_NO: 'MF2024001003', FILING_DATE: '2024-01-19', SHIPPER_NAME: 'Tokyo Trading Co.', SHIPPER_ADDR: '1-1 Marunouchi, Chiyoda-ku, Tokyo', CONSIGNEE_NAME: '롯데무역', CONSIGNEE_ADDR: '서울시 송파구 올림픽로 300', NOTIFY_NAME: '롯데무역', NOTIFY_ADDR: '서울시 송파구 올림픽로 300', GOODS_DESC: 'AUTOMOBILE ENGINE PARTS', CONTAINER_NO: 'NYKU8901234', SEAL_NO: 'SM34567', WEIGHT: 5000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: 'P1', RESPONSE_MSG: 'PENDING', STATUS: 'SUBMITTED' },
      { AMS_ID: 'MF004', SHIPMENT_ID: 'SHP010', MBL_NO: 'SGKRB56789012', HBL_NO: 'HBLIMP004', AMS_TYPE: 'MANIFEST', FILING_TYPE: 'AMENDMENT', FILING_NO: 'MF2024001004', FILING_DATE: '2024-01-20', SHIPPER_NAME: 'Singapore Chem Pte Ltd', SHIPPER_ADDR: '10 Jurong Industrial, Singapore', CONSIGNEE_NAME: '한화케미칼', CONSIGNEE_ADDR: '서울시 중구 청계천로 86', NOTIFY_NAME: '한화케미칼', NOTIFY_ADDR: '서울시 중구 청계천로 86', GOODS_DESC: 'CHEMICAL PRODUCTS INDUSTRIAL USE', CONTAINER_NO: 'SEGU9012345', SEAL_NO: 'SM45678', WEIGHT: 20000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: 'A1', RESPONSE_MSG: 'AMENDMENT RECEIVED', STATUS: 'SUBMITTED' },
      { AMS_ID: 'MF005', SHIPMENT_ID: 'SHP011', MBL_NO: 'DEKRB67890123', HBL_NO: 'HBLIMP005', AMS_TYPE: 'MANIFEST', FILING_TYPE: 'ORIGINAL', FILING_NO: 'MF2024001005', FILING_DATE: '2024-01-21', SHIPPER_NAME: 'German Machinery GmbH', SHIPPER_ADDR: '100 Industrial Str, Hamburg, Germany', CONSIGNEE_NAME: 'LS산전', CONSIGNEE_ADDR: '경기도 안양시 동안구 LS로 127', NOTIFY_NAME: 'LS산전', NOTIFY_ADDR: '경기도 안양시 동안구 LS로 127', GOODS_DESC: 'INDUSTRIAL MACHINERY EQUIPMENT', CONTAINER_NO: 'MSKU0123456', SEAL_NO: 'SM56789', WEIGHT: 35000, WEIGHT_UNIT: 'KG', RESPONSE_CODE: '', RESPONSE_MSG: '', STATUS: 'DRAFT' }
    ];

    for (const mf of manifestData) {
      try {
        await connection.query(
          `INSERT INTO CUS_AMS_MANIFEST (AMS_ID, SHIPMENT_ID, MBL_NO, HBL_NO, AMS_TYPE, FILING_TYPE, FILING_NO, FILING_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, NOTIFY_NAME, NOTIFY_ADDR, GOODS_DESC, CONTAINER_NO, SEAL_NO, WEIGHT, WEIGHT_UNIT, RESPONSE_CODE, RESPONSE_MSG, STATUS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE FILING_NO = VALUES(FILING_NO)`,
          [mf.AMS_ID, mf.SHIPMENT_ID, mf.MBL_NO, mf.HBL_NO, mf.AMS_TYPE, mf.FILING_TYPE, mf.FILING_NO, mf.FILING_DATE, mf.SHIPPER_NAME, mf.SHIPPER_ADDR, mf.CONSIGNEE_NAME, mf.CONSIGNEE_ADDR, mf.NOTIFY_NAME, mf.NOTIFY_ADDR, mf.GOODS_DESC, mf.CONTAINER_NO, mf.SEAL_NO, mf.WEIGHT, mf.WEIGHT_UNIT, mf.RESPONSE_CODE, mf.RESPONSE_MSG, mf.STATUS]
        );
      } catch (e) {
        console.log(`  Warning: ${mf.AMS_ID} - ${e.message}`);
      }
    }
    console.log('Manifest data done');

    console.log('\n=== Data insertion complete ===');

    // Verify data
    const [codeGroupsCount] = await connection.query('SELECT COUNT(*) as cnt FROM MST_COMMON_CODE_GROUP');
    const [codesCount] = await connection.query('SELECT COUNT(*) as cnt FROM MST_COMMON_CODE');
    const [brokersCount] = await connection.query('SELECT COUNT(*) as cnt FROM MST_CUSTOMS_BROKER');
    const [declsCount] = await connection.query('SELECT COUNT(*) as cnt FROM CUS_DECLARATION');
    const [amsCount] = await connection.query("SELECT COUNT(*) as cnt FROM CUS_AMS_MANIFEST WHERE AMS_TYPE = 'AMS'");
    const [manifestCount] = await connection.query("SELECT COUNT(*) as cnt FROM CUS_AMS_MANIFEST WHERE AMS_TYPE = 'MANIFEST'");

    console.log('\n=== Verification Results ===');
    console.log('Code Groups:', codeGroupsCount[0].cnt, 'records');
    console.log('Common Codes:', codesCount[0].cnt, 'records');
    console.log('Customs Brokers:', brokersCount[0].cnt, 'records');
    console.log('Declarations:', declsCount[0].cnt, 'records');
    console.log('AMS:', amsCount[0].cnt, 'records');
    console.log('Manifest:', manifestCount[0].cnt, 'records');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
    console.log('\nDatabase connection closed');
  }
}

insertMasterData();
