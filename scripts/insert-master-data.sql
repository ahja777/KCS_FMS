-- 마스터 코드 데이터 삽입 스크립트
-- FMS 시스템 팝업에서 사용되는 코드 데이터

-- 1. 코드 그룹 삽입
INSERT INTO MST_COMMON_CODE_GROUP (CODE_GROUP_ID, CODE_GROUP_NM, DESCRIPTION, USE_YN, CREATED_BY, CREATED_AT) VALUES
('CONTAINER_TYPE', '컨테이너 타입', '컨테이너 종류 코드', 'Y', 'admin', NOW()),
('CURRENCY', '통화', '통화 코드', 'Y', 'admin', NOW()),
('SPECIAL_CARGO', '특수화물', '특수화물 유형', 'Y', 'admin', NOW()),
('COMMODITY', '품목', '화물 품목 코드', 'Y', 'admin', NOW()),
('FREIGHT_BASE', '운임기준', '운임 산정 기준', 'Y', 'admin', NOW()),
('PKG_TYPE', '포장단위', '포장 단위 코드', 'Y', 'admin', NOW()),
('INCOTERMS', '인코텀즈', '무역 조건', 'Y', 'admin', NOW()),
('FILING_TYPE', '신고유형', '세관 신고 유형', 'Y', 'admin', NOW()),
('DECLARATION_TYPE', '신고종류', '통관 신고 종류', 'Y', 'admin', NOW()),
('WEIGHT_UNIT', '중량단위', '중량 단위', 'Y', 'admin', NOW()),
('COUNTRY', '국가', '국가 코드', 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_GROUP_NM = VALUES(CODE_GROUP_NM);

-- 2. 컨테이너 타입 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('CONTAINER_TYPE', '20GP', '20피트 일반', '20ft General Purpose', 1, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '40GP', '40피트 일반', '40ft General Purpose', 2, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '40HC', '40피트 하이큐브', '40ft High Cube', 3, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '20RF', '20피트 냉동', '20ft Reefer', 4, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '40RF', '40피트 냉동', '40ft Reefer', 5, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '20OT', '20피트 오픈탑', '20ft Open Top', 6, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '40OT', '40피트 오픈탑', '40ft Open Top', 7, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '20FR', '20피트 플랫랙', '20ft Flat Rack', 8, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '40FR', '40피트 플랫랙', '40ft Flat Rack', 9, 'Y', 'admin', NOW()),
('CONTAINER_TYPE', '20TK', '20피트 탱크', '20ft Tank', 10, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 3. 통화 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('CURRENCY', 'KRW', '한국 원', 'Korean Won', 1, 'Y', 'admin', NOW()),
('CURRENCY', 'USD', '미국 달러', 'US Dollar', 2, 'Y', 'admin', NOW()),
('CURRENCY', 'EUR', '유로', 'Euro', 3, 'Y', 'admin', NOW()),
('CURRENCY', 'JPY', '일본 엔', 'Japanese Yen', 4, 'Y', 'admin', NOW()),
('CURRENCY', 'CNY', '중국 위안', 'Chinese Yuan', 5, 'Y', 'admin', NOW()),
('CURRENCY', 'GBP', '영국 파운드', 'British Pound', 6, 'Y', 'admin', NOW()),
('CURRENCY', 'SGD', '싱가포르 달러', 'Singapore Dollar', 7, 'Y', 'admin', NOW()),
('CURRENCY', 'HKD', '홍콩 달러', 'Hong Kong Dollar', 8, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 4. 특수화물 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('SPECIAL_CARGO', 'DG', '위험물', 'Dangerous Goods', 1, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'RF', '냉동화물', 'Refrigerated', 2, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'OOG', '규격외화물', 'Out of Gauge', 3, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'BB', '브레이크벌크', 'Break Bulk', 4, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'AW', '동물', 'Live Animal', 5, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'PER', '부패성화물', 'Perishable', 6, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'VAL', '귀중품', 'Valuable', 7, 'Y', 'admin', NOW()),
('SPECIAL_CARGO', 'HUM', '유해', 'Human Remains', 8, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 5. 품목 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('COMMODITY', 'ELEC', '전자제품', 'Electronics', 1, 'Y', 'admin', NOW()),
('COMMODITY', 'TEXT', '섬유/의류', 'Textiles/Apparel', 2, 'Y', 'admin', NOW()),
('COMMODITY', 'MACH', '기계류', 'Machinery', 3, 'Y', 'admin', NOW()),
('COMMODITY', 'CHEM', '화학제품', 'Chemicals', 4, 'Y', 'admin', NOW()),
('COMMODITY', 'FOOD', '식품', 'Food Products', 5, 'Y', 'admin', NOW()),
('COMMODITY', 'AUTO', '자동차부품', 'Auto Parts', 6, 'Y', 'admin', NOW()),
('COMMODITY', 'PLAS', '플라스틱제품', 'Plastic Products', 7, 'Y', 'admin', NOW()),
('COMMODITY', 'STEEL', '철강/금속', 'Steel/Metal', 8, 'Y', 'admin', NOW()),
('COMMODITY', 'FURN', '가구', 'Furniture', 9, 'Y', 'admin', NOW()),
('COMMODITY', 'COSM', '화장품', 'Cosmetics', 10, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 6. 운임기준 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('FREIGHT_BASE', 'CBM', '입방미터', 'Cubic Meter', 1, 'Y', 'admin', NOW()),
('FREIGHT_BASE', 'RT', '레버뉴톤', 'Revenue Ton', 2, 'Y', 'admin', NOW()),
('FREIGHT_BASE', 'KG', '킬로그램', 'Kilogram', 3, 'Y', 'admin', NOW()),
('FREIGHT_BASE', 'CNTR', '컨테이너', 'Container', 4, 'Y', 'admin', NOW()),
('FREIGHT_BASE', 'BL', '선하증권', 'Bill of Lading', 5, 'Y', 'admin', NOW()),
('FREIGHT_BASE', 'SHIPMENT', '건별', 'Per Shipment', 6, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 7. 포장단위 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('PKG_TYPE', 'CT', '카톤', 'Carton', 1, 'Y', 'admin', NOW()),
('PKG_TYPE', 'PLT', '팔레트', 'Pallet', 2, 'Y', 'admin', NOW()),
('PKG_TYPE', 'BOX', '박스', 'Box', 3, 'Y', 'admin', NOW()),
('PKG_TYPE', 'BAG', '백', 'Bag', 4, 'Y', 'admin', NOW()),
('PKG_TYPE', 'DRM', '드럼', 'Drum', 5, 'Y', 'admin', NOW()),
('PKG_TYPE', 'PCS', '피스', 'Pieces', 6, 'Y', 'admin', NOW()),
('PKG_TYPE', 'PKG', '패키지', 'Package', 7, 'Y', 'admin', NOW()),
('PKG_TYPE', 'CRT', '크레이트', 'Crate', 8, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 8. 인코텀즈 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('INCOTERMS', 'FOB', '본선인도', 'Free On Board', 1, 'Y', 'admin', NOW()),
('INCOTERMS', 'CIF', '운임보험료포함', 'Cost Insurance Freight', 2, 'Y', 'admin', NOW()),
('INCOTERMS', 'CFR', '운임포함', 'Cost and Freight', 3, 'Y', 'admin', NOW()),
('INCOTERMS', 'EXW', '공장인도', 'Ex Works', 4, 'Y', 'admin', NOW()),
('INCOTERMS', 'FCA', '운송인인도', 'Free Carrier', 5, 'Y', 'admin', NOW()),
('INCOTERMS', 'CPT', '운송비지급', 'Carriage Paid To', 6, 'Y', 'admin', NOW()),
('INCOTERMS', 'CIP', '운송비보험료지급', 'Carriage Insurance Paid', 7, 'Y', 'admin', NOW()),
('INCOTERMS', 'DAP', '도착장소인도', 'Delivered At Place', 8, 'Y', 'admin', NOW()),
('INCOTERMS', 'DDP', '관세지급인도', 'Delivered Duty Paid', 9, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 9. 신고유형 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('FILING_TYPE', 'ORIGINAL', '최초신고', 'Original Filing', 1, 'Y', 'admin', NOW()),
('FILING_TYPE', 'AMENDMENT', '정정신고', 'Amendment', 2, 'Y', 'admin', NOW()),
('FILING_TYPE', 'CANCELLATION', '취소신고', 'Cancellation', 3, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 10. 신고종류 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('DECLARATION_TYPE', 'EXPORT', '수출신고', 'Export Declaration', 1, 'Y', 'admin', NOW()),
('DECLARATION_TYPE', 'IMPORT', '수입신고', 'Import Declaration', 2, 'Y', 'admin', NOW()),
('DECLARATION_TYPE', 'TRANSIT', '환적신고', 'Transit Declaration', 3, 'Y', 'admin', NOW()),
('DECLARATION_TYPE', 'BONDED', '보세신고', 'Bonded Declaration', 4, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 11. 중량단위 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('WEIGHT_UNIT', 'KG', '킬로그램', 'Kilogram', 1, 'Y', 'admin', NOW()),
('WEIGHT_UNIT', 'LB', '파운드', 'Pound', 2, 'Y', 'admin', NOW()),
('WEIGHT_UNIT', 'MT', '메트릭톤', 'Metric Ton', 3, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 12. 국가 코드
INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, USE_YN, CREATED_BY, CREATED_AT) VALUES
('COUNTRY', 'KR', '대한민국', 'Korea', 1, 'Y', 'admin', NOW()),
('COUNTRY', 'US', '미국', 'United States', 2, 'Y', 'admin', NOW()),
('COUNTRY', 'CN', '중국', 'China', 3, 'Y', 'admin', NOW()),
('COUNTRY', 'JP', '일본', 'Japan', 4, 'Y', 'admin', NOW()),
('COUNTRY', 'VN', '베트남', 'Vietnam', 5, 'Y', 'admin', NOW()),
('COUNTRY', 'TH', '태국', 'Thailand', 6, 'Y', 'admin', NOW()),
('COUNTRY', 'SG', '싱가포르', 'Singapore', 7, 'Y', 'admin', NOW()),
('COUNTRY', 'DE', '독일', 'Germany', 8, 'Y', 'admin', NOW()),
('COUNTRY', 'GB', '영국', 'United Kingdom', 9, 'Y', 'admin', NOW()),
('COUNTRY', 'NL', '네덜란드', 'Netherlands', 10, 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE CODE_NM = VALUES(CODE_NM);

-- 13. 관세사 데이터
INSERT INTO MST_CUSTOMS_BROKER (BROKER_ID, BROKER_CD, BROKER_NM, BROKER_NM_EN, LICENSE_NO, REPRESENTATIVE, TEL, FAX, EMAIL, ADDRESS, USE_YN, CREATED_BY, CREATED_AT) VALUES
('BRK001', 'KB001', '한국관세사', 'Korea Customs Broker', '2024-001', '김관세', '02-1234-5678', '02-1234-5679', 'korea@customs.com', '서울시 강남구 테헤란로 123', 'Y', 'admin', NOW()),
('BRK002', 'KB002', '대한통관', 'Daehan Customs', '2024-002', '이통관', '02-2345-6789', '02-2345-6790', 'daehan@customs.com', '서울시 중구 을지로 456', 'Y', 'admin', NOW()),
('BRK003', 'KB003', '글로벌관세법인', 'Global Customs Corp', '2024-003', '박글로벌', '032-123-4567', '032-123-4568', 'global@customs.com', '인천시 중구 공항로 789', 'Y', 'admin', NOW()),
('BRK004', 'KB004', '인천관세사', 'Incheon Customs', '2024-004', '최인천', '032-234-5678', '032-234-5679', 'incheon@customs.com', '인천시 연수구 송도동 111', 'Y', 'admin', NOW()),
('BRK005', 'KB005', '부산통관법인', 'Busan Customs Corp', '2024-005', '정부산', '051-345-6789', '051-345-6790', 'busan@customs.com', '부산시 중구 중앙대로 222', 'Y', 'admin', NOW())
ON DUPLICATE KEY UPDATE BROKER_NM = VALUES(BROKER_NM);

-- 14. 통관 테스트 데이터 (CUS_DECLARATION)
INSERT INTO CUS_DECLARATION (DECLARATION_ID, DECLARATION_NO, DECLARATION_TYPE, SHIPMENT_ID, MBL_NO, HBL_NO, CUSTOMS_BROKER_ID, DECLARATION_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, HS_CODE, GOODS_DESC, ORIGIN_COUNTRY, QUANTITY, QUANTITY_UNIT, GROSS_WEIGHT, NET_WEIGHT, WEIGHT_UNIT, DECLARED_VALUE, CURRENCY, DUTY_AMOUNT, TAX_AMOUNT, STATUS, CREATED_BY, CREATED_AT) VALUES
('DEC001', 'ED2024-001234', 'EXPORT', 'SHP001', 'KRPUS12345678', 'HBLEXP001', 'BRK001', '2024-01-15', '삼성전자', '서울시 서초구 삼성로 123', 'ABC Trading', '123 Main St, Los Angeles, CA 90001', '8528.72', '텔레비전 LCD 50인치', 'KR', 100, 'SET', 5000.00, 4800.00, 'KG', 150000.00, 'USD', 0.00, 0.00, 'ACCEPTED', 'admin', NOW()),
('DEC002', 'ED2024-001235', 'EXPORT', 'SHP002', 'KRPUS12345679', 'HBLEXP002', 'BRK002', '2024-01-16', 'LG전자', '서울시 영등포구 여의대로 456', 'XYZ Corp', '456 Commerce Blvd, Seattle, WA 98101', '8418.10', '냉장고 프렌치도어', 'KR', 50, 'SET', 8000.00, 7500.00, 'KG', 75000.00, 'USD', 0.00, 0.00, 'SUBMITTED', 'admin', NOW()),
('DEC003', 'ID2024-002345', 'IMPORT', 'SHP003', 'CNKRB23456789', 'HBLIMP001', 'BRK003', '2024-01-17', 'Shanghai Electronics', '200 Pudong Ave, Shanghai, China', '현대상사', '서울시 강남구 역삼동 789', '8471.30', '노트북 컴퓨터', 'CN', 200, 'SET', 1000.00, 950.00, 'KG', 200000.00, 'USD', 16000.00, 20000.00, 'CLEARED', 'admin', NOW()),
('DEC004', 'ID2024-002346', 'IMPORT', 'SHP004', 'VNKRB34567890', 'HBLIMP002', 'BRK004', '2024-01-18', 'Vietnam Textile Co.', '100 Hanoi Road, Hanoi, Vietnam', '동대문무역', '서울시 중구 동대문로 111', '6204.62', '여성의류 면제품', 'VN', 5000, 'PCS', 2500.00, 2400.00, 'KG', 50000.00, 'USD', 6500.00, 5000.00, 'SUBMITTED', 'admin', NOW()),
('DEC005', 'ED2024-001236', 'EXPORT', 'SHP005', 'KRSHA45678901', 'HBLEXP003', 'BRK005', '2024-01-19', '포스코', '경북 포항시 남구 포스코대로 1', 'China Steel Corp', '500 Industrial Zone, Guangzhou, China', '7208.51', '열연강판 코일', 'KR', 10, 'COIL', 250000.00, 250000.00, 'KG', 175000.00, 'USD', 0.00, 0.00, 'DRAFT', 'admin', NOW())
ON DUPLICATE KEY UPDATE DECLARATION_NO = VALUES(DECLARATION_NO);

-- 15. AMS 테스트 데이터 (CUS_AMS_MANIFEST - AMS_TYPE='AMS')
INSERT INTO CUS_AMS_MANIFEST (AMS_ID, SHIPMENT_ID, MBL_NO, HBL_NO, AMS_TYPE, FILING_TYPE, FILING_NO, FILING_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, NOTIFY_NAME, NOTIFY_ADDR, GOODS_DESC, CONTAINER_NO, SEAL_NO, WEIGHT, WEIGHT_UNIT, RESPONSE_CODE, RESPONSE_MSG, STATUS, CREATED_BY, CREATED_AT) VALUES
('AMS001', 'SHP001', 'KRPUS12345678', 'HBLEXP001', 'AMS', 'ORIGINAL', 'AMS2024001234', '2024-01-14', '삼성전자', '서울시 서초구 삼성로 123', 'ABC Trading', '123 Main St, Los Angeles, CA 90001', 'Same as Consignee', '123 Main St, Los Angeles, CA 90001', 'TELEVISION LCD 50 INCH', 'MSKU1234567', 'SL12345', 5000.00, 'KG', '1A', 'ACCEPTED', 'ACCEPTED', 'admin', NOW()),
('AMS002', 'SHP002', 'KRPUS12345679', 'HBLEXP002', 'AMS', 'ORIGINAL', 'AMS2024001235', '2024-01-15', 'LG전자', '서울시 영등포구 여의대로 456', 'XYZ Corp', '456 Commerce Blvd, Seattle, WA 98101', 'XYZ Corp', '456 Commerce Blvd, Seattle, WA 98101', 'REFRIGERATOR FRENCH DOOR TYPE', 'TCNU2345678', 'SL23456', 8000.00, 'KG', '1A', 'ACCEPTED', 'ACCEPTED', 'admin', NOW()),
('AMS003', 'SHP006', 'KRLAX56789012', 'HBLEXP004', 'AMS', 'ORIGINAL', 'AMS2024001236', '2024-01-16', '현대자동차', '서울시 서초구 현대로 789', 'US Auto Parts', '789 Motor Ave, Detroit, MI 48201', 'US Auto Parts', '789 Motor Ave, Detroit, MI 48201', 'AUTOMOBILE PARTS BRAKE SYSTEM', 'OOLU3456789', 'SL34567', 12000.00, 'KG', 'P1', 'PENDING', 'SUBMITTED', 'admin', NOW()),
('AMS004', 'SHP007', 'KRLAX67890123', 'HBLEXP005', 'AMS', 'AMENDMENT', 'AMS2024001237', '2024-01-17', 'SK하이닉스', '경기도 이천시 하이닉스로 1', 'Tech Solutions Inc', '100 Tech Park, San Jose, CA 95101', 'Tech Solutions Inc', '100 Tech Park, San Jose, CA 95101', 'SEMICONDUCTOR MEMORY CHIP', 'CMAU4567890', 'SL45678', 500.00, 'KG', 'A1', 'AMENDMENT ACCEPTED', 'ACCEPTED', 'admin', NOW()),
('AMS005', 'SHP008', 'KRNYC78901234', 'HBLEXP006', 'AMS', 'ORIGINAL', 'AMS2024001238', '2024-01-18', '한화솔루션', '서울시 중구 한화빌딩 1', 'Green Energy Corp', '200 Green Blvd, Houston, TX 77001', 'Green Energy Corp', '200 Green Blvd, Houston, TX 77001', 'SOLAR PANEL MODULE', 'EISU5678901', 'SL56789', 15000.00, 'KG', '', '', 'DRAFT', 'admin', NOW())
ON DUPLICATE KEY UPDATE FILING_NO = VALUES(FILING_NO);

-- 16. 적하목록 테스트 데이터 (CUS_AMS_MANIFEST - AMS_TYPE='MANIFEST')
INSERT INTO CUS_AMS_MANIFEST (AMS_ID, SHIPMENT_ID, MBL_NO, HBL_NO, AMS_TYPE, FILING_TYPE, FILING_NO, FILING_DATE, SHIPPER_NAME, SHIPPER_ADDR, CONSIGNEE_NAME, CONSIGNEE_ADDR, NOTIFY_NAME, NOTIFY_ADDR, GOODS_DESC, CONTAINER_NO, SEAL_NO, WEIGHT, WEIGHT_UNIT, RESPONSE_CODE, RESPONSE_MSG, STATUS, CREATED_BY, CREATED_AT) VALUES
('MF001', 'SHP003', 'CNKRB23456789', 'HBLIMP001', 'MANIFEST', 'ORIGINAL', 'MF2024001001', '2024-01-17', 'Shanghai Electronics', '200 Pudong Ave, Shanghai, China', '현대상사', '서울시 강남구 역삼동 789', '현대상사', '서울시 강남구 역삼동 789', 'NOTEBOOK COMPUTER LAPTOP', 'CSLU6789012', 'SM12345', 1000.00, 'KG', '10', 'ACCEPTED', 'ACCEPTED', 'admin', NOW()),
('MF002', 'SHP004', 'VNKRB34567890', 'HBLIMP002', 'MANIFEST', 'ORIGINAL', 'MF2024001002', '2024-01-18', 'Vietnam Textile Co.', '100 Hanoi Road, Hanoi, Vietnam', '동대문무역', '서울시 중구 동대문로 111', '동대문무역', '서울시 중구 동대문로 111', 'COTTON APPAREL WOMENS CLOTHING', 'HDMU7890123', 'SM23456', 2500.00, 'KG', '10', 'ACCEPTED', 'ACCEPTED', 'admin', NOW()),
('MF003', 'SHP009', 'JPKRB45678901', 'HBLIMP003', 'MANIFEST', 'ORIGINAL', 'MF2024001003', '2024-01-19', 'Tokyo Trading Co.', '1-1 Marunouchi, Chiyoda-ku, Tokyo', '롯데무역', '서울시 송파구 올림픽로 300', '롯데무역', '서울시 송파구 올림픽로 300', 'AUTOMOBILE ENGINE PARTS', 'NYKU8901234', 'SM34567', 5000.00, 'KG', 'P1', 'PENDING', 'SUBMITTED', 'admin', NOW()),
('MF004', 'SHP010', 'SGKRB56789012', 'HBLIMP004', 'MANIFEST', 'AMENDMENT', 'MF2024001004', '2024-01-20', 'Singapore Chem Pte Ltd', '10 Jurong Industrial, Singapore', '한화케미칼', '서울시 중구 청계천로 86', '한화케미칼', '서울시 중구 청계천로 86', 'CHEMICAL PRODUCTS INDUSTRIAL USE', 'SEGU9012345', 'SM45678', 20000.00, 'KG', 'A1', 'AMENDMENT RECEIVED', 'SUBMITTED', 'admin', NOW()),
('MF005', 'SHP011', 'DEKRB67890123', 'HBLIMP005', 'MANIFEST', 'ORIGINAL', 'MF2024001005', '2024-01-21', 'German Machinery GmbH', '100 Industrial Str, Hamburg, Germany', 'LS산전', '경기도 안양시 동안구 LS로 127', 'LS산전', '경기도 안양시 동안구 LS로 127', 'INDUSTRIAL MACHINERY EQUIPMENT', 'MSKU0123456', 'SM56789', 35000.00, 'KG', '', '', 'DRAFT', 'admin', NOW())
ON DUPLICATE KEY UPDATE FILING_NO = VALUES(FILING_NO);
